import type { HttpContext } from '@adonisjs/core/http'
import missionTrackingService from '#services/mission_tracking_service'
import qrCodeService from '#services/qr_code_service'
import MissionIssue, { IssueType, IssueStatus, IssuePriority } from '#models/mission_issue'
import Conversation, { ConversationType } from '#models/conversation'
import { MissionStatus } from '#models/mission'
import { DateTime } from 'luxon'
import emitter from '@adonisjs/core/services/emitter'

/**
 * Controller pour le tracking GPS des missions par les chauffeurs
 * Authentification via Mission-Scoped JWT (voir DriverAuthController pour le login)
 *
 * La mission est automatiquement injectée dans request.mission par le middleware missionAccess
 * Le driver n'a pas besoin de compte utilisateur, juste du PIN de la mission
 */
export default class MissionTrackingController {
  async updateLocation({ request, response, logger }: HttpContext) {
    console.log('🚗 updateLocation called')

    // ✅ La mission est injectée par le middleware missionAccess
    const mission = request.mission!

    console.log(`✅ Mission from token: ${mission.id}`)

    console.log(`✅ Mission found: ${mission.id}`)

    const { latitude, longitude, speed, heading, accuracy } = request.only([
      'latitude',
      'longitude',
      'speed',
      'heading',
      'accuracy',
    ])

    if (!latitude || !longitude) {
      console.log('❌ Missing latitude or longitude')
      return response.badRequest({ success: false, message: 'Latitude and longitude are required' })
    }

    console.log(`📍 Recording location: ${latitude}, ${longitude}`)

    try {
      const locationUpdate = await missionTrackingService.recordLocationUpdate(
        mission,
        Number(latitude),
        Number(longitude),
        speed ? Number(speed) : undefined,
        heading ? Number(heading) : undefined,
        accuracy ? Number(accuracy) : undefined
      )

      console.log(`✅ Location recorded for mission ${mission.id}. Emitting event...`)
      logger.info(`Position recorded for mission ${mission.id}. Emitting event...`)

      // Emit event for the listener to handle WebSocket broadcast
      await emitter.emit('mission:location_update', {
        missionId: mission.id,
        location: locationUpdate,
      })

      console.log(`✅ Event mission:location_update emitted for mission ${mission.id}`)
      logger.info(`Event mission:location_update emitted for mission ${mission.id}`)

      return response.ok({
        success: true,
        message: 'Location updated successfully',
        data: { location: locationUpdate.toJSON() },
      })
    } catch (error) {
      console.error('❌ Error updating location:', error)
      logger.error('Error updating location', { missionId: mission.id, error: error.message })
      return response.internalServerError({ success: false, message: 'Failed to update location' })
    }
  }

  async getLocations({ request, response }: HttpContext) {
    // ✅ La mission est injectée par le middleware missionAccess
    const mission = request.mission!

    const limit = request.input('limit', 50)

    const locations = await missionTrackingService.getRecentLocations(mission.id, limit)

    return response.ok({
      success: true,
      data: {
        locations,
        mission: {
          id: mission.id,
          title: mission.title,
          status: mission.status,
        },
      },
    })
  }

  async getLastLocation({ request, response }: HttpContext) {
    // ✅ La mission est injectée par le middleware missionAccess
    const mission = request.mission!

    const location = await missionTrackingService.getLastLocation(mission.id)

    return response.ok({
      success: true,
      data: {
        location,
        mission: {
          id: mission.id,
          title: mission.title,
          status: mission.status,
        },
      },
    })
  }

  async reportIssue({ request, response }: HttpContext) {
    // ✅ La mission est injectée par le middleware missionAccess
    const mission = request.mission!

    const { type, description, latitude, longitude, photos } = request.only([
      'type',
      'description',
      'latitude',
      'longitude',
      'photos',
    ])

    if (!type || !description) {
      return response.badRequest({
        success: false,
        message: 'Type and description are required',
        errors: ['Missing required fields'],
      })
    }

    if (!Object.values(IssueType).includes(type)) {
      return response.badRequest({
        success: false,
        message: 'Invalid issue type',
        errors: [`Type must be one of: ${Object.values(IssueType).join(', ')}`],
      })
    }

    // Note: reportedById peut être undefined car le driver n'a pas de compte User
    const issue = await MissionIssue.create({
      missionId: mission.id,
      reportedById: mission.transporteurId ?? undefined, // Référence le transporteur propriétaire du véhicule
      type,
      description,
      latitude: latitude ? Number.parseFloat(latitude) : null,
      longitude: longitude ? Number.parseFloat(longitude) : null,
      photos: photos || null,
      status: IssueStatus.REPORTED,
    })

    return response.created({
      success: true,
      message: 'Issue reported successfully',
      data: { issue },
    })
  }

  async getIssues({ request, response }: HttpContext) {
    // ✅ La mission est injectée par le middleware missionAccess
    const mission = request.mission!

    const issues = await MissionIssue.query()
      .where('mission_id', mission.id)
      .orderBy('created_at', 'desc')

    return response.ok({
      success: true,
      data: { issues },
    })
  }

  /**
   * 🚨 SOS - Signaler une urgence
   * 
   * Endpoint dédié aux situations d'urgence (accident, panne grave, problème médical, sécurité)
   * Crée automatiquement une conversation d'urgence et notifie les admins + affréteur
   */
  async reportSOS({ request, response, mission, logger }: HttpContext) {
    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Mission not found',
        errors: ['Missing mission in context'],
      })
    }

    const { type, latitude, longitude, description } = request.only([
      'type',
      'latitude',
      'longitude',
      'description',
    ])

    // Validation du type d'urgence
    const validTypes = [IssueType.BREAKDOWN, IssueType.ACCIDENT, IssueType.MEDICAL, IssueType.SECURITY]
    if (!type || !validTypes.includes(type)) {
      return response.badRequest({
        success: false,
        message: 'Invalid SOS type',
        errors: [`Type must be one of: ${validTypes.join(', ')}`],
      })
    }

    // Validation GPS (requis pour SOS)
    if (!latitude || !longitude) {
      return response.badRequest({
        success: false,
        message: 'GPS location required for SOS',
        errors: ['latitude and longitude are required'],
      })
    }

    logger.info(`🚨 SOS received for mission ${mission.id}`, { type, latitude, longitude })

    try {
      // Déterminer la priorité selon le type
      const priorityMap: Record<string, IssuePriority> = {
        [IssueType.ACCIDENT]: IssuePriority.CRITICAL,
        [IssueType.MEDICAL]: IssuePriority.CRITICAL,
        [IssueType.SECURITY]: IssuePriority.CRITICAL,
        [IssueType.BREAKDOWN]: IssuePriority.HIGH,
      }
      const priority = priorityMap[type] || IssuePriority.HIGH

      // Charger les relations nécessaires
      await mission.load('affreteur')

      // Créer une conversation d'urgence si l'affréteur existe
      let emergencyConversation: Conversation | null = null
      if (mission.affreteurId && mission.transporteurId) {
        emergencyConversation = await Conversation.create({
          type: ConversationType.MISSION,
          user1Id: mission.transporteurId,
          user2Id: mission.affreteurId,
          missionId: mission.id,
          lastActivityAt: DateTime.now(),
        })
        logger.info(`📱 Emergency conversation created: ${emergencyConversation.id}`)
      }

      // Créer le MissionIssue avec flag urgence
      const issue = await MissionIssue.create({
        missionId: mission.id,
        reportedById: mission.transporteurId!,
        type,
        description: description || `SOS: ${type}`,
        latitude: Number.parseFloat(latitude),
        longitude: Number.parseFloat(longitude),
        status: IssueStatus.REPORTED,
        isEmergency: true,
        priority,
        emergencyConversationId: emergencyConversation?.id || null,
      })

      logger.info(`🚨 SOS Issue created: ${issue.id} (priority: ${priority})`)

      // Émettre l'événement SOS pour notification temps réel
      await emitter.emit('mission:sos_alert', {
        issue,
        mission,
      })

      return response.created({
        success: true,
        message: 'SOS received. Help is on the way.',
        data: {
          issue: {
            id: issue.id,
            type: issue.type,
            priority: issue.priority,
            status: issue.status,
            location: {
              lat: issue.latitude,
              lng: issue.longitude,
            },
            createdAt: issue.createdAt.toISO(),
          },
          conversationId: emergencyConversation?.id || null,
          emergencyContacts: {
            police: '117',
            samu: '119',
            pompiers: '118',
          },
        },
      })
    } catch (error) {
      logger.error('❌ Error creating SOS', { missionId: mission.id, error: error.message })
      return response.internalServerError({
        success: false,
        message: 'Failed to process SOS. Please call emergency services directly.',
        errors: [error.message],
        emergencyContacts: {
          police: '117',
          samu: '119',
          pompiers: '118',
        },
      })
    }
  }

  /**
   * Valide seulement le QR code sans finaliser la mission
   * Vérifie que le chauffeur connecté est autorisé à scanner ce QR code
   */
  async validateQRCode({ request, response }: HttpContext) {
    // ✅ La mission du chauffeur connecté est injectée par le middleware missionAccess
    const driverMission = request.mission!

    const { token, mission_id: qrMissionId } = request.qs()
    // Note: latitude, longitude disponibles pour future vérification de proximité

    if (!token || !qrMissionId) {
      return response.badRequest({
        success: false,
        message: 'Token and mission ID are required',
        errors: ['Missing parameters'],
      })
    }

    // Vérifier que le QR code correspond à la mission du chauffeur connecté
    if (driverMission.id !== qrMissionId) {
      return response.forbidden({
        success: false,
        message: 'You are not authorized to scan this QR code',
        errors: ['This QR code belongs to a different mission'],
      })
    }

    // Vérifier que le token QR code est valide
    const mission = await qrCodeService.verifyQrCodeToken(qrMissionId, token)

    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Invalid QR code',
        errors: ['The QR code is invalid or has expired'],
      })
    }

    if (mission.status !== 'in_progress') {
      return response.badRequest({
        success: false,
        message: 'Mission is not in progress',
        errors: ['The mission must be in progress to validate QR code'],
      })
    }

    // Note: Vérification de proximité désactivée pour les tests
    // La validation peut se faire depuis n'importe où

    return response.ok({
      success: true,
      message: 'QR code validated successfully',
      data: {
        missionId: mission.id,
        token: token,
        validated: true,
      },
    })
  }

  /**
   * Finalise la livraison de la mission
   * Utilisé après validation des preuves
   */
  async completeDelivery({ request, response }: HttpContext) {
    // ✅ La mission est injectée par le middleware missionAccess
    const mission = request.mission!

    const { missionId } = request.only(['missionId'])

    // Vérifier que l'ID de mission correspond à celle du chauffeur connecté
    if (mission.id !== missionId) {
      return response.forbidden({
        success: false,
        message: 'You are not authorized to complete this mission',
        errors: ['Mission ID mismatch'],
      })
    }

    if (mission.status !== 'in_progress') {
      return response.badRequest({
        success: false,
        message: 'Mission is not in progress',
        errors: ['The mission must be in progress to be completed'],
      })
    }

    // Finaliser la mission
    mission.status = MissionStatus.DELIVERED
    mission.deliveredAt = DateTime.now()
    await mission.save()

    return response.ok({
      success: true,
      message: 'Mission completed successfully',
      data: {
        mission: {
          id: mission.id,
          title: mission.title,
          status: mission.status,
          deliveredAt: mission.deliveredAt,
        },
      },
    })
  }

  /**
   * Validation de livraison via QR code (route publique)
   * Utilisée par l'affréteur pour confirmer la réception
   */
  async validateDelivery({ request, response }: HttpContext) {
    const { token, mission_id: missionId } = request.qs()
    // Note: latitude, longitude disponibles pour future vérification de proximité

    if (!token || !missionId) {
      return response.badRequest({
        success: false,
        message: 'Token and mission ID are required',
        errors: ['Missing parameters'],
      })
    }

    const mission = await qrCodeService.verifyQrCodeToken(missionId, token)

    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Invalid QR code',
        errors: ['The QR code is invalid or has expired'],
      })
    }

    if (mission.status !== 'in_progress') {
      return response.badRequest({
        success: false,
        message: 'Mission is not in progress',
        errors: ['The mission must be in progress to be delivered'],
      })
    }

    // Note: Vérification de proximité désactivée pour les tests
    // La validation peut se faire depuis n'importe où

    mission.status = MissionStatus.DELIVERED
    mission.deliveredAt = DateTime.now()
    await mission.save()

    return response.ok({
      success: true,
      message: 'Delivery confirmed successfully',
      data: {
        mission: {
          id: mission.id,
          title: mission.title,
          status: mission.status,
          deliveredAt: mission.deliveredAt,
        },
      },
    })
  }
}
