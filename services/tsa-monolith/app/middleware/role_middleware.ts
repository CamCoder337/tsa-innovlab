import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { UserRole } from '#models/user'

/**
 * Middleware de contrôle d'accès par rôle
 */
export default class RoleMiddleware {
  /**
   * Vérifie si l'utilisateur a le rôle requis
   */
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      role?: UserRole
      roles?: UserRole[]
    } = {}
  ) {
    const { auth, response } = ctx

    // Vérifier que l'utilisateur est authentifié
    const user = auth.getUserOrFail()

    const { role, roles } = options

    // Si un seul rôle est spécifié
    if (role && !user.hasRole(role)) {
      return response.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.',
        required_role: role,
        user_role: user.role,
      })
    }

    // Si plusieurs rôles sont autorisés
    if (roles && !roles.includes(user.role)) {
      return response.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.',
        required_roles: roles,
        user_role: user.role,
      })
    }

    // Vérifier que le compte est actif
    if (!user.isActive()) {
      return response.status(403).json({
        success: false,
        message: 'Account is not active or is locked',
      })
    }

    // Pour les admins, vérifier que MFA est activé
    if (user.role === UserRole.ADMIN && user.mustEnableMFA()) {
      return response.status(403).json({
        success: false,
        message: 'MFA setup required for admin accounts',
        action_required: 'enable_mfa',
      })
    }

    await next()
  }
}

/**
 * Factory function pour créer un middleware de rôle
 */
export function roleMiddleware(role: UserRole): typeof RoleMiddleware
export function roleMiddleware(roles: UserRole[]): typeof RoleMiddleware
export function roleMiddleware(roleOrRoles: UserRole | UserRole[]): typeof RoleMiddleware {
  class ConfiguredRoleMiddleware extends RoleMiddleware {
    async handle(ctx: HttpContext, next: NextFn) {
      const options = Array.isArray(roleOrRoles) ? { roles: roleOrRoles } : { role: roleOrRoles }

      return super.handle(ctx, next, options)
    }
  }

  return ConfiguredRoleMiddleware
}
