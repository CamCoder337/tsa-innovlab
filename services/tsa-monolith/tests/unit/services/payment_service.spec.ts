import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import PaymentService from '#services/payment_service'
import OrderService from '#services/order_service'
import CartService from '#services/cart_service'
import { PaymentStatus } from '#models/payment'
import Order, { PaymentStatus as OrderPaymentStatus } from '#models/order'
import User, { UserRole, UserStatus } from '#models/user'
import Product from '#models/product'
import Category from '#models/category'
import Address from '#models/address'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('PaymentService', (group) => {
  // @ts-ignore - Database transactions for tests
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  let paymentService: PaymentService
  let orderService: OrderService
  let cartService: CartService
  let user: User
  let category: Category
  let product: Product
  let shippingAddress: Address
  let billingAddress: Address
  let order: Order

  group.each.setup(async () => {
    paymentService = new PaymentService()
    orderService = new OrderService()
    cartService = new CartService()

    // Créer utilisateur
    user = await User.create({
      email: 'paymentservice-test@example.com',
      passwordHash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+237600000000',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Créer adresses
    shippingAddress = await Address.create({
      street: '123 Test Street',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '00000',
    })

    billingAddress = await Address.create({
      street: '456 Billing Street',
      city: 'Yaoundé',
      region: 'Centre',
      country: 'Cameroun',
      postalCode: '11111',
    })

    // Créer catégorie et produit
    category = await Category.create({
      name: 'Test Category',
      description: 'Test description',
      slug: 'test-category',
      isActive: true,
    })

    product = await Product.create({
      name: 'Test Product',
      description: 'Test description',
      price: 5000,
      stock: 10,
      categoryId: category.id,
      isActive: true,
      reference: 'TEST-PRODUCT-001',
    })

    // Créer commande
    await cartService.addItem(user.id, product.id, 2)
    order = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      undefined,
      billingAddress.id,
      undefined,
      'mtn_mobile_money'
    )
  })

  test('should initiate payment successfully', async ({ assert }) => {
    const payment = await paymentService.initiatePayment(order.id, '+237650000000')

    assert.isDefined(payment, 'Payment should be created')
    assert.equal(payment.orderId, order.id, 'Payment should be linked to order')
    assert.equal(payment.amount, order.total, 'Payment amount should match order total')
    assert.equal(payment.status, PaymentStatus.PENDING, 'Payment should be PENDING')
    assert.equal(payment.phoneNumber, '+237650000000', 'Phone number should be saved')
  })

  test('should throw error when initiating payment for already paid order', async ({ assert }) => {
    // Initier premier paiement
    const payment1 = await paymentService.initiatePayment(order.id, '+237650000000')

    // Confirmer le paiement
    await paymentService.confirmPayment(payment1.id, 'TXN-123')

    // Essayer d'initier un nouveau paiement
    await assert.rejects(async () => {
      await paymentService.initiatePayment(order.id, '+237650000001')
    }, 'Order is already paid')
  })

  test('should confirm payment successfully', async ({ assert }) => {
    // Initier paiement
    const payment = await paymentService.initiatePayment(order.id, '+237650000000')

    // Confirmer le paiement
    const confirmedPayment = await paymentService.confirmPayment(payment.id, 'MTN-TXN-123456', {
      confirmationCode: 'ABC123',
    })

    assert.equal(confirmedPayment.status, PaymentStatus.COMPLETED, 'Payment should be COMPLETED')
    assert.equal(confirmedPayment.transactionId, 'MTN-TXN-123456', 'Transaction ID should be saved')
    assert.isDefined(confirmedPayment.metadata.confirmedAt, 'Should have confirmation timestamp')

    // Vérifier que la commande a été mise à jour
    await order.refresh()
    assert.equal(
      order.paymentStatus,
      OrderPaymentStatus.COMPLETED,
      'Order payment status should be COMPLETED'
    )
  })

  test('should throw error when confirming already confirmed payment', async ({ assert }) => {
    // Initier et confirmer paiement
    const payment = await paymentService.initiatePayment(order.id, '+237650000000')
    await paymentService.confirmPayment(payment.id, 'TXN-123')

    // Essayer de confirmer à nouveau
    await assert.rejects(async () => {
      await paymentService.confirmPayment(payment.id, 'TXN-456')
    }, 'Payment is already confirmed')
  })

  test('should fail payment successfully', async ({ assert }) => {
    // Initier paiement
    const payment = await paymentService.initiatePayment(order.id, '+237650000000')

    // Marquer comme échoué
    const failedPayment = await paymentService.failPayment(payment.id, 'Insufficient funds')

    assert.equal(failedPayment.status, PaymentStatus.FAILED, 'Payment should be FAILED')
    assert.equal(
      failedPayment.metadata.failureReason,
      'Insufficient funds',
      'Should store failure reason'
    )

    // Vérifier que la commande a été mise à jour
    await order.refresh()
    assert.equal(
      order.paymentStatus,
      OrderPaymentStatus.FAILED,
      'Order payment status should be FAILED'
    )
  })

  test('should check payment status', async ({ assert }) => {
    // Initier paiement
    const payment = await paymentService.initiatePayment(order.id, '+237650000000')

    // Vérifier le statut
    const checkedPayment = await paymentService.checkPaymentStatus(payment.id)

    assert.equal(checkedPayment.id, payment.id, 'Should return correct payment')
    assert.equal(checkedPayment.status, PaymentStatus.PENDING, 'Status should still be PENDING')
  })

  test('should get payment by order id', async ({ assert }) => {
    // Initier paiement
    const createdPayment = await paymentService.initiatePayment(order.id, '+237650000000')

    // Récupérer par order ID
    const payment = await paymentService.getPaymentByOrderId(order.id)

    assert.isDefined(payment, 'Payment should be found')
    assert.equal(payment!.id, createdPayment.id, 'Should return correct payment')
  })

  test('should return null when no payment exists for order', async ({ assert }) => {
    // Créer nouvelle commande sans paiement
    await cartService.addItem(user.id, product.id, 1)
    const newOrder = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      undefined,
      billingAddress.id,
      undefined,
      'mtn_mobile_money'
    )

    // Chercher paiement
    const payment = await paymentService.getPaymentByOrderId(newOrder.id)

    assert.isNull(payment, 'Should return null when no payment exists')
  })

  test('should refund completed payment', async ({ assert }) => {
    // Initier et confirmer paiement
    const payment = await paymentService.initiatePayment(order.id, '+237650000000')
    await paymentService.confirmPayment(payment.id, 'TXN-123')

    // Rembourser
    const refundedPayment = await paymentService.refundPayment(
      payment.id,
      'Customer request for refund'
    )

    assert.equal(refundedPayment.status, PaymentStatus.REFUNDED, 'Payment should be REFUNDED')
    assert.equal(
      refundedPayment.metadata.refundReason,
      'Customer request for refund',
      'Should store refund reason'
    )
  })

  test('should throw error when refunding non-completed payment', async ({ assert }) => {
    // Initier paiement (mais ne pas le confirmer)
    const payment = await paymentService.initiatePayment(order.id, '+237650000000')

    // Essayer de rembourser
    await assert.rejects(async () => {
      await paymentService.refundPayment(payment.id, 'Test refund')
    }, 'Only completed payments can be refunded')
  })

  test('should update payment when initiating for order with existing pending payment', async ({
    assert,
  }) => {
    // Initier premier paiement
    const payment1 = await paymentService.initiatePayment(order.id, '+237650000000')

    // Initier à nouveau avec un autre numéro (devrait mettre à jour le paiement existant)
    const payment2 = await paymentService.initiatePayment(order.id, '+237650000001')

    assert.equal(payment1.id, payment2.id, 'Should update existing payment')
    assert.equal(payment2.phoneNumber, '+237650000001', 'Phone number should be updated')
    assert.equal(payment2.status, PaymentStatus.PENDING, 'Status should remain PENDING')
  })

  test('should store metadata correctly in payment', async ({ assert }) => {
    const payment = await paymentService.initiatePayment(order.id, '+237650000000')

    assert.isDefined(payment.metadata, 'Payment should have metadata')
    assert.isDefined(payment.metadata.initiatedAt, 'Should have initiation timestamp')
    assert.isDefined(payment.metadata.environment, 'Should have environment info')
  })
})
