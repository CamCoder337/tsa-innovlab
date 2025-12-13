import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'
import missionAccessService from '#services/mission_access_service'
import Mission from '#models/mission'

/**
 * Middleware pour authentifier les drivers via mission-scoped JWT
 *
 * Ce middleware remplace l'authentification traditionnelle (User + Role)
 * par une authentification basée sur l'accès à une mission spécifique via PIN
 *
 * Le driver n'a pas besoin de compte utilisateur, seulement du PIN de la mission
 *
 * @example
 * router.post('/location', '...').middleware(middleware.missionAccess())
 */
export default class MissionAccessMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // Récupérer le token du header Authorization
    const authHeader = request.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header',
        code: 'MISSING_AUTH_HEADER',
      })
    }

    try {
      const token = authHeader.replace('Bearer ', '')

      // Vérifier et décoder le token mission-scoped
      const payload = await missionAccessService.verifyMissionAccessToken(token)

      // Charger la mission complète avec ses relations
      const mission = await Mission.query()
        .where('id', payload.missionId)
        .whereIn('status', ['assigned', 'ready_to_start', 'in_progress'])
        .preload('vehicle')
        .preload('adresseDepart')
        .preload('adresseArrivee')
        .preload('affreteur')
        .preload('transporteur')
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found or no longer active',
          code: 'MISSION_NOT_FOUND',
        })
      }

      // ✅ Injecter la mission dans le contexte de la requête
      // Les controllers peuvent accéder à request.mission
      request.mission = mission
      request.missionAccess = {
        missionId: payload.missionId,
        vehicleId: payload.vehicleId,
        pin: payload.pin,
        expiresAt: payload.expiresAt,
      }

      await next()
    } catch (error) {
      if (error instanceof Exception) {
        return response.status(error.status || 401).json({
          success: false,
          message: error.message,
          code: 'INVALID_MISSION_TOKEN',
        })
      }

      return response.status(401).json({
        success: false,
        message: 'Invalid or expired mission access token',
        code: 'INVALID_TOKEN',
      })
    }
  }
}

// Étendre les types pour TypeScript
declare module '@adonisjs/core/http' {
  interface Request {
    mission?: Mission
    missionAccess?: {
      missionId: string
      vehicleId: string | null
      pin: string
      expiresAt: number
    }
  }
}
