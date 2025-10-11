import type { HttpContext } from '@adonisjs/core/http'
import Database from '@adonisjs/lucid/services/db'
import Cart from '#models/cart'
import Order, { OrderStatus, PaymentStatus } from '#models/order'
import OrderItem from '#models/order_item'
import Product from '#models/product'
import { createOrderValidator, listOrdersValidator } from '#validators/order_validator'

export default class OrdersController {
  /**
   * Lister les commandes de l'utilisateur
   */
  async index({ auth, request, response }: HttpContext) {
    // Validation séparée pour permettre les erreurs de validation (400/422)
    const user = auth.getUserOrFail()
    const { page = 1, limit = 20, status, sortBy = 'createdAt', sortOrder = 'desc' } =
      await request.validateUsing(listOrdersValidator)

    try {
      const query = Order.query()
        .where('userId', user.id)
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('product')
        })
        .preload('shippingAddress')
        .preload('billingAddress')

      // Filtre par statut
      if (status) {
        query.where('status', status)
      }

      // Tri
      query.orderBy(sortBy, sortOrder)

      // Pagination
      const orders = await query.paginate(page, limit)

      return response.json({
        success: true,
        message: 'Orders retrieved successfully',
        data: {
          orders: orders.serialize(),
          pagination: {
            currentPage: orders.currentPage,
            perPage: orders.perPage,
            total: orders.total,
            lastPage: orders.lastPage,
            hasNext: orders.currentPage < orders.lastPage,
            hasPrev: orders.currentPage > 1,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve orders',
        errors: [error.message],
      })
    }
  }

  /**
   * Afficher les détails d'une commande
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const order = await Order.query()
        .where('id', params.id)
        .where('userId', user.id)
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('product')
        })
        .preload('shippingAddress')
        .preload('billingAddress')
        .firstOrFail()

      return response.json({
        success: true,
        message: 'Order retrieved successfully',
        data: { order: order.serialize() },
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        message: 'Order not found',
        errors: [error.message],
      })
    }
  }

  /**
   * Créer une commande depuis le panier
   */
  async store({ auth, request, response }: HttpContext) {
    const trx = await Database.transaction()

    try {
      const user = auth.getUserOrFail()
      const { shippingAddressId, billingAddressId, paymentMethod, notes } =
        await request.validateUsing(createOrderValidator)

      // Récupérer le panier actif
      const cart = await Cart.query()
        .where('userId', user.id)
        .where('status', 'active')
        .preload('items', (query) => {
          query.preload('product')
        })
        .first()

      if (!cart || cart.items.length === 0) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'Cart is empty',
        })
      }

      // Vérifier le stock de tous les produits
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          await trx.rollback()
          return response.status(422).json({
            success: false,
            message: 'Insufficient stock',
            errors: [
              `Product "${item.product.name}" has only ${item.product.stock} unit(s) available`,
            ],
          })
        }
      }

      // Calculer les totaux
      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.quantity * parseFloat(item.unitPrice),
        0
      )
      const shippingCost = 5000 // Frais de livraison fixes (à personnaliser)
      const tax = subtotal * 0.0 // Pas de taxe pour le moment
      const total = subtotal + shippingCost + tax

      // Générer le numéro de commande
      const orderNumber = await Order.generateOrderNumber()

      // Créer la commande
      const order = await Order.create(
        {
          userId: user.id,
          orderNumber,
          status: OrderStatus.PENDING,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          subtotal: subtotal.toString(),
          shippingCost: shippingCost.toString(),
          tax: tax.toString(),
          total: total.toString(),
          shippingAddressId: shippingAddressId || null,
          billingAddressId: billingAddressId || null,
          customerName: `${user.firstName} ${user.lastName}`,
          customerEmail: user.email,
          customerPhone: user.phone || '',
          notes,
        },
        { client: trx }
      )

      // Créer les items de commande et mettre à jour le stock
      for (const item of cart.items) {
        await OrderItem.create(
          {
            orderId: order.id,
            productId: item.product.id,
            productName: item.product.name,
            productReference: item.product.reference,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: (item.quantity * parseFloat(item.unitPrice)).toString(),
            productImageUrl: item.product.imageUrl,
          },
          { client: trx }
        )

        // Décrémenter le stock
        const product = await Product.findOrFail(item.product.id, { client: trx })
        product.stock -= item.quantity
        await product.save()
      }

      // Marquer le panier comme converti
      cart.useTransaction(trx)
      cart.status = 'converted'
      await cart.save()

      await trx.commit()

      // Recharger la commande avec les relations
      await order.load('items')
      await order.load('shippingAddress')
      await order.load('billingAddress')

      return response.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order: order.serialize() },
      })
    } catch (error) {
      await trx.rollback()
      return response.status(400).json({
        success: false,
        message: 'Failed to create order',
        errors: [error.message],
      })
    }
  }

  /**
   * Annuler une commande
   */
  async cancel({ auth, params, response }: HttpContext) {
    const trx = await Database.transaction()

    try {
      const user = auth.getUserOrFail()

      const order = await Order.query({ client: trx })
        .where('id', params.id)
        .where('userId', user.id)
        .preload('items', (query) => {
          query.preload('product')
        })
        .firstOrFail()

      // Vérifier que la commande peut être annulée
      if (
        ![OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING].includes(order.status)
      ) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'Order cannot be cancelled',
          errors: ['Only pending, paid, or processing orders can be cancelled'],
        })
      }

      // Remettre le stock
      for (const item of order.items) {
        if (item.product) {
          item.product.useTransaction(trx)
          item.product.stock += item.quantity
          await item.product.save()
        }
      }

      // Mettre à jour le statut
      await order.updateStatus(OrderStatus.CANCELLED, user.id)

      await trx.commit()

      return response.json({
        success: true,
        message: 'Order cancelled successfully',
        data: { order: order.serialize() },
      })
    } catch (error) {
      await trx.rollback()
      return response.status(400).json({
        success: false,
        message: 'Failed to cancel order',
        errors: [error.message],
      })
    }
  }
}
