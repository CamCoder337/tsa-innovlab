import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'une conversation directe
 */
export const createDirectConversationValidator = vine.compile(
  vine.object({
    userId: vine.string().uuid(),
  })
)

/**
 * Validateur pour la création d'une conversation mission
 */
export const createMissionConversationValidator = vine.compile(
  vine.object({
    missionId: vine.string().uuid(),
    userId: vine.string().uuid(),
  })
)

/**
 * Validateur pour la recherche d'utilisateurs
 */
export const searchUsersValidator = vine.compile(
  vine.object({
    search: vine.string().trim().minLength(2).maxLength(100).escape().optional(),
    role: vine.enum(['admin', 'affreteur', 'transporteur']).optional(),
    limit: vine.number().min(1).max(50).optional(),
  })
)

/**
 * Validateur pour la pagination des conversations
 */
export const conversationIndexValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    type: vine.enum(['direct', 'mission']).optional(),
  })
)
