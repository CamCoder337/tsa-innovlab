import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'
import missionTrackingService from '#services/mission_tracking_service'

/**
 * Middleware pour authentifier les requêtes de tracking
 * Vérifie le tracking token et le PIN dans les headers
 */
export default class TrackingAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    try {
      // Récupérer le token depuis l'URL
      const tokenFromUrl = request.param('token')
      
      // Récupérer le token et le PIN depuis les headers ou les paramètres
      const trackingToken = request.header('X-Tracking-Token') || tokenFromUrl
      const trackingPin = request.header('X-Tracking-Pin')

      logger.info('🔐 Tentative d\'authentification tracking', {
        url: request.url(),
        method: request.method(),
        hasToken: !!trackingToken,
        hasPin: !!trackingPin,
        tokenFromUrl: tokenFromUrl ? '***' : 'non fourni'
      })

      if (!trackingToken || !trackingPin) {
        logger.warn('❌ Authentification échouée: identifiants manquants', {
          hasToken: !!trackingToken,
          hasPin: !!trackingPin
        })
        
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
        logger.warn('❌ Authentification échouée: identifiants invalides', {
          hasToken: !!trackingToken,
          hasPin: !!trackingPin
        })
        
        return response.unauthorized({
          success: false,
          message: 'Invalid tracking credentials',
          errors: ['The tracking token or PIN is incorrect'],
        })
      }

      logger.info('✅ Authentification tracking réussie', {
        missionId: mission.id,
        // Utilisation d'une propriété existante de la mission
        status: mission.status || 'inconnu'
      })

      console.log(`✅ Middleware: Mission ${mission.id} authenticated, proceeding to controller...`)

      // Ajouter la mission au contexte pour les contrôleurs suivants
      ctx.mission = mission

      await next()

      console.log(`✅ Middleware: Controller finished for mission ${mission.id}`)
    } catch (error) {
      logger.error('❌ Erreur lors de l\'authentification tracking', {
        error: error.message,
        stack: error.stack,
        url: request.url(),
        method: request.method()
      })
      
      return response.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
        error: error.message
      })
    }
  }
}
