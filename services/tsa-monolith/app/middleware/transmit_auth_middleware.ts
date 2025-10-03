import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'
import TransmitService from '#services/transmit_service'

/**
 * Middleware d'authentification pour les connexions WebSocket Transmit
 */
export default class TransmitAuthMiddleware {
  /**
   * Authentifie l'utilisateur pour les connexions WebSocket
   */
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    try {
      // 1. Vérifier le token JWT
      const token = request.header('authorization')?.replace('Bearer ', '')

      if (!token) {
        return response.unauthorized({
          success: false,
          message: "Token d'authentification requis pour WebSocket",
        })
      }

      // 2. Vérifier et décoder le token
      const payload = await User.accessTokens.verify(token as any)

      if (!payload) {
        return response.unauthorized({
          success: false,
          message: 'Token invalide',
        })
      }

      const user = await User.find(payload.identifier)

      if (!user) {
        return response.unauthorized({
          success: false,
          message: 'Utilisateur introuvable',
        })
      }

      // 3. Vérifier si l'utilisateur est actif
      if (user.status !== 'active') {
        return response.forbidden({
          success: false,
          message: 'Compte désactivé',
        })
      }

      // 4. Vérifier l'accès au channel si spécifié
      const channel = request.input('channel')
      if (channel) {
        const transmitService = new TransmitService()
        const canAccess = await transmitService.canAccessChannel(user, channel)

        if (!canAccess) {
          return response.forbidden({
            success: false,
            message: 'Accès refusé à ce channel',
          })
        }
      }

      // 5. Attacher l'utilisateur au contexte
      ;(ctx.auth as any).user = user

      // 6. Continuer vers la route
      await next()
    } catch (error) {
      console.error('❌ Erreur authentification WebSocket:', error)

      return response.unauthorized({
        success: false,
        message: 'Token invalide ou expiré',
        error: error.message,
      })
    }
  }

  /**
   * Middleware spécifique pour la subscription aux channels
   */
  async handleChannelSubscription(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    try {
      // Récupérer les informations du channel
      const { channel } = request.only(['channel'])

      if (!channel) {
        return response.badRequest({
          success: false,
          message: 'Channel requis',
        })
      }

      // L'utilisateur est déjà authentifié par le middleware auth principal
      const user = ctx.auth.user!

      // Vérifier l'accès au channel
      const transmitService = new TransmitService()
      const canAccess = await transmitService.canAccessChannel(user, channel)

      if (!canAccess) {
        return response.forbidden({
          success: false,
          message: `Accès refusé au channel: ${channel}`,
        })
      }

      // Log de la subscription pour debug
      console.log(`📡 Subscription WebSocket: ${user.email} → ${channel}`)

      await next()
    } catch (error) {
      console.error('❌ Erreur subscription channel:', error)

      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la subscription',
        error: error.message,
      })
    }
  }
}
