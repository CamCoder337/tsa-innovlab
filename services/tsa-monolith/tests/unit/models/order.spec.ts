import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Order, { OrderStatus, PaymentStatus } from '#models/order'
import User, { UserRole, UserStatus } from '#models/user'
import Address from '#models/address'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Order Model', (group) => {
  // @ts-ignore - Database transactions for tests
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should generate unique order number on creation', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'order-test@example.com',
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
    const address = await Address.create({
      street: '123 Test Street',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '00000',
    })

    // Créer première commande
    const order1 = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.PENDING,
    })

    // Créer deuxième commande
    const order2 = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      total: 20000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.PENDING,
    })

    assert.isDefined(order1.orderNumber, 'Order 1 should have an order number')
    assert.isDefined(order2.orderNumber, 'Order 2 should have an order number')
    assert.notEqual(order1.orderNumber, order2.orderNumber, 'Order numbers should be unique')

    // Vérifier le format : ORD-YYYYMM-XXXX
    const now = DateTime.now()
    const expectedPrefix = `ORD-${now.year}${String(now.month).padStart(2, '0')}`
    assert.isTrue(
      order1.orderNumber.startsWith(expectedPrefix),
      `Order number should start with ${expectedPrefix}`
    )
  })

  test('should check if order can be cancelled', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'cancel-test@example.com',
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

    // Test 1: Commande PENDING - peut être annulée
    const pendingOrder = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.PENDING,
    })

    assert.isTrue(pendingOrder.canBeCancelled(), 'PENDING order should be cancellable')

    // Test 2: Commande PAID - peut être annulée
    const paidOrder = await Order.create({
      userId: user.id,
      status: OrderStatus.PAID,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.COMPLETED,
    })

    assert.isTrue(paidOrder.canBeCancelled(), 'PAID order should be cancellable')

    // Test 3: Commande SHIPPED - ne peut PAS être annulée
    const shippedOrder = await Order.create({
      userId: user.id,
      status: OrderStatus.SHIPPED,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.COMPLETED,
    })

    assert.isFalse(shippedOrder.canBeCancelled(), 'SHIPPED order should NOT be cancellable')

    // Test 4: Commande DELIVERED - ne peut PAS être annulée
    const deliveredOrder = await Order.create({
      userId: user.id,
      status: OrderStatus.DELIVERED,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.COMPLETED,
    })

    assert.isFalse(deliveredOrder.canBeCancelled(), 'DELIVERED order should NOT be cancellable')

    // Test 5: Commande PROCESSING - ne peut PAS être annulée
    const processingOrder = await Order.create({
      userId: user.id,
      status: OrderStatus.PROCESSING,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.COMPLETED,
    })

    assert.isFalse(processingOrder.canBeCancelled(), 'PROCESSING order should NOT be cancellable')
  })

  test('should check if order is paid', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'paid-test@example.com',
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

    // Commande avec paiement complété
    const paidOrder = await Order.create({
      userId: user.id,
      status: OrderStatus.PAID,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.COMPLETED,
    })

    assert.isTrue(paidOrder.isPaid(), 'Order with COMPLETED payment should be paid')

    // Commande avec paiement en attente
    const unpaidOrder = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.PENDING,
    })

    assert.isFalse(unpaidOrder.isPaid(), 'Order with PENDING payment should NOT be paid')

    // Commande avec paiement échoué
    const failedOrder = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.FAILED,
    })

    assert.isFalse(failedOrder.isPaid(), 'Order with FAILED payment should NOT be paid')
  })

  test('should verify order number format is correct', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'format-test@example.com',
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

    const order = await Order.create({
      userId: user.id,
      status: OrderStatus.PENDING,
      total: 10000,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentMethod: 'mtn_mobile_money',
      paymentStatus: PaymentStatus.PENDING,
    })

    // Vérifier le format avec regex : ORD-YYYYMM-XXXX
    const orderNumberPattern = /^ORD-\d{6}-\d{4}$/
    assert.match(
      order.orderNumber,
      orderNumberPattern,
      'Order number should match format ORD-YYYYMM-XXXX'
    )
  })
})
