import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import AuditLog from '#models/audit_log'
import {
  adminListOrdersValidator,
  bulkOrdersValidator,
  refundOrderValidator,
  updateOrderStatusValidator,
} from '#validators/order_validator'
import { OrderStatus, PaymentStatus } from '#models/order'

/**
 * Contrôleur pour la gestion des commandes admin
 * Réservé aux utilisateurs avec le rôle ADMIN
 */
export default class OrdersController {
  private orderService: OrderService

  constructor() {
    this.orderService = new OrderService()
  }

  /**
   * Liste toutes les commandes avec filtres avancés
   * GET /api/admin/orders
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const filters = await request.validateUsing(adminListOrdersValidator)

      const orders = await this.orderService.getAllOrders({
        ...filters,
        status: filters.status as OrderStatus | undefined,
        paymentStatus: filters.paymentStatus as PaymentStatus | undefined,
      })

      // Log d'audit
      await AuditLog.create({
        userId: admin.id,
        action: 'LIST_ORDERS',
        entityType: 'orders',
        metadata: { filters },
      })

      return response.ok({
        success: true,
        message: 'Orders retrieved successfully',
        data: orders.serialize(),
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
   * GET /api/admin/orders/:id
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const order = await this.orderService.getOrderByIdAdmin(params.id)

      // Log d'audit
      await AuditLog.create({
        userId: admin.id,
        action: 'VIEW_ORDER',
        entityType: 'orders',
        entityId: params.id,
        metadata: { orderNumber: order.orderNumber },
      })

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
   * Met à jour le statut d'une commande
   * PUT /api/admin/orders/:id/status
   */
  async updateStatus({ auth, params, request, response }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const data = await request.validateUsing(updateOrderStatusValidator)

      const order = await this.orderService.updateOrderStatus(params.id, data.status as OrderStatus)

      // Log d'audit
      await AuditLog.create({
        userId: admin.id,
        action: 'UPDATE_ORDER_STATUS',
        entityType: 'orders',
        entityId: params.id,
        metadata: {
          orderNumber: order.orderNumber,
          newStatus: data.status,
        },
      })

      return response.ok({
        success: true,
        message: 'Order status updated successfully',
        data: order,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to update order status',
        error: error.message,
      })
    }
  }

  /**
   * Annule une commande
   * POST /api/admin/orders/:id/cancel
   */
  async cancel({ auth, params, request, response }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const { reason } = request.only(['reason'])

      const order = await this.orderService.cancelOrderAdmin(params.id, reason)

      // Log d'audit
      await AuditLog.create({
        userId: admin.id,
        action: 'CANCEL_ORDER',
        entityType: 'orders',
        entityId: params.id,
        metadata: {
          orderNumber: order.orderNumber,
          reason,
        },
      })

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
   * Rembourse une commande
   * POST /api/admin/orders/:id/refund
   */
  async refund({ auth, params, request, response }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const data = await request.validateUsing(refundOrderValidator)

      const order = await this.orderService.refundOrder(params.id, data.reason)

      // Log d'audit
      await AuditLog.create({
        userId: admin.id,
        action: 'REFUND_ORDER',
        entityType: 'orders',
        entityId: params.id,
        metadata: {
          orderNumber: order.orderNumber,
          reason: data.reason,
        },
      })

      return response.ok({
        success: true,
        message: 'Order refunded successfully',
        data: order,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to refund order',
        error: error.message,
      })
    }
  }

  /**
   * Récupère les statistiques des commandes
   * GET /api/admin/orders/stats
   */
  async stats({ auth, response }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const stats = await this.orderService.getAdminOrderStats()

      // Log d'audit
      await AuditLog.create({
        userId: admin.id,
        action: 'VIEW_ORDER_STATS',
        entityType: 'orders',
        metadata: {},
      })

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

  /**
   * Exporte les commandes en CSV
   * GET /api/admin/orders/export
   */
  async export({ auth, request, response }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const filters = request.only(['status', 'paymentStatus', 'userId', 'dateFrom', 'dateTo'])

      const csvContent = await this.orderService.exportOrdersToCSV({
        status: filters.status as OrderStatus | undefined,
        paymentStatus: filters.paymentStatus as PaymentStatus | undefined,
        userId: filters.userId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      })

      // Log d'audit
      await AuditLog.create({
        userId: admin.id,
        action: 'EXPORT_ORDERS',
        entityType: 'orders',
        metadata: { filters },
      })

      return response
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`)
        .send(csvContent)
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to export orders',
        error: error.message,
      })
    }
  }

  /**
   * Actions en masse sur les commandes
   * POST /api/admin/orders/bulk
   */
  async bulk({ auth, request, response }: HttpContext) {
    try {
      const admin = auth.getUserOrFail()
      const data = await request.validateUsing(bulkOrdersValidator)

      const results = {
        success: [] as string[],
        failed: [] as { id: string; error: string }[],
      }

      // Traiter chaque commande
      for (const orderId of data.orderIds) {
        try {
          if (data.action === 'update_status' && data.data?.status) {
            await this.orderService.updateOrderStatus(orderId, data.data.status as OrderStatus)
            results.success.push(orderId)
          } else if (data.action === 'cancel') {
            await this.orderService.cancelOrderAdmin(
              orderId,
              data.data?.reason || 'Bulk cancellation by admin'
            )
            results.success.push(orderId)
          }
        } catch (error: any) {
          results.failed.push({ id: orderId, error: error.message })
        }
      }

      // Log d'audit
      await AuditLog.create({
        userId: admin.id,
        action: 'BULK_ORDER_ACTION',
        entityType: 'orders',
        metadata: {
          action: data.action,
          status: data.data?.status,
          totalOrders: data.orderIds.length,
          successCount: results.success.length,
          failedCount: results.failed.length,
        },
      })

      return response.ok({
        success: true,
        message: `Bulk action completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
        data: results,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to perform bulk action',
        error: error.message,
      })
    }
  }
}
