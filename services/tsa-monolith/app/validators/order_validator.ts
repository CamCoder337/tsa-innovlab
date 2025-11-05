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
