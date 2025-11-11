import vine from '@vinejs/vine'

/**
 * Address data schema for inline address creation
 */
const addressDataSchema = vine.object({
  street: vine.string().trim().minLength(1).maxLength(500),
  city: vine.string().trim().minLength(1).maxLength(100),
  region: vine.string().trim().minLength(1).maxLength(100),
  country: vine.string().trim().minLength(1).maxLength(100),
  postalCode: vine.string().trim().maxLength(20).optional().nullable(),
  latitude: vine.number().optional().nullable(),
  longitude: vine.number().optional().nullable(),
  label: vine.string().trim().maxLength(100).optional().nullable(),
  placeId: vine.string().trim().maxLength(500).optional().nullable(),
})

/**
 * Validator for creating an order from cart
 * Accepts either address IDs (if addresses exist) or address data (to create new addresses)
 * At least one option must be provided for both shipping and billing addresses
 */
export const createOrderValidator = vine.compile(
  vine.object({
    // Option 1: Use existing addresses by ID
    shippingAddressId: vine.string().uuid().optional(),
    billingAddressId: vine.string().uuid().optional(),
    // Option 2: Provide address data to create new addresses
    shippingAddress: addressDataSchema.optional(),
    billingAddress: addressDataSchema.optional(),
    // Payment details
    paymentMethod: vine.enum([
      'orange_money',
      'mtn_mobile_money',
      'moov_money',
      'wave',
      'bank_transfer',
      'cash_on_delivery',
    ]),
    notes: vine.string().maxLength(1000).trim().optional().nullable(),
  })
)

/**
 * Validator for updating order status (admin only)
 */
export const updateOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']),
    trackingNumber: vine.string().trim().maxLength(100).optional(),
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

/**
 * Validator for admin listing orders with advanced filters
 */
export const adminListOrdersValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    status: vine
      .enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
      .optional(),
    paymentStatus: vine.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
    paymentMethod: vine
      .enum([
        'orange_money',
        'mtn_mobile_money',
        'moov_money',
        'wave',
        'bank_transfer',
        'cash_on_delivery',
      ])
      .optional(),
    userId: vine.string().uuid().optional(),
    startDate: vine.string().trim().optional(),
    endDate: vine.string().trim().optional(),
    minAmount: vine.number().min(0).optional(),
    maxAmount: vine.number().min(0).optional(),
    search: vine.string().trim().maxLength(255).optional(),
    sortBy: vine.enum(['createdAt', 'total', 'status']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)

/**
 * Validator for refunding an order
 */
export const refundOrderValidator = vine.compile(
  vine.object({
    amount: vine.number().min(0).optional(),
    reason: vine.string().trim().minLength(1).maxLength(1000),
    refundShipping: vine.boolean().optional(),
  })
)

/**
 * Validator for bulk order actions
 */
export const bulkOrdersValidator = vine.compile(
  vine.object({
    orderIds: vine.array(vine.string().uuid()).minLength(1),
    action: vine.enum(['cancel', 'update_status', 'export', 'delete']),
    data: vine
      .object({
        status: vine
          .enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
          .optional(),
        reason: vine.string().trim().maxLength(1000).optional(),
      })
      .optional(),
  })
)
