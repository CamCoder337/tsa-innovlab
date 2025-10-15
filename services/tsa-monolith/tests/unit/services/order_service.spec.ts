import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import OrderService from '#services/order_service'
import CartService from '#services/cart_service'
import Order, { OrderStatus, PaymentStatus } from '#models/order'
import User, { UserRole, UserStatus } from '#models/user'
import Product from '#models/product'
import Category from '#models/category'
import Address from '#models/address'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('OrderService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  let orderService: OrderService
  let cartService: CartService
  let user: User
  let category: Category
  let product: Product
  let shippingAddress: Address
  let billingAddress: Address

  group.each.setup(async () => {
    orderService = new OrderService()
    cartService = new CartService()

    // Créer utilisateur
    user = await User.create({
      email: 'orderservice-test@example.com',
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
      price: 1000,
      stock: 10,
      categoryId: category.id,
      isActive: true,
      reference: 'TEST-PRODUCT-001',
    })
  })

  test('should create order from cart successfully', async ({ assert }) => {
    // Ajouter produits au panier
    await cartService.addItem(user.id, product.id, 2)

    // Créer la commande
    const order = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money',
      'Test order notes'
    )

    assert.isDefined(order, 'Order should be created')
    assert.isDefined(order.orderNumber, 'Order should have order number')
    assert.equal(order.userId, user.id, 'Order should belong to user')
    assert.equal(order.status, OrderStatus.PENDING, 'Order should be PENDING')
    assert.equal(order.totalAmount, 2000, 'Total should be 2000 (2 * 1000)')
    assert.equal(order.paymentStatus, PaymentStatus.PENDING, 'Payment should be PENDING')

    // Vérifier que les items ont été créés
    await order.load('items')
    assert.equal(order.items.length, 1, 'Order should have 1 item')
    assert.equal(order.items[0].quantity, 2, 'Order item should have quantity 2')
  })

  test('should throw error when creating order from empty cart', async ({ assert }) => {
    // Ne pas ajouter de produits au panier

    await assert.rejects(
      async () => {
        await orderService.createOrderFromCart(
          user.id,
          shippingAddress.id,
          billingAddress.id,
          'mtn_mobile_money'
        )
      },
      'Cart is empty. Cannot create order.'
    )
  })

  test('should decrement stock when creating order', async ({ assert }) => {
    const initialStock = product.stock

    // Ajouter produit au panier
    await cartService.addItem(user.id, product.id, 3)

    // Créer commande
    await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    // Recharger le produit
    await product.refresh()

    assert.equal(product.stock, initialStock - 3, 'Stock should be decremented by 3')
  })

  test('should get user orders with pagination', async ({ assert }) => {
    // Créer plusieurs commandes
    await cartService.addItem(user.id, product.id, 1)
    await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    await cartService.addItem(user.id, product.id, 2)
    await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    // Récupérer les commandes
    const orders = await orderService.getUserOrders(user.id, 1, 10)

    assert.isAbove(orders.length, 0, 'Should have at least one order')
  })

  test('should get order by id', async ({ assert }) => {
    // Créer commande
    await cartService.addItem(user.id, product.id, 2)
    const createdOrder = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    // Récupérer la commande
    const order = await orderService.getOrderById(createdOrder.id, user.id)

    assert.equal(order.id, createdOrder.id, 'Should return correct order')
    assert.isDefined(order.items, 'Order should have items loaded')
    assert.isDefined(order.shippingAddress, 'Order should have shipping address loaded')
  })

  test('should cancel order and restore stock', async ({ assert }) => {
    const initialStock = product.stock

    // Créer commande
    await cartService.addItem(user.id, product.id, 3)
    const order = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    // Annuler la commande
    await orderService.cancelOrder(order.id, user.id)

    // Recharger le produit et la commande
    await product.refresh()
    await order.refresh()

    assert.equal(order.status, OrderStatus.CANCELLED, 'Order should be cancelled')
    assert.equal(product.stock, initialStock, 'Stock should be restored')
  })

  test('should not allow cancellation of shipped order', async ({ assert }) => {
    // Créer commande
    await cartService.addItem(user.id, product.id, 2)
    const order = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    // Changer le statut en SHIPPED
    order.status = OrderStatus.SHIPPED
    await order.save()

    // Essayer d'annuler
    await assert.rejects(
      async () => {
        await orderService.cancelOrder(order.id, user.id)
      },
      'Order cannot be cancelled. Current status: shipped'
    )
  })

  test('should update order status', async ({ assert }) => {
    // Créer commande
    await cartService.addItem(user.id, product.id, 2)
    const order = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    // Mettre à jour le statut
    await orderService.updateOrderStatus(order.id, OrderStatus.PROCESSING)

    // Recharger
    await order.refresh()

    assert.equal(order.status, OrderStatus.PROCESSING, 'Status should be updated to PROCESSING')
  })

  test('should update payment status and order status when payment completed', async ({ assert }) => {
    // Créer commande
    await cartService.addItem(user.id, product.id, 2)
    const order = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    // Mettre à jour le statut de paiement
    await orderService.updatePaymentStatus(order.id, PaymentStatus.COMPLETED)

    // Recharger
    await order.refresh()

    assert.equal(order.paymentStatus, PaymentStatus.COMPLETED, 'Payment status should be COMPLETED')
    assert.equal(order.status, OrderStatus.PAID, 'Order status should be PAID')
  })

  test('should get user order statistics', async ({ assert }) => {
    // Créer plusieurs commandes avec différents statuts
    await cartService.addItem(user.id, product.id, 1)
    const order1 = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    await cartService.addItem(user.id, product.id, 2)
    const order2 = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    // Marquer une commande comme livrée
    order1.status = OrderStatus.DELIVERED
    await order1.save()

    // Récupérer les stats
    const stats = await orderService.getUserOrderStats(user.id)

    assert.isAbove(stats.totalOrders, 0, 'Should have total orders')
    assert.isAbove(stats.totalSpent, 0, 'Should have total spent')
    assert.equal(stats.completedOrders, 1, 'Should have 1 completed order')
    assert.equal(stats.pendingOrders, 1, 'Should have 1 pending order')
  })

  test('should create order items with product name snapshot', async ({ assert }) => {
    // Ajouter produit au panier
    await cartService.addItem(user.id, product.id, 2)

    // Créer commande
    const order = await orderService.createOrderFromCart(
      user.id,
      shippingAddress.id,
      billingAddress.id,
      'mtn_mobile_money'
    )

    // Charger les items
    await order.load('items')

    assert.equal(order.items[0].productName, product.name, 'Should snapshot product name')
    assert.equal(order.items[0].unitPrice, product.price, 'Should snapshot product price')
  })
})
