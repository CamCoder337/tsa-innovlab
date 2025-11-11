import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Order, { OrderStatus, PaymentStatus } from '#models/order'
import OrderItem from '#models/order_item'
import Cart, { CartStatus } from '#models/cart'
import Product from '#models/product'
import Address from '#models/address'
import User from '#models/user'
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

      // Récupérer les informations de l'utilisateur
      const user = await User.findOrFail(userId, { client: trx })

      // Calculer les montants
      const subtotal = cart.items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0)
      const shippingCost = 0 // TODO: Calculate shipping cost
      const tax = 0 // TODO: Calculate tax
      const total = subtotal + shippingCost + tax

      // Créer la commande avec les adresses résolues
      const createdOrder = await Order.create(
        {
          userId,
          status: OrderStatus.PENDING,
          subtotal,
          shippingCost,
          tax,
          total,
          shippingAddressId: resolvedShippingAddressId,
          billingAddressId: resolvedBillingAddressId,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          customerName: `${user.firstName} ${user.lastName}`,
          customerEmail: user.email,
          customerPhone: user.phone || '',
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
      totalSpent: orders.reduce((sum, order) => sum + Number(order.total), 0),
      pendingOrders: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      completedOrders: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
    }
  }

  /**
   * Récupère toutes les commandes (admin seulement) avec filtres avancés
   */
  async getAllOrders(filters: {
    page?: number
    limit?: number
    status?: OrderStatus
    paymentStatus?: PaymentStatus
    paymentMethod?: string
    userId?: string
    startDate?: string
    endDate?: string
    minAmount?: number
    maxAmount?: number
    search?: string
    sortBy?: 'createdAt' | 'total' | 'status'
    sortOrder?: 'asc' | 'desc'
  }): Promise<any> {
    const page = filters.page || 1
    const limit = filters.limit || 20

    const query = Order.query()
      .preload('user')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('product')
      })
      .preload('shippingAddress')
      .preload('billingAddress')

    // Filtres
    if (filters.status) {
      query.where('status', filters.status)
    }

    if (filters.paymentStatus) {
      query.where('paymentStatus', filters.paymentStatus)
    }

    if (filters.paymentMethod) {
      query.where('paymentMethod', filters.paymentMethod)
    }

    if (filters.userId) {
      query.where('userId', filters.userId)
    }

    if (filters.startDate) {
      query.where('createdAt', '>=', filters.startDate)
    }

    if (filters.endDate) {
      query.where('createdAt', '<=', filters.endDate)
    }

    if (filters.minAmount) {
      query.where('total', '>=', filters.minAmount)
    }

    if (filters.maxAmount) {
      query.where('total', '<=', filters.maxAmount)
    }

    if (filters.search) {
      query.where((searchQuery) => {
        searchQuery
          .where('orderNumber', 'like', `%${filters.search}%`)
          .orWhere('customerName', 'like', `%${filters.search}%`)
          .orWhere('customerEmail', 'like', `%${filters.search}%`)
          .orWhere('customerPhone', 'like', `%${filters.search}%`)
      })
    }

    // Tri
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'
    query.orderBy(sortBy, sortOrder)

    return await query.paginate(page, limit)
  }

  /**
   * Récupère les détails d'une commande (admin seulement)
   */
  async getOrderByIdAdmin(orderId: string): Promise<Order> {
    return await Order.query()
      .where('id', orderId)
      .preload('user')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('product')
      })
      .preload('shippingAddress')
      .preload('billingAddress')
      .preload('payment')
      .firstOrFail()
  }

  /**
   * Annule une commande (admin seulement)
   */
  async cancelOrderAdmin(orderId: string, reason?: string): Promise<Order> {
    const order = await Order.findOrFail(orderId)

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error('Order is already cancelled')
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new Error('Cannot cancel a delivered order')
    }

    // Transaction pour restituer le stock
    await db.transaction(async (trx) => {
      order.status = OrderStatus.CANCELLED
      order.cancelledAt = DateTime.now()
      if (reason) {
        order.notes = order.notes ? `${order.notes}\n\nCancellation reason: ${reason}` : reason
      }
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
   * Rembourse une commande (admin seulement)
   */
  async refundOrder(orderId: string, reason: string): Promise<Order> {
    const order = await Order.findOrFail(orderId)

    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      throw new Error('Order is already refunded')
    }

    if (order.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new Error('Cannot refund an order that has not been paid')
    }

    order.paymentStatus = PaymentStatus.REFUNDED
    order.status = OrderStatus.REFUNDED
    order.notes = order.notes ? `${order.notes}\n\nRefund reason: ${reason}` : reason

    await order.save()

    // TODO: Intégrer avec le système de paiement pour le remboursement réel

    return order
  }

  /**
   * Récupère les statistiques des commandes pour l'admin
   */
  async getAdminOrderStats(): Promise<{
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    ordersByStatus: {
      pending: number
      paid: number
      processing: number
      shipped: number
      delivered: number
      cancelled: number
    }
    ordersByPaymentStatus: {
      pending: number
      completed: number
      failed: number
      refunded: number
    }
    recentOrders: Order[]
  }> {
    const allOrders = await Order.query()
    const recentOrders = await Order.query()
      .preload('user')
      .preload('items')
      .orderBy('createdAt', 'desc')
      .limit(10)

    const totalRevenue = allOrders
      .filter((o) => o.paymentStatus === PaymentStatus.COMPLETED)
      .reduce((sum, order) => sum + Number(order.total), 0)

    const ordersByStatus = {
      pending: allOrders.filter((o) => o.status === OrderStatus.PENDING).length,
      paid: allOrders.filter((o) => o.status === OrderStatus.PAID).length,
      processing: allOrders.filter((o) => o.status === OrderStatus.PROCESSING).length,
      shipped: allOrders.filter((o) => o.status === OrderStatus.SHIPPED).length,
      delivered: allOrders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      cancelled: allOrders.filter((o) => o.status === OrderStatus.CANCELLED).length,
    }

    const ordersByPaymentStatus = {
      pending: allOrders.filter((o) => o.paymentStatus === PaymentStatus.PENDING).length,
      completed: allOrders.filter((o) => o.paymentStatus === PaymentStatus.COMPLETED).length,
      failed: allOrders.filter((o) => o.paymentStatus === PaymentStatus.FAILED).length,
      refunded: allOrders.filter((o) => o.paymentStatus === PaymentStatus.REFUNDED).length,
    }

    return {
      totalOrders: allOrders.length,
      totalRevenue,
      averageOrderValue: allOrders.length > 0 ? totalRevenue / allOrders.length : 0,
      ordersByStatus,
      ordersByPaymentStatus,
      recentOrders,
    }
  }

  /**
   * Exporte les commandes en CSV (admin seulement)
   */
  async exportOrdersToCSV(filters: {
    status?: OrderStatus
    paymentStatus?: PaymentStatus
    userId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<string> {
    const query = Order.query()
      .preload('user')
      .preload('shippingAddress')
      .orderBy('createdAt', 'desc')

    if (filters.status) {
      query.where('status', filters.status)
    }

    if (filters.paymentStatus) {
      query.where('paymentStatus', filters.paymentStatus)
    }

    if (filters.userId) {
      query.where('userId', filters.userId)
    }

    if (filters.dateFrom) {
      query.where('createdAt', '>=', filters.dateFrom)
    }

    if (filters.dateTo) {
      query.where('createdAt', '<=', filters.dateTo)
    }

    const orders = await query

    // Construire le CSV
    const headers = [
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Status',
      'Payment Status',
      'Total',
      'Created At',
    ]
    let csv = headers.join(',') + '\n'

    for (const order of orders) {
      const row = [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.status,
        order.paymentStatus,
        order.total,
        order.createdAt.toISO(),
      ]
      csv += row.map((field) => `"${field}"`).join(',') + '\n'
    }

    return csv
  }
}
