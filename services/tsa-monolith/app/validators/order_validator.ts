import vine from '@vinejs/vine'

/**
 * Validator for creating an order from cart
 */
export const createOrderValidator = vine.compile(
  vine.object({
    shippingAddressId: vine.string().uuid(),
    billingAddressId: vine.string().uuid(),
    paymentMethod: vine.enum(['mtn_mobile_money']),
    notes: vine.string().maxLength(1000).trim().optional().nullable(),
  })
)

/**
 * Validator for updating order status (admin only)
 */
export const updateOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']),
  })
)

/**
 * Validator for listing orders with filters
 */
export const listOrdersValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    status: vine
      .enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'])
      .optional(),
    sortBy: vine.enum(['createdAt', 'totalAmount', 'status']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)
