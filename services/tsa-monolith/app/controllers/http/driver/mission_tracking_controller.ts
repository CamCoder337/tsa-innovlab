import type { HttpContext } from '@adonisjs/core/http'
import missionTrackingService from '#services/mission_tracking_service'
import qrCodeService from '#services/qr_code_service'
import MissionIssue, { IssueType, IssueStatus, IssuePriority } from '#models/mission_issue'
import Conversation, { ConversationType } from '#models/conversation'
import { MissionStatus } from '#models/mission'
import { DateTime } from 'luxon'
import emitter from '@adonisjs/core/services/emitter'

export default class MissionTrackingController {
  async authenticate({ request, response, logger }: HttpContext) {
    const { token } = request.params()
    const { pin } = request.only(['pin'])

    logger.info("Tentative d'authentification", {
      token: token ? '***' + token.slice(-4) : 'non fourni',
      pin: pin ? '***' + pin.slice(-1) : 'non fourni',
    })

    if (!pin) {
      logger.warn("Tentative d'authentification sans PIN")
      return response.badRequest({
        success: false,
        message: 'PIN is required',
        errors: ['Missing PIN'],
      })
    }

    try {
      const mission = await missionTrackingService.verifyTrackingCredentials(token, pin)

      if (!mission) {
        logger.warn("Échec de l'authentification: identifiants invalides", {
          token: token ? '***' + token.slice(-4) : 'non fourni',
        })
        return response.unauthorized({
          success: false,
          message: 'Invalid credentials',
          errors: ['The tracking token or PIN is incorrect'],
        })
      }

      logger.info('Authentification réussie', {
        missionId: mission.id,
        status: mission.status,
      })

      return response.ok({
        success: true,
        message: 'Authentication successful',
        data: {
          mission: {
            id: mission.id,
            title: mission.title,
            status: mission.status,
            departureAddress: mission.adresseDepart,
            arrivalAddress: mission.adresseArrivee,
            estimatedDeparture: mission.dateDepartEstime,
            estimatedArrival: mission.dateArriveePrevue,
            transporter: mission.transporteur
              ? {
                  id: mission.transporteur.id,
                  firstName: mission.transporteur.firstName,
                  lastName: mission.transporteur.lastName,
                }
              : null,
          },
        },
        trackingToken: token,
      })
    } catch (error) {
      logger.error("Erreur lors de l'authentification", error)
      return response.internalServerError({
        success: false,
        message: 'An error occurred during authentication',
        errors: [error.message],
      })
    }
  }

  async updateLocation({ request, response, mission, logger }: HttpContext) {
    console.log('🚗 updateLocation called')

    if (!mission) {
      console.log('❌ No mission in context')
      return response.unauthorized({ success: false, message: 'Mission not found' })
    }

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

  async getLocations({ request, response, mission }: HttpContext) {
    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Mission not found',
        errors: ['Missing mission in context'],
      })
    }
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

  async getLastLocation({ response, mission }: HttpContext) {
    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Mission not found',
        errors: ['Missing mission in context'],
      })
    }
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

  async reportIssue({ request, response, mission }: HttpContext) {
    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Mission not found',
        errors: ['Missing mission in context'],
      })
    }
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

    const issue = await MissionIssue.create({
      missionId: mission.id,
      reportedById: mission.transporteurId!,
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

  async getIssues({ response, mission }: HttpContext) {
    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Mission not found',
        errors: ['Missing mission in context'],
      })
    }
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

  async validateDelivery({ request, response }: HttpContext) {
    const { token, mission_id: missionId, latitude, longitude } = request.qs()

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

    if (latitude && longitude && mission.adresseArrivee) {
      await mission.load('adresseArrivee')
      const isNear = missionTrackingService.isNearDestination(
        Number.parseFloat(latitude),
        Number.parseFloat(longitude),
        mission.adresseArrivee.latitude!,
        mission.adresseArrivee.longitude!,
        200
      )

      if (!isNear) {
        return response.badRequest({
          success: false,
          message: 'You are too far from the delivery location',
          errors: ['You must be within 200 meters of the delivery location'],
        })
      }
    }

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
