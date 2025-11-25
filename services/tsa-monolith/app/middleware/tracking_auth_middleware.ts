import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import missionTrackingService from '#services/mission_tracking_service'

/**
 * Middleware pour authentifier les requêtes de tracking
 * Vérifie le tracking token et le PIN dans les headers
 */
export default class TrackingAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // Récupérer le token et le PIN depuis les headers ou les paramètres
    const trackingToken =
      request.header('X-Tracking-Token') ||
      request.input('tracking_token') ||
      request.param('token')
    const trackingPin =
      request.header('X-Tracking-Pin') || request.input('tracking_pin') || request.input('pin')

    if (!trackingToken || !trackingPin) {
      return response.unauthorized({
        success: false,
        message: 'Tracking token and PIN are required',
        errors: ['Missing tracking credentials'],
      })
    }

    // Vérifier les credentials
    const mission = await missionTrackingService.verifyTrackingCredentials(
      trackingToken,
      trackingPin
    )

    if (!mission) {
      return response.unauthorized({
        success: false,
        message: 'Invalid tracking credentials',
        errors: ['The tracking token or PIN is incorrect'],
      })
    }

    // Ajouter la mission au contexte pour les contrôleurs suivants
    ctx.mission = mission

    await next()
  }
}
