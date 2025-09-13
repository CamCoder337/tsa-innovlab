import vine from '@vinejs/vine'

/**
 * Validator for creating a new category
 */
export const createCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100).trim(),
    description: vine.string().optional().nullable(),
    parentId: vine.string().uuid().optional().nullable(),
    slug: vine.string().minLength(2).maxLength(100).optional().nullable(),
    imageUrl: vine.string().url().optional().nullable(),
    isActive: vine.boolean().optional(),
    displayOrder: vine.number().min(0).optional(),
  })
)

/**
 * Validator for updating an existing category
 */
export const updateCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100).trim().optional(),
    description: vine.string().optional().nullable(),
    parentId: vine.string().uuid().optional().nullable(),
    slug: vine.string().minLength(2).maxLength(100).optional().nullable(),
    imageUrl: vine.string().url().optional().nullable(),
    isActive: vine.boolean().optional(),
    displayOrder: vine.number().min(0).optional(),
  })
)

/**
 * Validator for category pagination and filtering
 */
export const categoriesListValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    search: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
    parentId: vine.string().uuid().optional().nullable(),
    sortBy: vine.enum(['name', 'displayOrder', 'createdAt', 'updatedAt']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)
