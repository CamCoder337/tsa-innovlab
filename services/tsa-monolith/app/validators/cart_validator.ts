import vine from '@vinejs/vine'

/**
 * Validator pour ajouter un produit au panier
 */
export const addToCartValidator = vine.compile(
  vine.object({
    productId: vine.string().uuid(),
    quantity: vine.number().min(1).max(100).optional(),
  })
)

/**
 * Validator pour mettre à jour la quantité d'un item du panier
 */
export const updateCartItemValidator = vine.compile(
  vine.object({
    quantity: vine.number().min(1).max(100),
  })
)
