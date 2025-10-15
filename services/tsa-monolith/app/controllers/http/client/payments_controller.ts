import type { HttpContext } from '@adonisjs/core/http'
import PaymentService from '#services/payment_service'
import OrderService from '#services/order_service'
import { initiatePaymentValidator, confirmPaymentValidator } from '#validators/payment_validator'

/**
 * Contrôleur pour la gestion des paiements client
 * Support actuel : MTN Mobile Money
 */
export default class PaymentsController {
  private paymentService: PaymentService
  private orderService: OrderService

  constructor() {
    this.paymentService = new PaymentService()
    this.orderService = new OrderService()
  }

  /**
   * Initie un paiement MTN Mobile Money pour une commande
   * POST /api/client/payments/initiate
   */
  async initiate({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = await request.validateUsing(initiatePaymentValidator)

      // Vérifier que la commande appartient bien à l'utilisateur
      await this.orderService.getOrderById(data.orderId, user.id)

      // Initier le paiement
      const payment = await this.paymentService.initiatePayment(data.orderId, data.phoneNumber)

      return response.created({
        success: true,
        message: 'Payment initiated successfully. Please check your phone for MTN confirmation.',
        data: payment,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to initiate payment',
        error: error.message,
      })
    }
  }

  /**
   * Vérifie le statut d'un paiement
   * GET /api/client/payments/:id/status
   */
  async checkStatus({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const payment = await this.paymentService.checkPaymentStatus(params.id)

      // Vérifier que le paiement appartient à une commande de l'utilisateur
      await payment.load('order')
      if (payment.order.userId !== user.id) {
        return response.forbidden({
          success: false,
          message: 'Access denied',
        })
      }

      return response.ok({
        success: true,
        message: 'Payment status retrieved successfully',
        data: payment,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to check payment status',
        error: error.message,
      })
    }
  }

  /**
   * Confirme manuellement un paiement (développement uniquement)
   * POST /api/client/payments/:id/confirm
   *
   * ⚠️ Cette route sera supprimée en production
   * En production, la confirmation viendra du webhook MTN
   */
  async confirm({ auth, params, request, response }: HttpContext) {
    try {
      // Seulement en développement et en mode test
      const allowedEnvironments = ['development', 'testing', 'test']
      if (!allowedEnvironments.includes(process.env.NODE_ENV || 'development')) {
        return response.forbidden({
          success: false,
          message: 'This endpoint is only available in development and test modes',
        })
      }

      const user = auth.getUserOrFail()
      const data = await request.validateUsing(confirmPaymentValidator)

      // Vérifier que le paiement appartient à une commande de l'utilisateur
      const payment = await this.paymentService.checkPaymentStatus(params.id)
      await payment.load('order')

      if (payment.order.userId !== user.id) {
        return response.forbidden({
          success: false,
          message: 'Access denied',
        })
      }

      // Confirmer le paiement
      const confirmedPayment = await this.paymentService.confirmPayment(
        params.id,
        data.transactionId || `DEV-TXN-${Date.now()}`,
        data.metadata
      )

      return response.ok({
        success: true,
        message: 'Payment confirmed successfully',
        data: confirmedPayment,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to confirm payment',
        error: error.message,
      })
    }
  }

  /**
   * Récupère le paiement d'une commande
   * GET /api/client/orders/:orderId/payment
   */
  async getByOrder({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier que la commande appartient à l'utilisateur
      await this.orderService.getOrderById(params.orderId, user.id)

      const payment = await this.paymentService.getPaymentByOrderId(params.orderId)

      if (!payment) {
        return response.notFound({
          success: false,
          message: 'No payment found for this order',
        })
      }

      return response.ok({
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
      })
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: 'Failed to retrieve payment',
        error: error.message,
      })
    }
  }

  /**
   * Webhook MTN Mobile Money (à implémenter quand l'API est disponible)
   * POST /api/webhooks/mtn/payment-callback
   *
   * Cette route sera publique et recevra les notifications MTN
   */
  async mtnWebhook({ response }: HttpContext) {
    try {
      /**
       * TODO: Implémenter le webhook MTN
       *
       * 1. Valider la signature MTN pour s'assurer que la requête est légitime
       * 2. Extraire les données de la requête (transactionId, status, etc.)
       * 3. Mettre à jour le paiement en base de données
       *
       * Exemple :
       * const signature = request.header('x-mtn-signature')
       * if (!this.validateMTNSignature(signature, request.body())) {
       *   return response.forbidden({ success: false, message: 'Invalid signature' })
       * }
       *
       * const { transactionId, status, financialTransactionId } = request.body()
       * const payment = await Payment.query()
       *   .where('transactionId', transactionId)
       *   .firstOrFail()
       *
       * if (status === 'SUCCESSFUL') {
       *   await this.paymentService.confirmPayment(
       *     payment.id,
       *     financialTransactionId,
       *     request.body()
       *   )
       * } else if (status === 'FAILED') {
       *   await this.paymentService.failPayment(
       *     payment.id,
       *     request.input('reason')
       *   )
       * }
       */

      return response.ok({
        success: true,
        message: 'Webhook received',
      })
    } catch (error: any) {
      console.error('MTN Webhook error:', error)
      return response.badRequest({
        success: false,
        message: 'Failed to process webhook',
        error: error.message,
      })
    }
  }
}
