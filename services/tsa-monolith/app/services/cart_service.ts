import { DateTime } from 'luxon'
import Cart, { CartStatus } from '#models/cart'
import CartItem from '#models/cart_item'
import Product from '#models/product'

export default class CartService {
  /**
   * Récupère ou crée un panier actif pour un utilisateur
   */
  async getOrCreateCart(userId: string): Promise<Cart> {
    // Chercher un panier actif non expiré
    let cart = await Cart.query()
      .where('userId', userId)
      .where('status', CartStatus.ACTIVE)
      .where('expiresAt', '>', DateTime.now().toSQL())
      .first()

    if (!cart) {
      // Créer un nouveau panier qui expire dans 7 jours
      cart = await Cart.create({
        userId,
        status: CartStatus.ACTIVE,
        expiresAt: DateTime.now().plus({ days: 7 }),
      })
    }

    // Charger les items avec les produits
    await cart.load('items', (query) => {
      query.preload('product')
    })

    return cart
  }

  /**
   * Ajoute un produit au panier ou met à jour sa quantité
   */
  async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    // Vérifier que le produit existe et est actif
    const product = await Product.query()
      .where('id', productId)
      .where('isActive', true)
      .firstOrFail()

    // Vérifier le stock disponible
    if (product.stock < quantity) {
      throw new Error(`Stock insuffisant. Disponible: ${product.stock}, Demandé: ${quantity}`)
    }

    const cart = await this.getOrCreateCart(userId)

    // Vérifier si le produit est déjà dans le panier
    const existingItem = await CartItem.query()
      .where('cartId', cart.id)
      .where('productId', productId)
      .first()

    if (existingItem) {
      // Mettre à jour la quantité
      const newQuantity = existingItem.quantity + quantity

      // Vérifier le stock pour la nouvelle quantité
      if (product.stock < newQuantity) {
        throw new Error(
          `Stock insuffisant. Disponible: ${product.stock}, Total demandé: ${newQuantity}`
        )
      }

      existingItem.quantity = newQuantity
      existingItem.priceAtAdd = product.price // Mettre à jour le prix
      await existingItem.save()
      await existingItem.load('product')
      return existingItem
    }

    // Créer un nouvel item
    const cartItem = await CartItem.create({
      cartId: cart.id,
      productId: product.id,
      quantity,
      priceAtAdd: product.price,
    })

    await cartItem.load('product')
    return cartItem
  }

  /**
   * Met à jour la quantité d'un article du panier
   */
  async updateItemQuantity(
    userId: string,
    cartItemId: string,
    quantity: number
  ): Promise<CartItem | null> {
    const cart = await this.getOrCreateCart(userId)

    const cartItem = await CartItem.query()
      .where('id', cartItemId)
      .where('cartId', cart.id)
      .preload('product')
      .firstOrFail()

    // Si quantité = 0, supprimer l'article
    if (quantity === 0) {
      await cartItem.delete()
      return null
    }

    // Vérifier le stock disponible
    if (cartItem.product.stock < quantity) {
      throw new Error(
        `Stock insuffisant. Disponible: ${cartItem.product.stock}, Demandé: ${quantity}`
      )
    }

    cartItem.quantity = quantity
    cartItem.priceAtAdd = cartItem.product.price // Mettre à jour le prix si changé
    await cartItem.save()

    return cartItem
  }

  /**
   * Retire un article du panier
   */
  async removeItem(userId: string, cartItemId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId)

    const cartItem = await CartItem.query()
      .where('id', cartItemId)
      .where('cartId', cart.id)
      .firstOrFail()

    await cartItem.delete()
  }

  /**
   * Vide complètement le panier
   */
  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId)

    await CartItem.query().where('cartId', cart.id).delete()
  }

  /**
   * Récupère le résumé du panier (total, nombre d'articles, etc.)
   */
  async getCartSummary(userId: string): Promise<{
    cart: Cart
    itemCount: number
    totalAmount: number
    items: CartItem[]
  }> {
    const cart = await this.getOrCreateCart(userId)
    await cart.load('items', (query) => {
      query.preload('product')
    })

    const itemCount = cart.items.reduce((count, item) => count + item.quantity, 0)
    const totalAmount = cart.items.reduce(
      (total, item) => total + item.priceAtAdd * item.quantity,
      0
    )

    return {
      cart,
      itemCount,
      totalAmount,
      items: cart.items,
    }
  }

  /**
   * Valide que tous les produits du panier sont disponibles en stock
   */
  async validateStock(cartId: string): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const cart = await Cart.findOrFail(cartId)
    await cart.load('items', (query) => {
      query.preload('product')
    })

    const errors: string[] = []

    for (const item of cart.items) {
      // Vérifier que le produit est actif
      if (!item.product.isActive) {
        errors.push(`Le produit "${item.product.name}" n'est plus disponible`)
        continue
      }

      // Vérifier le stock
      if (item.product.stock < item.quantity) {
        errors.push(
          `Stock insuffisant pour "${item.product.name}". Disponible: ${item.product.stock}, Demandé: ${item.quantity}`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Marque un panier comme converti (transformé en commande)
   */
  async markAsConverted(cartId: string): Promise<void> {
    const cart = await Cart.findOrFail(cartId)
    cart.status = CartStatus.CONVERTED
    await cart.save()
  }

  /**
   * Nettoie les paniers expirés (à exécuter périodiquement)
   */
  async cleanupExpiredCarts(): Promise<number> {
    const result = await Cart.query()
      .where('status', CartStatus.ACTIVE)
      .where('expiresAt', '<', DateTime.now().toSQL())
      .update({ status: CartStatus.ABANDONED })

    return result[0]
  }
}
