import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AccessToken from '#models/access_token'
import User from '#models/user'
import { Exception } from '@adonisjs/core/exceptions'
import { inject } from '@adonisjs/core'
import CacheService from '#services/cache_service'

/**
 * Middleware d'authentification personnalisé utilisant notre système de tokens avec cache Redis
 */
@inject()
export default class AuthMiddleware {
  constructor(private cacheService: CacheService) {}
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      // Fix double Bearer issue
      let authHeader = ctx.request.header('authorization')
      if (authHeader && authHeader.startsWith('Bearer Bearer ')) {
        authHeader = authHeader.replace('Bearer Bearer ', 'Bearer ')
        ctx.request.headers().authorization = authHeader
        console.log('🔧 TOKEN nettoyé: Bearer double → Bearer simple')
      }
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Exception('Token manquant ou invalide', { status: 401 })
      }
      
      const token = authHeader.replace('Bearer ', '')
      console.log('🔍 TOKEN reçu:', token.substring(0, 20) + '...')
      
      const startTime = Date.now()
      let authenticatedUser = null
      
      // 1. CACHE REDIS - Vérifier d'abord le cache (ULTRA RAPIDE ~1-5ms)
      const cacheKey = `tsa:token_user:${token}`
      const cachedUserId = await this.cacheService.get(cacheKey)
      
      if (cachedUserId) {
        console.log('🚀 Token trouvé dans le cache Redis')
        authenticatedUser = await User.find(cachedUserId)
        
        // Vérifier que l'utilisateur existe toujours
        if (authenticatedUser) {
          console.log(`⚡ Auth took ${Date.now() - startTime}ms (CACHED)`)
        } else {
          // Utilisateur supprimé, nettoyer le cache
          await this.cacheService.delete(cacheKey)
          console.log('🧹 Cache nettoyé - utilisateur inexistant')
        }
      }
      
      // 2. BASE DE DONNÉES - Seulement si pas en cache
      if (!authenticatedUser) {
        console.log('💾 Recherche optimisée en base de données')
        
        // Recherche SEULEMENT les tokens non expirés et récents (plus rapide)
        const validTokens = await AccessToken.query()
          .preload('user')
          .where('expires_at', '>', new Date())
          .orderBy('created_at', 'desc') // Les plus récents d'abord
          .limit(10) // Limite drastique : seulement les 10 plus récents
        
        // Vérifier les tokens (moins de boucles !)
        for (const at of validTokens) {
          const isValid = await at.verify(token)
          if (isValid) {
            authenticatedUser = at.user
            
            // 3. CACHE - Stocker le résultat pour 10 minutes
            await this.cacheService.set(cacheKey, authenticatedUser.id, 600)
            await at.touch() // Mettre à jour lastUsedAt
            console.log('💾 Token mis en cache pour 10 minutes')
            break // Important : sortir dès qu'on trouve
          }
        }
      }
      
      const duration = Date.now() - startTime
      console.log(`⚡ Auth took ${duration}ms - User:`, authenticatedUser?.email)
      
      if (!authenticatedUser) {
        throw new Exception('Token invalide ou expiré', { status: 401 })
      }
      
      // Vérifier que l'utilisateur est actif
      if (!authenticatedUser.isActive()) {
        throw new Exception('Compte utilisateur inactif', { status: 403 })
      }
      
      // Stocker l'utilisateur dans le contexte pour les contrôleurs
      ctx.user = authenticatedUser
      
      console.log('✅ Authentification réussie:', authenticatedUser.id)
      return next()
      
    } catch (error) {
      console.log('❌ Échec authentification:', error.message)
      
      if (error instanceof Exception) {
        throw error
      }
      
      throw new Exception('Unauthorized access', { status: 401 })
    }
  }
}