import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Order, { OrderStatus, PaymentMethod, PaymentStatus } from '#models/order'
import OrderItem from '#models/order_item'
import User, { UserRole, UserStatus } from '#models/user'
import Product from '#models/product'
import Category from '#models/category'
import Address from '#models/address'
import AuditLog from '#models/audit_log'

test.group('Order Model', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create an order with basic information', async ({ assert }) => {
    const user = await User.create({
      email: 'order-test@example.com',
      passwordHash: 'password123',
      firstName: 'Order',
      lastName: 'User',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const orderNumber = await Order.generateOrderNumber()

    const order = await Order.create({
      userId: user.id,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '1000.00',
      shippingCost: '50.00',
      tax: '100.00',
      total: '1150.00',
      customerName: 'Order User',
      customerEmail: 'order-test@example.com',
      customerPhone: '+237600000000',
    })

    assert.exists(order.id)
    assert.equal(order.userId, user.id)
    assert.equal(order.status, OrderStatus.PENDING)
    assert.equal(order.paymentStatus, PaymentStatus.PENDING)
    assert.equal(order.total, '1150.00')
  })

  test('should generate unique order numbers', async ({ assert }) => {
    const user = await User.create({
      email: 'order-number@example.com',
      passwordHash: 'password123',
      firstName: 'Order',
      lastName: 'Number',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const orderNumber1 = await Order.generateOrderNumber()
    const orderNumber2 = await Order.generateOrderNumber()

    await Order.create({
      userId: user.id,
      orderNumber: orderNumber1,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '10.00',
      total: '120.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    assert.notEqual(orderNumber1, orderNumber2)
    assert.match(orderNumber1, /^ORD-\d{8}-\d{11}$/)
    assert.match(orderNumber2, /^ORD-\d{8}-\d{11}$/)
  })

  test('should have relationship with user', async ({ assert }) => {
    const user = await User.create({
      email: 'user-relation@example.com',
      passwordHash: 'password123',
      firstName: 'User',
      lastName: 'Relation',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const orderNumber = await Order.generateOrderNumber()

    const order = await Order.create({
      userId: user.id,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '10.00',
      total: '120.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    await order.load('user')

    assert.exists(order.user)
    assert.equal(order.user.id, user.id)
    assert.equal(order.user.email, 'user-relation@example.com')
  })

  test('should have relationship with order items', async ({ assert }) => {
    const user = await User.create({
      email: 'order-items@example.com',
      passwordHash: 'password123',
      firstName: 'Order',
      lastName: 'Items',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const category = await Category.create({
      name: 'Test Category',
      isActive: true,
      displayOrder: 1,
    })

    const product = await Product.create({
      name: 'Test Product',
      price: 100.0,
      stock: 50,
      categoryId: category.id,
      createdBy: user.id,
      isActive: true,
    })

    const orderNumber = await Order.generateOrderNumber()

    const order = await Order.create({
      userId: user.id,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '200.00',
      shippingCost: '10.00',
      tax: '20.00',
      total: '230.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    await OrderItem.create({
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      quantity: 2,
      unitPrice: product.price,
      subtotal: '200.00',
    })

    await order.load('items')

    assert.equal(order.items.length, 1)
    assert.equal(order.items[0].productId, product.id)
    assert.equal(order.items[0].quantity, 2)
  })

  test('should update status with audit log', async ({ assert }) => {
    const user = await User.create({
      email: 'status-update@example.com',
      passwordHash: 'password123',
      firstName: 'Status',
      lastName: 'Update',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const orderNumber = await Order.generateOrderNumber()

    const order = await Order.create({
      userId: user.id,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '10.00',
      total: '120.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    await order.updateStatus(OrderStatus.PAID, user.id)

    assert.equal(order.status, OrderStatus.PAID)
    assert.equal(order.paymentStatus, PaymentStatus.COMPLETED)
    assert.exists(order.paidAt)

    // Verify audit log was created
    const auditLog = await AuditLog.query()
      .where('entityType', 'orders')
      .where('entityId', order.id)
      .first()

    assert.exists(auditLog)
    assert.equal(auditLog!.action, 'order.status_update')
    assert.equal(auditLog!.userId, user.id)
  })

  test('should update timestamps based on status changes', async ({ assert }) => {
    const user = await User.create({
      email: 'timestamps@example.com',
      passwordHash: 'password123',
      firstName: 'Timestamps',
      lastName: 'Test',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const orderNumber = await Order.generateOrderNumber()

    const order = await Order.create({
      userId: user.id,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '10.00',
      total: '120.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    // Test SHIPPED status
    await order.updateStatus(OrderStatus.SHIPPED, user.id)
    assert.exists(order.shippedAt)

    // Test DELIVERED status
    await order.updateStatus(OrderStatus.DELIVERED, user.id)
    assert.exists(order.deliveredAt)

    // Test CANCELLED status
    const cancelledOrder = await Order.create({
      userId: user.id,
      orderNumber: await Order.generateOrderNumber(),
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '10.00',
      total: '120.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    await cancelledOrder.updateStatus(OrderStatus.CANCELLED, user.id)
    assert.exists(cancelledOrder.cancelledAt)
  })

  test('should have relationship with addresses', async ({ assert }) => {
    const user = await User.create({
      email: 'address-test@example.com',
      passwordHash: 'password123',
      firstName: 'Address',
      lastName: 'Test',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const shippingAddress = await Address.create({
      userId: user.id,
      street: '123 Shipping Street',
      city: 'Douala',
      country: 'Cameroon',
      postalCode: '00237',
      type: 'shipping',
    })

    const billingAddress = await Address.create({
      userId: user.id,
      street: '456 Billing Avenue',
      city: 'Yaoundé',
      country: 'Cameroon',
      postalCode: '00237',
      type: 'billing',
    })

    const orderNumber = await Order.generateOrderNumber()

    const order = await Order.create({
      userId: user.id,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '10.00',
      total: '120.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
    })

    await order.load('shippingAddress')
    await order.load('billingAddress')

    assert.exists(order.shippingAddress)
    assert.exists(order.billingAddress)
    assert.equal(order.shippingAddress.city, 'Douala')
    assert.equal(order.billingAddress.city, 'Yaoundé')
  })

  test('should support different payment methods', async ({ assert }) => {
    const user = await User.create({
      email: 'payment-methods@example.com',
      passwordHash: 'password123',
      firstName: 'Payment',
      lastName: 'Methods',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const paymentMethods = [
      PaymentMethod.ORANGE_MONEY,
      PaymentMethod.MTN_MOMO,
      PaymentMethod.WAVE,
      PaymentMethod.BANK_TRANSFER,
      PaymentMethod.CASH_ON_DELIVERY,
    ]

    for (const method of paymentMethods) {
      const orderNumber = await Order.generateOrderNumber()
      const order = await Order.create({
        userId: user.id,
        orderNumber,
        status: OrderStatus.PENDING,
        paymentMethod: method,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: '100.00',
        shippingCost: '10.00',
        tax: '10.00',
        total: '120.00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+237600000000',
      })

      assert.equal(order.paymentMethod, method)
    }
  })

  test('should support different order statuses', async ({ assert }) => {
    const user = await User.create({
      email: 'order-statuses@example.com',
      passwordHash: 'password123',
      firstName: 'Order',
      lastName: 'Statuses',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const statuses = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ]

    for (const status of statuses) {
      const orderNumber = await Order.generateOrderNumber()
      const order = await Order.create({
        userId: user.id,
        orderNumber,
        status,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: '100.00',
        shippingCost: '10.00',
        tax: '10.00',
        total: '120.00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+237600000000',
      })

      assert.equal(order.status, status)
    }
  })
})
