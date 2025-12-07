import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Cart, { CartStatus } from '#models/cart'
import CartItem from '#models/cart_item'
import User, { UserRole, UserStatus } from '#models/user'
import Product from '#models/product'
import Category from '#models/category'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Cart Model', (group) => {
  // @ts-ignore - Database transactions for tests
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should check if cart is expired', async ({ assert }) => {
    // Créer un utilisateur de test
    const user = await User.create({
      email: 'cart-test@example.com',
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

    // Créer un panier expiré
    const expiredCart = await Cart.create({
      userId: user.id,
      status: CartStatus.ACTIVE,
      expiresAt: DateTime.now().minus({ days: 1 }),
    })

    // Créer un panier non expiré
    const activeCart = await Cart.create({
      userId: user.id,
      status: CartStatus.ACTIVE,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    assert.isTrue(expiredCart.isExpired(), 'Cart should be expired')
    assert.isFalse(activeCart.isExpired(), 'Cart should not be expired')
  })

  test('should calculate cart total correctly', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'cart-total-test@example.com',
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

    // Créer catégorie
    const category = await Category.create({
      name: 'Test Category',
      description: 'Test description',
      slug: 'test-category',
      isActive: true,
    })

    // Créer produits
    const product1 = await Product.create({
      name: 'Product 1',
      description: 'Description 1',
      price: 1000,
      stock: 10,
      categoryId: category.id,
      isActive: true,
      reference: 'PROD-001',
    })

    const product2 = await Product.create({
      name: 'Product 2',
      description: 'Description 2',
      price: 2000,
      stock: 5,
      categoryId: category.id,
      isActive: true,
      reference: 'PROD-002',
    })

    // Créer panier
    const cart = await Cart.create({
      userId: user.id,
      status: CartStatus.ACTIVE,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    // Ajouter items au panier
    await CartItem.create({
      cartId: cart.id,
      productId: product1.id,
      quantity: 2,
      priceAtAdd: 1000,
    })

    await CartItem.create({
      cartId: cart.id,
      productId: product2.id,
      quantity: 1,
      priceAtAdd: 2000,
    })

    // Calculer le total
    // Total = (1000 * 2) + (2000 * 1) = 4000
    const total = await cart.getTotal()
    assert.equal(total, 4000, 'Cart total should be 4000')
  })

  test('should count total items in cart', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'cart-count-test@example.com',
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

    // Créer catégorie
    const category = await Category.create({
      name: 'Test Category 2',
      description: 'Test description',
      slug: 'test-category-2',
      isActive: true,
    })

    // Créer produits
    const product1 = await Product.create({
      name: 'Product 1',
      description: 'Description 1',
      price: 1000,
      stock: 10,
      categoryId: category.id,
      isActive: true,
      reference: 'PROD-003',
    })

    const product2 = await Product.create({
      name: 'Product 2',
      description: 'Description 2',
      price: 2000,
      stock: 5,
      categoryId: category.id,
      isActive: true,
      reference: 'PROD-004',
    })

    // Créer panier
    const cart = await Cart.create({
      userId: user.id,
      status: CartStatus.ACTIVE,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    // Ajouter items
    await CartItem.create({
      cartId: cart.id,
      productId: product1.id,
      quantity: 3,
      priceAtAdd: 1000,
    })

    await CartItem.create({
      cartId: cart.id,
      productId: product2.id,
      quantity: 2,
      priceAtAdd: 2000,
    })

    // Compter les items
    // Total = 3 + 2 = 5
    const itemCount = await cart.getItemCount()
    assert.equal(itemCount, 5, 'Cart should have 5 items total')
  })

  test('should handle empty cart correctly', async ({ assert }) => {
    // Créer utilisateur
    const user = await User.create({
      email: 'empty-cart-test@example.com',
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

    // Créer panier vide
    const cart = await Cart.create({
      userId: user.id,
      status: CartStatus.ACTIVE,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const total = await cart.getTotal()
    const itemCount = await cart.getItemCount()

    assert.equal(total, 0, 'Empty cart total should be 0')
    assert.equal(itemCount, 0, 'Empty cart item count should be 0')
  })
})
