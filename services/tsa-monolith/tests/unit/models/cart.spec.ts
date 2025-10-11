import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Cart from '#models/cart'
import CartItem from '#models/cart_item'
import User, { UserRole, UserStatus } from '#models/user'
import Product from '#models/product'
import Category from '#models/category'

test.group('Cart Model', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create a cart with basic information', async ({ assert }) => {
    const user = await User.create({
      email: 'cart-test@example.com',
      passwordHash: 'password123',
      firstName: 'Cart',
      lastName: 'User',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const cart = await Cart.create({
      userId: user.id,
      status: 'active',
    })

    assert.exists(cart.id)
    assert.equal(cart.userId, user.id)
    assert.equal(cart.status, 'active')
    assert.exists(cart.createdAt)
    assert.exists(cart.updatedAt)
  })

  test('should have relationship with user', async ({ assert }) => {
    const user = await User.create({
      email: 'cart-user@example.com',
      passwordHash: 'password123',
      firstName: 'Cart',
      lastName: 'User',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const cart = await Cart.create({
      userId: user.id,
      status: 'active',
    })

    await cart.load('user')

    assert.exists(cart.user)
    assert.equal(cart.user.id, user.id)
    assert.equal(cart.user.email, 'cart-user@example.com')
  })

  test('should have relationship with cart items', async ({ assert }) => {
    const user = await User.create({
      email: 'items-user@example.com',
      passwordHash: 'password123',
      firstName: 'Items',
      lastName: 'User',
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

    const cart = await Cart.create({
      userId: user.id,
      status: 'active',
    })

    await CartItem.create({
      cartId: cart.id,
      productId: product.id,
      quantity: 2,
      unitPrice: product.price,
    })

    await cart.load('items')

    assert.equal(cart.items.length, 1)
    assert.equal(cart.items[0].productId, product.id)
    assert.equal(cart.items[0].quantity, 2)
  })

  test('should calculate cart total correctly', async ({ assert }) => {
    const user = await User.create({
      email: 'total-user@example.com',
      passwordHash: 'password123',
      firstName: 'Total',
      lastName: 'User',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const category = await Category.create({
      name: 'Test Category',
      isActive: true,
      displayOrder: 1,
    })

    const product1 = await Product.create({
      name: 'Product 1',
      price: 100.0,
      stock: 50,
      categoryId: category.id,
      createdBy: user.id,
      isActive: true,
    })

    const product2 = await Product.create({
      name: 'Product 2',
      price: 200.0,
      stock: 30,
      categoryId: category.id,
      createdBy: user.id,
      isActive: true,
    })

    const cart = await Cart.create({
      userId: user.id,
      status: 'active',
    })

    await CartItem.createMany([
      {
        cartId: cart.id,
        productId: product1.id,
        quantity: 2, // 2 * 100 = 200
        unitPrice: product1.price,
      },
      {
        cartId: cart.id,
        productId: product2.id,
        quantity: 3, // 3 * 200 = 600
        unitPrice: product2.price,
      },
    ])

    const total = await cart.calculateTotal()

    assert.equal(total, 800) // 200 + 600 = 800
  })

  test('should get total items count', async ({ assert }) => {
    const user = await User.create({
      email: 'count-user@example.com',
      passwordHash: 'password123',
      firstName: 'Count',
      lastName: 'User',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const category = await Category.create({
      name: 'Test Category',
      isActive: true,
      displayOrder: 1,
    })

    const product1 = await Product.create({
      name: 'Product 1',
      price: 100.0,
      stock: 50,
      categoryId: category.id,
      createdBy: user.id,
      isActive: true,
    })

    const product2 = await Product.create({
      name: 'Product 2',
      price: 200.0,
      stock: 30,
      categoryId: category.id,
      createdBy: user.id,
      isActive: true,
    })

    const cart = await Cart.create({
      userId: user.id,
      status: 'active',
    })

    await CartItem.createMany([
      {
        cartId: cart.id,
        productId: product1.id,
        quantity: 2,
        unitPrice: product1.price,
      },
      {
        cartId: cart.id,
        productId: product2.id,
        quantity: 3,
        unitPrice: product2.price,
      },
    ])

    const totalItems = await cart.getTotalItems()

    assert.equal(totalItems, 5) // 2 + 3 = 5
  })

  test('should return 0 for empty cart total', async ({ assert }) => {
    const user = await User.create({
      email: 'empty-cart@example.com',
      passwordHash: 'password123',
      firstName: 'Empty',
      lastName: 'Cart',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const cart = await Cart.create({
      userId: user.id,
      status: 'active',
    })

    const total = await cart.calculateTotal()
    const totalItems = await cart.getTotalItems()

    assert.equal(total, 0)
    assert.equal(totalItems, 0)
  })

  test('should validate status values', async ({ assert }) => {
    const user = await User.create({
      email: 'status-test@example.com',
      passwordHash: 'password123',
      firstName: 'Status',
      lastName: 'Test',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const activeCart = await Cart.create({
      userId: user.id,
      status: 'active',
    })

    const abandonedCart = await Cart.create({
      userId: user.id,
      status: 'abandoned',
    })

    const convertedCart = await Cart.create({
      userId: user.id,
      status: 'converted',
    })

    assert.equal(activeCart.status, 'active')
    assert.equal(abandonedCart.status, 'abandoned')
    assert.equal(convertedCart.status, 'converted')
  })

  test('should update timestamps on modification', async ({ assert }) => {
    const user = await User.create({
      email: 'timestamp-test@example.com',
      passwordHash: 'password123',
      firstName: 'Timestamp',
      lastName: 'Test',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const cart = await Cart.create({
      userId: user.id,
      status: 'active',
    })

    const originalUpdatedAt = cart.updatedAt

    await new Promise((resolve) => setTimeout(resolve, 10))

    cart.status = 'abandoned'
    await cart.save()

    assert.notEqual(cart.updatedAt.toMillis(), originalUpdatedAt.toMillis())
  })
})
