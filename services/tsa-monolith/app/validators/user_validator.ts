import vine from '@vinejs/vine'
import { UserRole, UserStatus } from '#models/user'

/**
 * Validateur pour les filtres de liste des utilisateurs
 */
export const listUsersValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    role: vine.enum(Object.values(UserRole)).optional(),
    status: vine.enum(Object.values(UserStatus)).optional(),
    search: vine.string().minLength(2).optional(),
  })
)

/**
 * Validateur pour le changement de statut utilisateur
 */
export const updateUserStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(Object.values(UserStatus)),
    reason: vine.string().minLength(3).maxLength(500).optional(),
  })
)
