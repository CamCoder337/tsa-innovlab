import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import { createOrderValidator, listOrdersValidator } from '#validators/order_validator'
import { OrderStatus } from '#models/order'

/**
 * Contrôleur pour la gestion des commandes client
 * Réservé aux utilisateurs avec le rôle CLIENT
 */
export default class OrdersController {
  private orderService: OrderService

  constructor() {
    this.orderService = new OrderService()
  }

  /**
   * Liste toutes les commandes du client
   * GET /api/client/orders
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const filters = await request.validateUsing(listOrdersValidator)

      const orders = await this.orderService.getUserOrders(
        user.id,
        filters.page || 1,
        filters.limit || 20,
        filters.status as OrderStatus | undefined
      )

      return response.ok({
        success: true,
        message: 'Orders retrieved successfully',
        data: orders,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to retrieve orders',
        error: error.message,
      })
    }
  }

  /**
   * Affiche les détails d'une commande
   * GET /api/client/orders/:id
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const order = await this.orderService.getOrderById(params.id, user.id)

      return response.ok({
        success: true,
        message: 'Order retrieved successfully',
        data: order,
      })
    } catch (error: any) {
      return response.notFound({
        success: false,
        message: 'Order not found',
        error: error.message,
      })
    }
  }

  /**
   * Crée une nouvelle commande à partir du panier
   * POST /api/client/orders
   */
  async store({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = await request.validateUsing(createOrderValidator)

      const order = await this.orderService.createOrderFromCart(
        user.id,
        data.shippingAddressId,
        data.billingAddressId,
        data.paymentMethod,
        data.notes || undefined
      )

      return response.created({
        success: true,
        message: 'Order created successfully',
        data: order,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to create order',
        error: error.message,
      })
    }
  }

  /**
   * Annule une commande
   * POST /api/client/orders/:id/cancel
   */
  async cancel({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const order = await this.orderService.cancelOrder(params.id, user.id)

      return response.ok({
        success: true,
        message: 'Order cancelled successfully',
        data: order,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to cancel order',
        error: error.message,
      })
    }
  }

  /**
   * Récupère les statistiques des commandes du client
   * GET /api/client/orders/stats
   */
  async stats({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const stats = await this.orderService.getUserOrderStats(user.id)

      return response.ok({
        success: true,
        message: 'Order statistics retrieved successfully',
        data: stats,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to retrieve order statistics',
        error: error.message,
      })
    }
  }
}
