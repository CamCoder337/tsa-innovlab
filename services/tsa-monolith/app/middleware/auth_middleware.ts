import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import CacheService from '#services/cache_service'

/**
 * Auth middleware utilise maintenant le système AdonisJS intégré
 * avec nos tables existantes + vérification blacklist
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    // Fix double Bearer issue
    let authHeader = ctx.request.header('authorization')
    if (authHeader && authHeader.startsWith('Bearer Bearer ')) {
      authHeader = authHeader.replace('Bearer Bearer ', 'Bearer ')
      ctx.request.headers().authorization = authHeader
      console.log('🔧 TOKEN nettoyé: Bearer double → Bearer simple')
    }

    // Utiliser l'authentification AdonisJS standard
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    // Vérifier si le token est blacklisté après authentification réussie
    const token = authHeader?.replace('Bearer ', '')
    if (token) {
      const cacheService = new CacheService()
      const isBlacklisted = await cacheService.isTokenBlacklisted(token)

      if (isBlacklisted) {
        console.log('🚫 Token blacklisté détecté:', token.substring(0, 10) + '...')
        return ctx.response.status(401).json({
          success: false,
          message: 'Token has been revoked',
          error: 'TOKEN_BLACKLISTED',
        })
      }
    }

    console.log('✅ Authentification AdonisJS réussie:', ctx.auth.user?.id)
    return next()
  }
}
