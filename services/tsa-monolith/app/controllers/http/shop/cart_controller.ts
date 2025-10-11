import type { HttpContext } from '@adonisjs/core/http'
import Cart from '#models/cart'
import CartItem from '#models/cart_item'
import Product from '#models/product'
import { addToCartValidator, updateCartItemValidator } from '#validators/cart_validator'

export default class CartController {
  /**
   * Récupérer le panier actif de l'utilisateur
   */
  async index({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Récupérer ou créer le panier actif
      let cart = await Cart.query()
        .where('userId', user.id)
        .where('status', 'active')
        .preload('items', (query) => {
          query.preload('product', (productQuery) => {
            productQuery.preload('category')
          })
        })
        .first()

      if (!cart) {
        cart = await Cart.create({
          userId: user.id,
          status: 'active',
        })
        await cart.load('items')
      }

      const total = await cart.calculateTotal()
      const itemsCount = await cart.getTotalItems()

      return response.json({
        success: true,
        message: 'Cart retrieved successfully',
        data: {
          cart: cart.serialize(),
          total,
          itemsCount,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve cart',
        errors: [error.message],
      })
    }
  }

  /**
   * Ajouter un produit au panier
   */
  async addItem({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { productId, quantity = 1 } = await request.validateUsing(addToCartValidator)

      // Vérifier que le produit existe et est actif
      const product = await Product.query()
        .where('id', productId)
        .where('isActive', true)
        .firstOrFail()

      // Vérifier le stock disponible
      if (product.stock < quantity) {
        return response.status(422).json({
          success: false,
          message: 'Insufficient stock',
          errors: [`Only ${product.stock} unit(s) available`],
        })
      }

      // Récupérer ou créer le panier actif
      let cart = await Cart.query().where('userId', user.id).where('status', 'active').first()

      if (!cart) {
        cart = await Cart.create({
          userId: user.id,
          status: 'active',
        })
      }

      // Vérifier si le produit est déjà dans le panier
      let cartItem = await CartItem.query()
        .where('cartId', cart.id)
        .where('productId', productId)
        .first()

      if (cartItem) {
        // Mettre à jour la quantité
        const newQuantity = cartItem.quantity + quantity

        if (newQuantity > product.stock) {
          return response.status(422).json({
            success: false,
            message: 'Insufficient stock',
            errors: [`Only ${product.stock} unit(s) available`],
          })
        }

        cartItem.quantity = newQuantity
        await cartItem.save()
      } else {
        // Créer un nouvel item
        cartItem = await CartItem.create({
          cartId: cart.id,
          productId: product.id,
          quantity,
          unitPrice: product.price,
        })
      }

      await cartItem.load('product')

      return response.status(201).json({
        success: true,
        message: 'Product added to cart',
        data: { cartItem: cartItem.serialize() },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to add product to cart',
        errors: [error.message],
      })
    }
  }

  /**
   * Mettre à jour la quantité d'un item du panier
   */
  async updateItem({ auth, params, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { quantity } = await request.validateUsing(updateCartItemValidator)

      const cartItem = await CartItem.query()
        .where('id', params.id)
        .preload('cart')
        .preload('product')
        .firstOrFail()

      // Vérifier que le panier appartient à l'utilisateur
      if (cartItem.cart.userId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Access denied',
        })
      }

      // Vérifier le stock disponible
      if (cartItem.product.stock < quantity) {
        return response.status(422).json({
          success: false,
          message: 'Insufficient stock',
          errors: [`Only ${cartItem.product.stock} unit(s) available`],
        })
      }

      cartItem.quantity = quantity
      await cartItem.save()

      return response.json({
        success: true,
        message: 'Cart item updated',
        data: { cartItem: cartItem.serialize() },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to update cart item',
        errors: [error.message],
      })
    }
  }

  /**
   * Retirer un item du panier
   */
  async removeItem({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const cartItem = await CartItem.query().where('id', params.id).preload('cart').firstOrFail()

      // Vérifier que le panier appartient à l'utilisateur
      if (cartItem.cart.userId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Access denied',
        })
      }

      await cartItem.delete()

      return response.json({
        success: true,
        message: 'Cart item removed',
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to remove cart item',
        errors: [error.message],
      })
    }
  }

  /**
   * Vider le panier
   */
  async clear({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const cart = await Cart.query()
        .where('userId', user.id)
        .where('status', 'active')
        .preload('items')
        .first()

      if (!cart) {
        return response.status(404).json({
          success: false,
          message: 'Cart not found',
        })
      }

      // Supprimer tous les items
      await CartItem.query().where('cartId', cart.id).delete()

      return response.json({
        success: true,
        message: 'Cart cleared',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        errors: [error.message],
      })
    }
  }
}
