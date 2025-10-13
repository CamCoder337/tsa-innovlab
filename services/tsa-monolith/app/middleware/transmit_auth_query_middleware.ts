import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware pour authentifier Transmit via token dans query string
 * Nécessaire car EventSource ne supporte pas les headers Authorization
 */
export default class TransmitAuthQueryMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request } = ctx

    try {
      // Récupérer le token depuis query string
      const token = request.input('token')

      if (!token) {
        console.log('⚠️  Transmit: Pas de token, connexion anonyme')
        return await next()
      }

      // Injecter le token dans le header Authorization pour que AdonisJS Auth puisse le gérer
      request.headers().authorization = `Bearer ${token}`

      // Utiliser l'authentification AdonisJS standard
      try {
        await ctx.auth.authenticateUsing(['api'])

        const user = ctx.auth.user
        if (user) {
          console.log(`✅ Transmit auth query: ${user.email} (${user.role})`)
        }
      } catch (authError) {
        console.log('❌ Transmit: Authentification échouée:', authError.message)
        // Ne pas bloquer, continuer sans authentification pour les canaux publics
      }
    } catch (error) {
      console.error('❌ Transmit auth query error:', error.message)
    }

    await next()
  }
}
