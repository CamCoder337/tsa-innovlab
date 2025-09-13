import vine from '@vinejs/vine'

/**
 * Validator for creating a new product
 */
export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(255).trim(),
    description: vine.string().optional().nullable(),
    reference: vine.string().minLength(3).maxLength(100).trim().optional().nullable(),
    price: vine.number().positive().decimal([0, 2]),
    stock: vine.number().min(0).optional(),
    stockAlert: vine.number().min(0).optional(),
    unit: vine.string().maxLength(20).trim().optional(),
    categoryId: vine.string().uuid().optional().nullable(),
    imageUrl: vine.string().url().optional().nullable(),
    images: vine.array(vine.string().url()).optional(),
    specifications: vine.record(vine.any()).optional(),
    isActive: vine.boolean().optional(),
  })
)

/**
 * Validator for updating an existing product
 */
export const updateProductValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(255).trim().optional(),
    description: vine.string().optional().nullable(),
    reference: vine.string().minLength(3).maxLength(100).trim().optional().nullable(),
    price: vine.number().positive().decimal([0, 2]).optional(),
    stock: vine.number().min(0).optional(),
    stockAlert: vine.number().min(0).optional(),
    unit: vine.string().maxLength(20).trim().optional(),
    categoryId: vine.string().uuid().optional().nullable(),
    imageUrl: vine.string().url().optional().nullable(),
    images: vine.array(vine.string().url()).optional(),
    specifications: vine.record(vine.any()).optional(),
    isActive: vine.boolean().optional(),
  })
)

/**
 * Validator for product pagination and filtering
 */
export const productsListValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    search: vine.string().trim().optional(),
    categoryId: vine.string().uuid().optional(),
    isActive: vine.boolean().optional(),
    minPrice: vine.number().min(0).optional(),
    maxPrice: vine.number().min(0).optional(),
    inStock: vine.boolean().optional(),
    lowStock: vine.boolean().optional(),
    sortBy: vine.enum(['name', 'price', 'stock', 'createdAt', 'updatedAt']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)

/**
 * Validator for bulk operations on products
 */
export const bulkProductValidator = vine.compile(
  vine.object({
    productIds: vine.array(vine.string().uuid()).minLength(1),
    action: vine.enum(['activate', 'deactivate', 'delete']),
  })
)
