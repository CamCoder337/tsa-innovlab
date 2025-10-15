import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Payment, { PaymentMethod, PaymentStatus } from '#models/payment'
import Order, { OrderStatus, PaymentStatus as OrderPaymentStatus } from '#models/order'
import User, { UserRole, UserStatus } from '#models/user'
import Address from '#models/address'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Payment Model', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should check if payment is completed', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'payment-test@example.com',
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

    // Créer adresse
    const address = await Address.create({
      street: '123 Test Street',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '00000',
    })

    // Créer commande
    const order = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      totalAmount: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: OrderPaymentStatus.PENDING,
    })

    // Test 1: Paiement complété
    const completedPayment = await Payment.create({
      orderId: order.id,
      amount: 10000,
      method: PaymentMethod.MTN_MOBILE_MONEY,
      status: PaymentStatus.COMPLETED,
      phoneNumber: '+237650000000',
      transactionId: 'TXN-123456',
      metadata: {},
    })

    assert.isTrue(completedPayment.isCompleted(), 'Payment with COMPLETED status should be completed')

    // Test 2: Paiement en attente
    const order2 = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      totalAmount: 20000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: OrderPaymentStatus.PENDING,
    })

    const pendingPayment = await Payment.create({
      orderId: order2.id,
      amount: 20000,
      method: PaymentMethod.MTN_MOBILE_MONEY,
      status: PaymentStatus.PENDING,
      phoneNumber: '+237650000001',
      metadata: {},
    })

    assert.isFalse(pendingPayment.isCompleted(), 'Payment with PENDING status should NOT be completed')

    // Test 3: Paiement échoué
    const order3 = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      totalAmount: 30000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: OrderPaymentStatus.FAILED,
    })

    const failedPayment = await Payment.create({
      orderId: order3.id,
      amount: 30000,
      method: PaymentMethod.MTN_MOBILE_MONEY,
      status: PaymentStatus.FAILED,
      phoneNumber: '+237650000002',
      metadata: {},
    })

    assert.isFalse(failedPayment.isCompleted(), 'Payment with FAILED status should NOT be completed')
  })

  test('should check if payment is pending', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'pending-payment-test@example.com',
      passwordHash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+237600000001',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Créer adresse
    const address = await Address.create({
      street: '123 Test Street',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '00000',
    })

    // Créer commande
    const order = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      totalAmount: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: OrderPaymentStatus.PENDING,
    })

    // Test: Paiement en attente
    const pendingPayment = await Payment.create({
      orderId: order.id,
      amount: 10000,
      method: PaymentMethod.MTN_MOBILE_MONEY,
      status: PaymentStatus.PENDING,
      phoneNumber: '+237650000000',
      metadata: {},
    })

    assert.isTrue(pendingPayment.isPending(), 'Payment should be pending')

    // Mettre à jour le statut
    pendingPayment.status = PaymentStatus.COMPLETED
    await pendingPayment.save()

    assert.isFalse(pendingPayment.isPending(), 'Updated payment should NOT be pending')
  })

  test('should check if payment is failed', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'failed-payment-test@example.com',
      passwordHash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+237600000002',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Créer adresse
    const address = await Address.create({
      street: '123 Test Street',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '00000',
    })

    // Créer commande
    const order = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      totalAmount: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: OrderPaymentStatus.FAILED,
    })

    // Test: Paiement échoué
    const failedPayment = await Payment.create({
      orderId: order.id,
      amount: 10000,
      method: PaymentMethod.MTN_MOBILE_MONEY,
      status: PaymentStatus.FAILED,
      phoneNumber: '+237650000000',
      metadata: { failureReason: 'Insufficient funds' },
    })

    assert.isTrue(failedPayment.isFailed(), 'Payment should be failed')

    // Autres statuts
    failedPayment.status = PaymentStatus.PENDING
    await failedPayment.save()
    assert.isFalse(failedPayment.isFailed(), 'PENDING payment should NOT be failed')

    failedPayment.status = PaymentStatus.COMPLETED
    await failedPayment.save()
    assert.isFalse(failedPayment.isFailed(), 'COMPLETED payment should NOT be failed')
  })

  test('should store metadata correctly', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'metadata-test@example.com',
      passwordHash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+237600000003',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Créer adresse
    const address = await Address.create({
      street: '123 Test Street',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '00000',
    })

    // Créer commande
    const order = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      totalAmount: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: OrderPaymentStatus.PENDING,
    })

    // Créer paiement avec metadata
    const payment = await Payment.create({
      orderId: order.id,
      amount: 10000,
      method: PaymentMethod.MTN_MOBILE_MONEY,
      status: PaymentStatus.COMPLETED,
      phoneNumber: '+237650000000',
      transactionId: 'TXN-123456',
      metadata: {
        initiatedAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
        environment: 'test',
        customField: 'test value',
      },
    })

    assert.isDefined(payment.metadata, 'Payment should have metadata')
    assert.equal(payment.metadata.environment, 'test', 'Metadata should contain environment field')
    assert.equal(payment.metadata.customField, 'test value', 'Metadata should contain custom field')
  })

  test('should validate phone number format', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'phone-test@example.com',
      passwordHash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+237600000004',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Créer adresse
    const address = await Address.create({
      street: '123 Test Street',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '00000',
    })

    // Créer commande
    const order = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      totalAmount: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: OrderPaymentStatus.PENDING,
    })

    // Créer paiement avec numéro de téléphone
    const payment = await Payment.create({
      orderId: order.id,
      amount: 10000,
      method: PaymentMethod.MTN_MOBILE_MONEY,
      status: PaymentStatus.PENDING,
      phoneNumber: '+237650000000',
      metadata: {},
    })

    assert.isDefined(payment.phoneNumber, 'Payment should have phone number')
    assert.isString(payment.phoneNumber, 'Phone number should be a string')
    assert.match(
      payment.phoneNumber,
      /^\+237[0-9]{9}$/,
      'Phone number should match Cameroon format'
    )
  })
})
