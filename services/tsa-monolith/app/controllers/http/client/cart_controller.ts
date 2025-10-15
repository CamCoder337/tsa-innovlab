import type { HttpContext } from '@adonisjs/core/http'
import CartService from '#services/cart_service'
import { addToCartValidator, updateCartItemValidator } from '#validators/cart_validator'

/**
 * Contrôleur pour la gestion du panier client
 * Réservé aux utilisateurs avec le rôle CLIENT
 */
export default class CartController {
  private cartService: CartService

  constructor() {
    this.cartService = new CartService()
  }

  /**
   * Récupère le panier actuel du client
   * GET /api/client/cart
   */
  async index({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const summary = await this.cartService.getCartSummary(user.id)

      return response.ok({
        success: true,
        message: 'Cart retrieved successfully',
        data: summary,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to retrieve cart',
        error: error.message,
      })
    }
  }

  /**
   * Ajoute un produit au panier
   * POST /api/client/cart/items
   */
  async addItem({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = await request.validateUsing(addToCartValidator)

      const cartItem = await this.cartService.addItem(user.id, data.productId, data.quantity)

      return response.created({
        success: true,
        message: 'Product added to cart successfully',
        data: cartItem,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to add product to cart',
        error: error.message,
      })
    }
  }

  /**
   * Met à jour la quantité d'un article du panier
   * PUT /api/client/cart/items/:id
   */
  async updateItem({ auth, params, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = await request.validateUsing(updateCartItemValidator)

      const cartItem = await this.cartService.updateItemQuantity(user.id, params.id, data.quantity)

      if (cartItem === null) {
        return response.ok({
          success: true,
          message: 'Cart item removed successfully',
        })
      }

      return response.ok({
        success: true,
        message: 'Cart item updated successfully',
        data: cartItem,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to update cart item',
        error: error.message,
      })
    }
  }

  /**
   * Supprime un article du panier
   * DELETE /api/client/cart/items/:id
   */
  async removeItem({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      await this.cartService.removeItem(user.id, params.id)

      return response.ok({
        success: true,
        message: 'Cart item removed successfully',
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to remove cart item',
        error: error.message,
      })
    }
  }

  /**
   * Vide complètement le panier
   * DELETE /api/client/cart
   */
  async clear({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      await this.cartService.clearCart(user.id)

      return response.ok({
        success: true,
        message: 'Cart cleared successfully',
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to clear cart',
        error: error.message,
      })
    }
  }
}
