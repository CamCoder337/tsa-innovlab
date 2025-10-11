import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Order, { OrderStatus, PaymentMethod, PaymentStatus } from '#models/order'
import OrderItem from '#models/order_item'
import Cart from '#models/cart'
import CartItem from '#models/cart_item'
import Product from '#models/product'
import Category from '#models/category'
import User, { UserRole, UserStatus } from '#models/user'
import Address from '#models/address'

test.group('Shop Orders Controller', (group) => {
  let testUser: User
  let userToken: string
  let testCategory: Category
  let testProduct1: Product
  let testProduct2: Product
  let shippingAddress: Address
  let billingAddress: Address

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Créer un utilisateur de test avec email unique
    const uniqueId = Date.now() + Math.random().toString(36).substring(7)
    testUser = await User.create({
      email: `orders-user-${uniqueId}@example.com`,
      passwordHash: 'password123',
      firstName: 'Orders',
      lastName: 'User',
      phone: '+237600000000',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    // Générer un token d'accès
    userToken = await testUser.generateAccessToken('test-token')

    // Créer les adresses
    shippingAddress = await Address.create({
      userId: testUser.id,
      street: '123 Shipping Street',
      city: 'Douala',
      country: 'Cameroon',
      postalCode: '00237',
      type: 'shipping',
    })

    billingAddress = await Address.create({
      userId: testUser.id,
      street: '456 Billing Avenue',
      city: 'Yaoundé',
      country: 'Cameroon',
      postalCode: '00237',
      type: 'billing',
    })

    // Créer une catégorie et des produits de test
    testCategory = await Category.create({
      name: 'Test Category',
      description: 'Category for orders testing',
      isActive: true,
      displayOrder: 1,
    })

    testProduct1 = await Product.create({
      name: 'Test Product 1',
      description: 'First product for orders testing',
      price: 100.0,
      stock: 50,
      categoryId: testCategory.id,
      createdBy: testUser.id,
      isActive: true,
    })

    testProduct2 = await Product.create({
      name: 'Test Product 2',
      description: 'Second product for orders testing',
      price: 200.0,
      stock: 30,
      categoryId: testCategory.id,
      createdBy: testUser.id,
      isActive: true,
    })
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should list user orders with pagination', async ({ client, assert }) => {
    // Créer quelques commandes pour le test
    for (let i = 0; i < 3; i++) {
      const orderNumber = await Order.generateOrderNumber()
      await Order.create({
        userId: testUser.id,
        orderNumber,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: '100.00',
        shippingCost: '10.00',
        tax: '0.00',
        total: '110.00',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+237600000000',
      })
    }

    const response = await client
      .get('/api/shop/orders')
      .bearerToken(userToken)
      .qs({ page: 1, limit: 2 })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Orders retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.orders)
    assert.exists(body.data.pagination)
    assert.equal(body.data.pagination.perPage, 2)
  })

  test('should create order from cart', async ({ client, assert }) => {
    // Créer un panier avec des items
    const cart = await Cart.create({
      userId: testUser.id,
      status: 'active',
    })

    await CartItem.createMany([
      {
        cartId: cart.id,
        productId: testProduct1.id,
        quantity: 2,
        unitPrice: testProduct1.price,
      },
      {
        cartId: cart.id,
        productId: testProduct2.id,
        quantity: 1,
        unitPrice: testProduct2.price,
      },
    ])

    const response = await client.post('/api/shop/orders').bearerToken(userToken).json({
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
      paymentMethod: PaymentMethod.ORANGE_MONEY,
      notes: 'Test order',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Order created successfully',
    })

    const body = response.body()
    assert.exists(body.data.order)
    assert.equal(body.data.order.status, OrderStatus.PENDING)
    assert.equal(body.data.order.paymentMethod, PaymentMethod.ORANGE_MONEY)

    // Vérifier que le panier a été converti
    await cart.refresh()
    assert.equal(cart.status, 'converted')

    // Vérifier que le stock a été décrémenté
    await testProduct1.refresh()
    assert.equal(testProduct1.stock, 48) // 50 - 2 = 48

    await testProduct2.refresh()
    assert.equal(testProduct2.stock, 29) // 30 - 1 = 29
  })

  test('should not create order from empty cart', async ({ client }) => {
    // Créer un panier vide
    await Cart.create({
      userId: testUser.id,
      status: 'active',
    })

    const response = await client.post('/api/shop/orders').bearerToken(userToken).json({
      shippingAddressId: shippingAddress.id,
      paymentMethod: PaymentMethod.ORANGE_MONEY,
    })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Cart is empty',
    })
  })

  test('should not create order if product has insufficient stock', async ({ client }) => {
    // Créer un panier avec quantité supérieure au stock
    const cart = await Cart.create({
      userId: testUser.id,
      status: 'active',
    })

    await CartItem.create({
      cartId: cart.id,
      productId: testProduct1.id,
      quantity: 100, // Stock = 50
      unitPrice: testProduct1.price,
    })

    const response = await client.post('/api/shop/orders').bearerToken(userToken).json({
      shippingAddressId: shippingAddress.id,
      paymentMethod: PaymentMethod.ORANGE_MONEY,
    })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Insufficient stock',
    })
  })

  test('should show order details', async ({ client, assert }) => {
    const orderNumber = await Order.generateOrderNumber()

    const order = await Order.create({
      userId: testUser.id,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '200.00',
      shippingCost: '10.00',
      tax: '0.00',
      total: '210.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
      shippingAddressId: shippingAddress.id,
    })

    await OrderItem.create({
      orderId: order.id,
      productId: testProduct1.id,
      productName: testProduct1.name,
      quantity: 2,
      unitPrice: testProduct1.price,
      subtotal: '200.00',
    })

    const response = await client.get(`/api/shop/orders/${order.id}`).bearerToken(userToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Order retrieved successfully',
    })

    const body = response.body()
    assert.equal(body.data.order.id, order.id)
    assert.exists(body.data.order.items)
    assert.exists(body.data.order.shippingAddress)
  })

  test('should not show order of another user', async ({ client }) => {
    // Créer un autre utilisateur avec email unique
    const otherUser = await User.create({
      email: `other-user-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      passwordHash: 'password123',
      firstName: 'Other',
      lastName: 'User',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const orderNumber = await Order.generateOrderNumber()

    const otherOrder = await Order.create({
      userId: otherUser.id,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '0.00',
      total: '110.00',
      customerName: 'Other User',
      customerEmail: 'other@example.com',
      customerPhone: '+237600000001',
    })

    const response = await client.get(`/api/shop/orders/${otherOrder.id}`).bearerToken(userToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Order not found',
    })
  })

  test('should cancel pending order', async ({ client, assert }) => {
    const orderNumber = await Order.generateOrderNumber()

    const order = await Order.create({
      userId: testUser.id,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '200.00',
      shippingCost: '10.00',
      tax: '0.00',
      total: '210.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    await OrderItem.create({
      orderId: order.id,
      productId: testProduct1.id,
      productName: testProduct1.name,
      quantity: 2,
      unitPrice: testProduct1.price,
      subtotal: '200.00',
    })

    // Réduire manuellement le stock (simuler la création de la commande)
    testProduct1.stock -= 2
    await testProduct1.save()

    const response = await client.post(`/api/shop/orders/${order.id}/cancel`).bearerToken(userToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Order cancelled successfully',
    })

    // Vérifier que le statut a été mis à jour
    await order.refresh()
    assert.equal(order.status, OrderStatus.CANCELLED)
    assert.exists(order.cancelledAt)

    // Vérifier que le stock a été remis
    await testProduct1.refresh()
    assert.equal(testProduct1.stock, 50) // 48 + 2 = 50
  })

  test('should not cancel shipped order', async ({ client }) => {
    const orderNumber = await Order.generateOrderNumber()

    const order = await Order.create({
      userId: testUser.id,
      orderNumber,
      status: OrderStatus.SHIPPED, // Déjà expédiée
      paymentStatus: PaymentStatus.COMPLETED,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '0.00',
      total: '110.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    const response = await client.post(`/api/shop/orders/${order.id}/cancel`).bearerToken(userToken)

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Order cannot be cancelled',
    })
  })

  test('should filter orders by status', async ({ client, assert }) => {
    // Créer des commandes avec différents statuts
    const orderNumber1 = await Order.generateOrderNumber()
    await Order.create({
      userId: testUser.id,
      orderNumber: orderNumber1,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '0.00',
      total: '110.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    const orderNumber2 = await Order.generateOrderNumber()
    await Order.create({
      userId: testUser.id,
      orderNumber: orderNumber2,
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.COMPLETED,
      subtotal: '100.00',
      shippingCost: '10.00',
      tax: '0.00',
      total: '110.00',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+237600000000',
    })

    const response = await client
      .get('/api/shop/orders')
      .bearerToken(userToken)
      .qs({ status: OrderStatus.PENDING })

    response.assertStatus(200)

    const body = response.body()
    assert.isTrue(body.data.orders.data.every((order: any) => order.status === OrderStatus.PENDING))
  })

  test('should require authentication for listing orders', async ({ client }) => {
    const response = await client.get('/api/shop/orders')

    response.assertStatus(401)
  })

  test('should require authentication for creating order', async ({ client }) => {
    const response = await client.post('/api/shop/orders').json({
      shippingAddressId: shippingAddress.id,
      paymentMethod: PaymentMethod.ORANGE_MONEY,
    })

    response.assertStatus(401)
  })

  test('should create order with all fields populated', async ({ client, assert }) => {
    const cart = await Cart.create({
      userId: testUser.id,
      status: 'active',
    })

    await CartItem.create({
      cartId: cart.id,
      productId: testProduct1.id,
      quantity: 1,
      unitPrice: testProduct1.price,
    })

    const response = await client.post('/api/shop/orders').bearerToken(userToken).json({
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
      paymentMethod: PaymentMethod.MTN_MOMO,
      notes: 'Urgent delivery',
    })

    response.assertStatus(201)

    const body = response.body()
    const order = body.data.order

    assert.equal(order.customerName, 'Orders User')
    assert.equal(order.customerEmail, testUser.email)
    assert.equal(order.customerPhone, '+237600000000')
    assert.equal(order.notes, 'Urgent delivery')
    assert.exists(order.orderNumber)
    assert.match(order.orderNumber, /^ORD-\d{8}-\d{11}$/)
  })
})
