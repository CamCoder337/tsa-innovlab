import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import redis from '@adonisjs/redis/services/main'

/**
 * Rate Limiting Middleware
 * Protège l'API contre les abus et les attaques DDoS
 */
export default class RateLimitMiddleware {
  /**
   * Configuration du rate limiting
   */
  private config = {
    // Limites par endpoint
    limits: {
      default: { requests: 100, window: 60 }, // 100 req/min par défaut
      auth: { requests: 5, window: 60 }, // 5 tentatives de login/min
      ai: { requests: 50, window: 60 }, // 50 req AI/min
      search: { requests: 30, window: 60 }, // 30 recherches/min
    },
    // Durée du ban en secondes
    banDuration: 3600, // 1 heure
    // Seuil pour ban automatique
    banThreshold: 1000, // 1000 requêtes en 1 min = ban
  }

  async handle(ctx: HttpContext, next: NextFn) {
    try {
      const identifier = this._getIdentifier(ctx)
      const endpoint = this._getEndpointCategory(ctx.request.url())
      const limit = this.config.limits[endpoint] || this.config.limits.default

      // Vérifier si l'utilisateur est banni
      const isBanned = await this._checkBan(identifier)
      if (isBanned) {
        return ctx.response.status(429).json({
          success: false,
          message: 'Too many requests. You have been temporarily banned.',
          retry_after: await this._getBanTimeRemaining(identifier),
        })
      }

      // Incrémenter le compteur
      const count = await this._incrementCounter(identifier, endpoint, limit.window)

      // Ajouter headers de rate limit
      ctx.response.header('X-RateLimit-Limit', limit.requests.toString())
      ctx.response.header('X-RateLimit-Remaining', Math.max(0, limit.requests - count).toString())
      ctx.response.header('X-RateLimit-Reset', (Date.now() + limit.window * 1000).toString())

      // Vérifier si la limite est dépassée
      if (count > limit.requests) {
        // Si dépassement massif, bannir
        if (count > this.banThreshold) {
          await this._banUser(identifier)
          console.warn(`[RATE LIMIT] User ${identifier} banned for excessive requests`)
        }

        return ctx.response.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Please try again later.',
          retry_after: limit.window,
        })
      }

      // Log si proche de la limite
      if (count > limit.requests * 0.8) {
        console.warn(
          `[RATE LIMIT] User ${identifier} approaching limit: ${count}/${limit.requests}`
        )
      }

      await next()
    } catch (error) {
      // En cas d'erreur Redis, laisser passer (fail open)
      console.error('[RATE LIMIT ERROR]', error)
      await next()
    }
  }

  /**
   * Obtient l'identifiant unique de l'utilisateur
   */
  private _getIdentifier(ctx: HttpContext): string {
    // Priorité: User ID > IP
    const userId = ctx.auth.user?.id
    if (userId) {
      return `user:${userId}`
    }

    // Fallback sur IP
    const ip =
      ctx.request.header('x-forwarded-for')?.split(',')[0] ||
      ctx.request.header('x-real-ip') ||
      ctx.request.ip()

    return `ip:${ip}`
  }

  /**
   * Détermine la catégorie d'endpoint pour appliquer la bonne limite
   */
  private _getEndpointCategory(url: string): string {
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      return 'auth'
    }
    if (url.includes('/api/ai/') || url.includes('/api/shop/pieces/score')) {
      return 'ai'
    }
    if (url.includes('/search') || url.includes('/products?')) {
      return 'search'
    }
    return 'default'
  }

  /**
   * Incrémente le compteur de requêtes
   */
  private async _incrementCounter(
    identifier: string,
    endpoint: string,
    window: number
  ): Promise<number> {
    const key = `ratelimit:${identifier}:${endpoint}`

    // Incrémenter et définir expiration
    const count = await redis.incr(key)

    // Définir TTL seulement si c'est la première requête
    if (count === 1) {
      await redis.expire(key, window)
    }

    return count
  }

  /**
   * Vérifie si l'utilisateur est banni
   */
  private async _checkBan(identifier: string): Promise<boolean> {
    const banKey = `ratelimit:ban:${identifier}`
    const banned = await redis.get(banKey)
    return banned !== null
  }

  /**
   * Bannit un utilisateur temporairement
   */
  private async _banUser(identifier: string): Promise<void> {
    const banKey = `ratelimit:ban:${identifier}`
    await redis.setex(banKey, this.config.banDuration, '1')
  }

  /**
   * Obtient le temps restant du ban
   */
  private async _getBanTimeRemaining(identifier: string): Promise<number> {
    const banKey = `ratelimit:ban:${identifier}`
    const ttl = await redis.ttl(banKey)
    return ttl > 0 ? ttl : 0
  }
}
