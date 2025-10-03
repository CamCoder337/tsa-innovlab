import vine from '@vinejs/vine'

/**
 * Validateur pour la création/modification de messages
 */
export const messageValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(5000).escape(),

    type: vine.enum(['text', 'system']).optional(),
  })
)

/**
 * Validateur pour la recherche de messages
 */
export const messageSearchValidator = vine.compile(
  vine.object({
    search: vine.string().trim().minLength(2).maxLength(100).escape().optional(),

    page: vine.number().min(1).optional(),

    limit: vine.number().min(1).max(100).optional(),
  })
)
