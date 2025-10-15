import vine from '@vinejs/vine'

/**
 * Validator for adding an item to cart
 */
export const addToCartValidator = vine.compile(
  vine.object({
    productId: vine.string().uuid(),
    quantity: vine.number().min(1).max(999),
  })
)

/**
 * Validator for updating cart item quantity
 */
export const updateCartItemValidator = vine.compile(
  vine.object({
    quantity: vine.number().min(0).max(999), // 0 = supprimer l'article
  })
)
