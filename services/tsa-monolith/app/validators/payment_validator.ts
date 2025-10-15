import vine from '@vinejs/vine'

/**
 * Custom validation rule for Cameroon phone numbers (MTN)
 * Format: +237XXXXXXXXX or 237XXXXXXXXX or 6XXXXXXXX (9 digits)
 */
const phoneNumberRule = vine.string().regex(/^(\+?237)?6[5789]\d{7}$/)

/**
 * Validator for initiating a payment
 */
export const initiatePaymentValidator = vine.compile(
  vine.object({
    orderId: vine.string().uuid(),
    phoneNumber: phoneNumberRule,
  })
)

/**
 * Validator for confirming payment (admin only)
 */
export const confirmPaymentValidator = vine.compile(
  vine.object({
    transactionId: vine.string().maxLength(255).trim().optional().nullable(),
    metadata: vine.record(vine.any()).optional(),
  })
)
