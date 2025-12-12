import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'

/**
 * @deprecated Ce middleware n'est plus utilisé depuis la migration vers JWT
 *
 * L'authentification des chauffeurs se fait maintenant via :
 * - Login: POST /api/driver/auth/login (avec PIN uniquement)
 * - Auth: Middleware auth standard (JWT via header Authorization: Bearer <token>)
 *
 * Voir DriverAuthController pour la nouvelle implémentation
 *
 * Ce fichier peut être supprimé après vérification complète du nouveau système
 */
export default class TrackingAuthMiddleware {
  async handle(_ctx: HttpContext, _next: NextFn) {
    throw new Exception(
      'TrackingAuthMiddleware is deprecated. Use standard auth middleware instead.',
      { status: 500 }
    )
  }
}
