import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'un feedback
 */
export const createFeedbackValidator = vine.compile(
  vine.object({
    rating: vine.number().min(1).max(5),
    description: vine.string().minLength(3).maxLength(1000).optional(),
  })
)

/**
 * Validateur pour la mise à jour d'un feedback
 */
export const updateFeedbackValidator = vine.compile(
  vine.object({
    rating: vine.number().min(1).max(5).optional(),
    description: vine.string().minLength(3).maxLength(1000).optional(),
  })
)
