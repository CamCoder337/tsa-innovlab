import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Mission from '#models/mission'
import CacheService from '#services/cache_service'
import missionAccessService from '#services/mission_access_service'
import { Exception } from '@adonisjs/core/exceptions'
import vine from '@vinejs/vine'

const loginValidator = vine.compile(
  vine.object({
    pin: vine.string().trim().minLength(6).maxLength(8),
  })
)

/**
 * @tags Driver Authentication
 */
@inject()
export default class DriverAuthController {
  constructor(private cacheService: CacheService) {}

  /**
   * @login
   * @summary Authentification chauffeur avec PIN (Mission-Scoped JWT)
   * @description Authentifie un driver via PIN et génère un token d'accès à UNE mission spécifique.
   *              Le driver n'a pas besoin de compte utilisateur, seulement du PIN.
   * @requestBody pin - Code PIN alphanumérique (6-8 caractères) - @required @type(string)
   * @responseBody 200 - Accès mission accordé avec token mission-scoped
   * @responseBody 401 - PIN invalide ou mission non trouvée
   * @responseBody 429 - Trop de tentatives de connexion
   */
  async login({ request, response }: HttpContext) {
    const { pin } = await request.validateUsing(loginValidator)
    const ipAddress = request.ip()
    const pinUpper = pin.toUpperCase()

    // Rate limiting par PIN (5 tentatives / 5 minutes)
    const rateLimitKey = `driver_login:${pinUpper}`
    const { allowed, resetAt } = await this.cacheService.checkRateLimit(
      rateLimitKey,
      5, // 5 tentatives
      300 // 5 minutes
    )

    if (!allowed) {
      const remainingMinutes = Math.ceil((resetAt - Date.now()) / (1000 * 60))
      return response.status(429).json({
        success: false,
        message: `Too many login attempts. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
      })
    }

    try {
      // Trouver la mission via le PIN (case insensitive)
      console.log(`[Driver Auth] Searching for mission with PIN: ${pinUpper}`)

      const mission = await Mission.query()
        .where('tracking_pin', pinUpper)
        .whereIn('status', ['assigned', 'ready_to_start', 'in_progress'])
        .preload('vehicle')
        .preload('adresseDepart')
        .preload('adresseArrivee')
        .preload('transporteur')
        .first()

      if (!mission) {
        // Log pour debug: vérifier si le PIN existe mais avec un autre statut
        const missionWithPin = await Mission.query().where('tracking_pin', pinUpper).first()

        if (missionWithPin) {
          console.log(
            `[Driver Auth] PIN found but mission status is: ${missionWithPin.status} (expected: assigned, ready_to_start, or in_progress)`
          )
        } else {
          console.log(`[Driver Auth] No mission found with PIN: ${pinUpper}`)
        }

        throw new Exception('Invalid PIN or no active mission', { status: 401 })
      }

      console.log(`[Driver Auth] Mission found: ${mission.id} (status: ${mission.status})`)

      // ✅ NOUVEAU: Générer un Mission-Scoped JWT (pas un user JWT!)
      // Ce token donne accès UNIQUEMENT à cette mission, pas à un compte utilisateur
      const missionAccessToken = await missionAccessService.generateMissionAccessToken(
        mission.id,
        mission.vehicleId,
        pinUpper,
        28800 // 8 heures (durée typique d'une mission)
      )

      // Log du tracking (sans user ID, juste mission + IP)
      console.log(
        `[Mission Access] PIN ${pinUpper} used for mission ${mission.id} from IP ${ipAddress}`
      )

      // Transformer les données pour correspondre à l'interface MissionDetails de l'app
      const departureAddress = mission.adresseDepart
        ? {
            id: mission.adresseDepart.id,
            street: mission.adresseDepart.street || '',
            city: mission.adresseDepart.city || '',
            postalCode: mission.adresseDepart.postalCode || '',
            country: mission.adresseDepart.country || '',
            latitude: mission.adresseDepart.latitude ?? 0,
            longitude: mission.adresseDepart.longitude ?? 0,
            fullAddress:
              `${mission.adresseDepart.street || ''}, ${mission.adresseDepart.city || ''}, ${mission.adresseDepart.country || ''}`.trim(),
          }
        : null

      const arrivalAddress = mission.adresseArrivee
        ? {
            id: mission.adresseArrivee.id,
            street: mission.adresseArrivee.street || '',
            city: mission.adresseArrivee.city || '',
            postalCode: mission.adresseArrivee.postalCode || '',
            country: mission.adresseArrivee.country || '',
            latitude: mission.adresseArrivee.latitude ?? 0,
            longitude: mission.adresseArrivee.longitude ?? 0,
            fullAddress:
              `${mission.adresseArrivee.street || ''}, ${mission.adresseArrivee.city || ''}, ${mission.adresseArrivee.country || ''}`.trim(),
          }
        : null

      // Vérifier que les adresses ont des coordonnées valides
      if (!departureAddress || !arrivalAddress) {
        throw new Exception('Mission addresses are missing', { status: 500 })
      }

      if (!departureAddress.latitude || !departureAddress.longitude) {
        throw new Exception('Departure address coordinates are missing', { status: 500 })
      }

      if (!arrivalAddress.latitude || !arrivalAddress.longitude) {
        throw new Exception('Arrival address coordinates are missing', { status: 500 })
      }

      return response.json({
        success: true,
        message: 'Mission access granted',
        data: {
          accessToken: missionAccessToken,
          expiresIn: 28800, // 8 heures
          tokenType: 'Bearer',
          mission: {
            id: mission.id,
            title: mission.title,
            status: mission.status,
            description: mission.description || '',
            estimatedDeparture: mission.dateDepartEstime?.toISO() || '',
            estimatedArrival: mission.dateArriveePrevue?.toISO() || '',
            departureAddress,
            arrivalAddress,
            transporter: mission.transporteur
              ? {
                  id: mission.transporteur.id,
                  firstName: mission.transporteur.firstName || '',
                  lastName: mission.transporteur.lastName || '',
                }
              : null,
          },
        },
      })
    } catch (error) {
      return response.status(error.status || 401).json({
        success: false,
        message: error.message || 'Authentication failed',
      })
    }
  }
}
