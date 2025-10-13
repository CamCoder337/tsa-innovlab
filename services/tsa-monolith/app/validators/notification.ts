import vine from '@vinejs/vine'

/**
 * Validateur pour la création de notifications
 */
export const notificationValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(255).escape(),

    message: vine.string().trim().minLength(1).maxLength(1000).escape(),

    priority: vine.enum(['low', 'normal', 'high', 'urgent']).optional(),

    type: vine
      .enum([
        'mission_new',
        'mission_assigned',
        'mission_status_changed',
        'message_received',
        'system',
      ])
      .optional(),

    actionUrl: vine.string().url().maxLength(500).optional(),
  })
)

/**
 * Validateur pour les filtres de notifications
 */
export const notificationFilterValidator = vine.compile(
  vine.object({
    filter: vine.enum(['all', 'unread', 'read', 'urgent']).optional(),

    page: vine.number().min(1).optional(),

    limit: vine.number().min(1).max(50).optional(),
  })
)
