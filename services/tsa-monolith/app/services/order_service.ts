import db from '@adonisjs/lucid/services/db'
import Order, { OrderStatus, PaymentStatus } from '#models/order'
import OrderItem from '#models/order_item'
import Cart, { CartStatus } from '#models/cart'
import Product from '#models/product'
import Address from '#models/address'
import CartService from '#services/cart_service'

export default class OrderService {
  private cartService: CartService

  constructor() {
    this.cartService = new CartService()
  }

  /**
   * Crée une commande à partir du panier actif de l'utilisateur
   * Supporte la création d'adresses inline ou l'utilisation d'adresses existantes
   */
  async createOrderFromCart(
    userId: string,
    shippingAddressId: string | undefined,
    shippingAddressData:
      | {
          street: string
          city: string
          region?: string | null
          country: string
          postalCode?: string | null
          latitude?: number | null
          longitude?: number | null
          label?: string | null
          placeId?: string | null
        }
      | undefined,
    billingAddressId: string | undefined,
    billingAddressData:
      | {
          street: string
          city: string
          region?: string | null
          country: string
          postalCode?: string | null
          latitude?: number | null
          longitude?: number | null
          label?: string | null
          placeId?: string | null
        }
      | undefined,
    paymentMethod: string,
    notes?: string
  ): Promise<Order> {
    // Transaction pour garantir la cohérence des données
    const order = await db.transaction(async (trx) => {
      // Résoudre l'adresse de livraison (créer ou utiliser existante)
      let resolvedShippingAddressId: string

      if (shippingAddressId) {
        // Option 1: Utiliser une adresse existante
        const shippingAddress = await Address.query({ client: trx })
          .where('id', shippingAddressId)
          .where('userId', userId)
          .first()

        if (!shippingAddress) {
          throw new Error(
            'Shipping address not found or does not belong to you. Please provide a valid shipping address.'
          )
        }
        resolvedShippingAddressId = shippingAddress.id
      } else if (shippingAddressData) {
        // Option 2: Créer une nouvelle adresse
        const newShippingAddress = await Address.create(
          {
            userId,
            ...shippingAddressData,
          },
          { client: trx }
        )
        resolvedShippingAddressId = newShippingAddress.id
      } else {
        throw new Error('Either shippingAddressId or shippingAddressData must be provided')
      }

      // Résoudre l'adresse de facturation (créer ou utiliser existante)
      let resolvedBillingAddressId: string

      if (billingAddressId) {
        // Option 1: Utiliser une adresse existante
        const billingAddress = await Address.query({ client: trx })
          .where('id', billingAddressId)
          .where('userId', userId)
          .first()

        if (!billingAddress) {
          throw new Error(
            'Billing address not found or does not belong to you. Please provide a valid billing address.'
          )
        }
        resolvedBillingAddressId = billingAddress.id
      } else if (billingAddressData) {
        // Option 2: Créer une nouvelle adresse
        const newBillingAddress = await Address.create(
          {
            userId,
            ...billingAddressData,
          },
          { client: trx }
        )
        resolvedBillingAddressId = newBillingAddress.id
      } else {
        throw new Error('Either billingAddressId or billingAddressData must be provided')
      }

      // Récupérer le panier actif avec ses articles
      const cart = await Cart.query({ client: trx })
        .where('userId', userId)
        .where('status', CartStatus.ACTIVE)
        .preload('items', (query) => {
          query.preload('product')
        })
        .first()

      // Vérifier que le panier existe et n'est pas vide
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty. Cannot create order.')
      }

      // Valider le stock pour tous les produits
      const stockValidation = await this.cartService.validateStock(cart.id)
      if (!stockValidation.valid) {
        throw new Error(`Stock validation failed: ${stockValidation.errors.join(', ')}`)
      }

      // Calculer le montant total
      const totalAmount = cart.items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0)

      // Créer la commande avec les adresses résolues
      const createdOrder = await Order.create(
        {
          userId,
          status: OrderStatus.PENDING,
          totalAmount,
          shippingAddressId: resolvedShippingAddressId,
          billingAddressId: resolvedBillingAddressId,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          notes: notes || null,
        },
        { client: trx }
      )

      // Créer les order items à partir des cart items
      for (const cartItem of cart.items) {
        await OrderItem.create(
          {
            orderId: createdOrder.id,
            productId: cartItem.productId,
            productName: cartItem.product.name, // Snapshot du nom
            quantity: cartItem.quantity,
            unitPrice: cartItem.priceAtAdd,
            totalPrice: cartItem.priceAtAdd * cartItem.quantity,
          },
          { client: trx }
        )

        // Décrémenter le stock
        const product = await Product.findOrFail(cartItem.productId, { client: trx })
        product.stock -= cartItem.quantity
        await product.save()
      }

      // Marquer le panier comme converti
      cart.status = CartStatus.CONVERTED
      await cart.save()

      return createdOrder
    })

    // Charger les relations avant de retourner
    await order.load('items')
    await order.load('shippingAddress')
    await order.load('billingAddress')

    return order
  }

  /**
   * Récupère toutes les commandes d'un utilisateur
   */
  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus
  ): Promise<any> {
    const query = Order.query()
      .where('userId', userId)
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('product')
      })
      .preload('shippingAddress')
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    return await query.paginate(page, limit)
  }

  /**
   * Récupère les détails d'une commande spécifique
   */
  async getOrderById(orderId: string, userId: string): Promise<Order> {
    return await Order.query()
      .where('id', orderId)
      .where('userId', userId)
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('product')
      })
      .preload('shippingAddress')
      .preload('billingAddress')
      .preload('payment')
      .firstOrFail()
  }

  /**
   * Annule une commande (si possible)
   */
  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await Order.query().where('id', orderId).where('userId', userId).firstOrFail()

    if (!order.canBeCancelled()) {
      throw new Error(`Order cannot be cancelled. Current status: ${order.status}`)
    }

    // Transaction pour restituer le stock
    await db.transaction(async (trx) => {
      order.status = OrderStatus.CANCELLED
      await order.save()

      // Restituer le stock pour chaque produit
      await order.load('items')
      for (const item of order.items) {
        const product = await Product.findOrFail(item.productId, { client: trx })
        product.stock += item.quantity
        await product.save()
      }
    })

    return order
  }

  /**
   * Met à jour le statut d'une commande (admin seulement)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await Order.findOrFail(orderId)
    order.status = status
    await order.save()

    return order
  }

  /**
   * Met à jour le statut de paiement d'une commande
   */
  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<Order> {
    const order = await Order.findOrFail(orderId)
    order.paymentStatus = paymentStatus

    // Si le paiement est complété, passer la commande en PAID
    if (paymentStatus === PaymentStatus.COMPLETED && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PAID
    }

    await order.save()
    return order
  }

  /**
   * Récupère les statistiques des commandes d'un utilisateur
   */
  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number
    totalSpent: number
    pendingOrders: number
    completedOrders: number
  }> {
    const orders = await Order.query().where('userId', userId)

    return {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      pendingOrders: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      completedOrders: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
    }
  }
}
