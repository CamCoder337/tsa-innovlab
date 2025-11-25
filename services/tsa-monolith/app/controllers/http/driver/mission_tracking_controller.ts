import type { HttpContext } from '@adonisjs/core/http'
import missionTrackingService from '#services/mission_tracking_service'
import qrCodeService from '#services/qr_code_service'
import MissionIssue, { IssueType, IssueStatus } from '#models/mission_issue'
import { DateTime } from 'luxon'

export default class MissionTrackingController {
  /**
   * POST /track/:token/authenticate
   * Authentifie un chauffeur avec le token et le PIN
   */
  async authenticate({ request, response }: HttpContext) {
    const { token } = request.params()
    const { pin } = request.only(['pin'])

    if (!pin) {
      return response.badRequest({
        success: false,
        message: 'PIN is required',
        errors: ['Missing PIN'],
      })
    }

    const mission = await missionTrackingService.verifyTrackingCredentials(token, pin)

    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Invalid credentials',
        errors: ['The tracking token or PIN is incorrect'],
      })
    }

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
          transporter: {
            id: mission.transporteur?.id,
            firstName: mission.transporteur?.firstName,
            lastName: mission.transporteur?.lastName,
          },
        },
        trackingToken: token,
      },
    })
  }

  /**
   * POST /track/:token/location
   * Enregistre une nouvelle position GPS
   * Requiert l'authentification via middleware
   */
  async updateLocation({ request, response, mission }: HttpContext) {
    const { latitude, longitude, speed, heading, accuracy } = request.only([
      'latitude',
      'longitude',
      'speed',
      'heading',
      'accuracy',
    ])

    if (!latitude || !longitude) {
      return response.badRequest({
        success: false,
        message: 'Latitude and longitude are required',
        errors: ['Missing GPS coordinates'],
      })
    }

    const locationUpdate = await missionTrackingService.recordLocationUpdate(
      mission,
      parseFloat(latitude),
      parseFloat(longitude),
      speed ? parseFloat(speed) : undefined,
      heading ? parseFloat(heading) : undefined,
      accuracy ? parseFloat(accuracy) : undefined
    )

    // Recharger la mission pour obtenir le statut mis à jour
    await mission.refresh()

    return response.ok({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: locationUpdate,
        mission: {
          id: mission.id,
          status: mission.status,
          startedAt: mission.startedAt,
        },
      },
    })
  }

  /**
   * GET /track/:token/locations
   * Récupère les dernières positions d'une mission
   */
  async getLocations({ request, response, mission }: HttpContext) {
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

  /**
   * GET /track/:token/last-location
   * Récupère la dernière position connue
   */
  async getLastLocation({ response, mission }: HttpContext) {
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

  /**
   * POST /track/:token/report-issue
   * Signale un problème pendant la mission
   */
  async reportIssue({ request, response, mission }: HttpContext) {
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

    // Vérifier que le type est valide
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
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      photos: photos || null,
      status: IssueStatus.REPORTED,
    })

    // TODO: Envoyer une notification à l'affréteur et à l'admin

    return response.created({
      success: true,
      message: 'Issue reported successfully',
      data: { issue },
    })
  }

  /**
   * GET /track/:token/issues
   * Récupère tous les problèmes signalés pour une mission
   */
  async getIssues({ response, mission }: HttpContext) {
    const issues = await MissionIssue.query().where('mission_id', mission.id).orderBy('created_at', 'desc')

    return response.ok({
      success: true,
      data: { issues },
    })
  }

  /**
   * GET /delivery-proof
   * Valide le QR code et marque la mission comme livrée
   */
  async validateDelivery({ request, response }: HttpContext) {
    const { token, mission_id, latitude, longitude } = request.qs()

    if (!token || !mission_id) {
      return response.badRequest({
        success: false,
        message: 'Token and mission ID are required',
        errors: ['Missing parameters'],
      })
    }

    const mission = await qrCodeService.verifyQrCodeToken(mission_id, token)

    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Invalid QR code',
        errors: ['The QR code is invalid or has expired'],
      })
    }

    // Vérifier que la mission est en cours
    if (mission.status !== 'in_progress') {
      return response.badRequest({
        success: false,
        message: 'Mission is not in progress',
        errors: ['The mission must be in progress to be delivered'],
      })
    }

    // Optionnel : Vérifier la proximité avec le point de livraison
    if (latitude && longitude && mission.adresseArrivee) {
      await mission.load('adresseArrivee')
      const isNear = missionTrackingService.isNearDestination(
        parseFloat(latitude),
        parseFloat(longitude),
        mission.adresseArrivee.latitude!,
        mission.adresseArrivee.longitude!,
        200 // 200 mètres
      )

      if (!isNear) {
        return response.badRequest({
          success: false,
          message: 'You are too far from the delivery location',
          errors: ['You must be within 200 meters of the delivery location'],
        })
      }
    }

    // Marquer la mission comme livrée
    mission.status = 'delivered'
    mission.deliveredAt = DateTime.now()
    await mission.save()

    // TODO: Envoyer une notification à l'affréteur et au transporteur

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
