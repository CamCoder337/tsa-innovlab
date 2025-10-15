import Payment, { PaymentMethod, PaymentStatus } from '#models/payment'
import Order from '#models/order'
import OrderService from '#services/order_service'
import { PaymentStatus as OrderPaymentStatus } from '#models/order'

/**
 * Service de gestion des paiements
 * Support actuel : MTN Mobile Money (simulation)
 *
 * TODO: Intégrer l'API réelle MTN Mobile Money quand disponible
 * Documentation API MTN: https://momodeveloper.mtn.com/
 */
export default class PaymentService {
  private orderService: OrderService

  constructor() {
    this.orderService = new OrderService()
  }

  /**
   * Initie un paiement MTN Mobile Money
   *
   * @param orderId - ID de la commande
   * @param phoneNumber - Numéro de téléphone MTN (format: +237XXXXXXXXX)
   * @returns Payment créé avec statut PENDING
   */
  async initiatePayment(orderId: string, phoneNumber: string): Promise<Payment> {
    // Vérifier que la commande existe et est valide
    const order = await Order.query()
      .where('id', orderId)
      .preload('payment')
      .firstOrFail()

    // Vérifier qu'un paiement n'existe pas déjà pour cette commande
    if (order.payment && order.payment.status === PaymentStatus.COMPLETED) {
      throw new Error('Order is already paid')
    }

    // Créer ou mettre à jour le paiement
    let payment: Payment

    if (order.payment) {
      payment = order.payment
      payment.phoneNumber = phoneNumber
      payment.status = PaymentStatus.PENDING
      await payment.save()
    } else {
      payment = await Payment.create({
        orderId: order.id,
        amount: order.totalAmount,
        method: PaymentMethod.MTN_MOBILE_MONEY,
        status: PaymentStatus.PENDING,
        phoneNumber,
        transactionId: null,
        metadata: {
          initiatedAt: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        },
      })
    }

    /**
     * TODO: Intégrer l'API MTN Mobile Money ici
     *
     * Étapes d'intégration :
     * 1. Générer un UUID de transaction
     * 2. Appeler l'API MTN Collections requestToPay
     * 3. Stocker le transactionId retourné
     * 4. Configurer un webhook pour recevoir les notifications de statut
     *
     * Exemple de code (à décommenter quand l'API est disponible) :
     *
     * const mtnApi = new MTNMobileMoneyAPI({
     *   subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY,
     *   apiUser: process.env.MTN_API_USER,
     *   apiKey: process.env.MTN_API_KEY,
     * })
     *
     * const transactionId = uuid.v4()
     * const result = await mtnApi.requestToPay({
     *   amount: order.totalAmount.toString(),
     *   currency: 'XAF',
     *   externalId: order.orderNumber,
     *   payer: { partyIdType: 'MSISDN', partyId: phoneNumber },
     *   payerMessage: `Paiement commande ${order.orderNumber}`,
     *   payeeNote: 'TSA Logistics',
     * }, transactionId)
     *
     * payment.transactionId = transactionId
     * await payment.save()
     */

    // Pour l'instant : simulation (mode développement uniquement)
    if (process.env.NODE_ENV === 'development') {
      console.log(`
      ════════════════════════════════════════════════════════════
      📱 SIMULATION PAIEMENT MTN MOBILE MONEY
      ════════════════════════════════════════════════════════════
      Commande:      ${order.orderNumber}
      Montant:       ${order.totalAmount} XAF
      Téléphone:     ${phoneNumber}

      ⚠️  Mode développement - Paiement en attente

      Pour simuler la confirmation, utilisez l'endpoint :
      POST /api/client/payments/${payment.id}/confirm
      ════════════════════════════════════════════════════════════
      `)
    }

    return payment
  }

  /**
   * Vérifie le statut d'un paiement auprès de MTN
   * Cette méthode sera appelée périodiquement ou via webhook
   */
  async checkPaymentStatus(paymentId: string): Promise<Payment> {
    const payment = await Payment.findOrFail(paymentId)

    if (payment.status === PaymentStatus.COMPLETED) {
      return payment
    }

    /**
     * TODO: Interroger l'API MTN pour obtenir le statut du paiement
     *
     * const mtnApi = new MTNMobileMoneyAPI(...)
     * const status = await mtnApi.getTransactionStatus(payment.transactionId)
     *
     * if (status.status === 'SUCCESSFUL') {
     *   await this.confirmPayment(payment.id, payment.transactionId, status)
     * } else if (status.status === 'FAILED') {
     *   await this.failPayment(payment.id, status.reason)
     * }
     */

    return payment
  }

  /**
   * Confirme un paiement (appelé par webhook MTN ou manuellement en dev)
   */
  async confirmPayment(
    paymentId: string,
    transactionId?: string,
    metadata?: any
  ): Promise<Payment> {
    const payment = await Payment.findOrFail(paymentId)

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new Error('Payment is already confirmed')
    }

    // Mettre à jour le paiement
    payment.status = PaymentStatus.COMPLETED
    payment.transactionId = transactionId || payment.transactionId
    payment.metadata = {
      ...payment.metadata,
      confirmedAt: new Date().toISOString(),
      ...metadata,
    }
    await payment.save()

    // Mettre à jour le statut de la commande
    await this.orderService.updatePaymentStatus(payment.orderId, OrderPaymentStatus.COMPLETED)

    console.log(`✅ Payment confirmed for order ${payment.orderId}`)

    return payment
  }

  /**
   * Marque un paiement comme échoué
   */
  async failPayment(paymentId: string, reason?: string): Promise<Payment> {
    const payment = await Payment.findOrFail(paymentId)

    payment.status = PaymentStatus.FAILED
    payment.metadata = {
      ...payment.metadata,
      failedAt: new Date().toISOString(),
      failureReason: reason || 'Unknown error',
    }
    await payment.save()

    // Mettre à jour le statut de la commande
    await this.orderService.updatePaymentStatus(payment.orderId, OrderPaymentStatus.FAILED)

    console.log(`❌ Payment failed for order ${payment.orderId}: ${reason}`)

    return payment
  }

  /**
   * Récupère un paiement par ID de commande
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return await Payment.query().where('orderId', orderId).first()
  }

  /**
   * Traite un remboursement (admin uniquement)
   */
  async refundPayment(paymentId: string, reason?: string): Promise<Payment> {
    const payment = await Payment.findOrFail(paymentId)

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Only completed payments can be refunded')
    }

    /**
     * TODO: Appeler l'API MTN pour initier le remboursement
     */

    payment.status = PaymentStatus.REFUNDED
    payment.metadata = {
      ...payment.metadata,
      refundedAt: new Date().toISOString(),
      refundReason: reason || 'Customer request',
    }
    await payment.save()

    console.log(`💰 Payment refunded for order ${payment.orderId}`)

    return payment
  }
}
