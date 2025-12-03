import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import CartService from '#services/cart_service'
import Cart, { CartStatus } from '#models/cart'
import User, { UserRole, UserStatus } from '#models/user'
import Product from '#models/product'
import Category from '#models/category'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('CartService', (group) => {
  // @ts-ignore - Database transactions for tests
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  let cartService: CartService
  let user: User
  let category: Category
  let product: Product

  group.each.setup(async () => {
    cartService = new CartService()

    // Créer utilisateur de test
    user = await User.create({
      email: 'cartservice-test@example.com',
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

    // Créer catégorie
    category = await Category.create({
      name: 'Test Category',
      description: 'Test description',
      slug: 'test-category',
      isActive: true,
    })

    // Créer produit
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

  test('should get or create active cart', async ({ assert }) => {
    // Premier appel - devrait créer un nouveau panier
    const cart1 = await cartService.getOrCreateCart(user.id)

    assert.isDefined(cart1, 'Cart should be created')
    assert.equal(cart1.userId, user.id, 'Cart should belong to user')
    assert.equal(cart1.status, CartStatus.ACTIVE, 'Cart should be active')

    // Deuxième appel - devrait retourner le même panier
    const cart2 = await cartService.getOrCreateCart(user.id)

    assert.equal(cart1.id, cart2.id, 'Should return the same cart')
  })

  test('should add item to cart', async ({ assert }) => {
    const cartItem = await cartService.addItem(user.id, product.id, 2)

    assert.isDefined(cartItem, 'Cart item should be created')
    assert.equal(cartItem.productId, product.id, 'Cart item should reference product')
    assert.equal(cartItem.quantity, 2, 'Cart item should have correct quantity')
    assert.equal(cartItem.priceAtAdd, 1000, 'Cart item should snapshot price')
  })

  test('should update quantity when adding existing product', async ({ assert }) => {
    // Ajouter produit une première fois
    const cartItem1 = await cartService.addItem(user.id, product.id, 2)
    assert.equal(cartItem1.quantity, 2, 'Initial quantity should be 2')

    // Ajouter le même produit encore
    const cartItem2 = await cartService.addItem(user.id, product.id, 3)
    assert.equal(cartItem2.quantity, 5, 'Quantity should be updated to 5')
    assert.equal(cartItem1.id, cartItem2.id, 'Should be the same cart item')
  })

  test('should throw error when adding product with insufficient stock', async ({ assert }) => {
    // Le produit a un stock de 10
    await assert.rejects(async () => {
      await cartService.addItem(user.id, product.id, 15)
    }, 'Stock insuffisant. Disponible: 10, Demandé: 15')
  })

  test('should throw error when adding inactive product', async ({ assert }) => {
    // Désactiver le produit
    product.isActive = false
    await product.save()

    await assert.rejects(async () => {
      await cartService.addItem(user.id, product.id, 1)
    })
  })

  test('should update cart item quantity', async ({ assert }) => {
    // Ajouter produit
    const cartItem = await cartService.addItem(user.id, product.id, 2)

    // Mettre à jour la quantité
    const updatedItem = await cartService.updateItemQuantity(user.id, cartItem.id, 5)

    assert.isDefined(updatedItem, 'Updated item should exist')
    assert.equal(updatedItem!.quantity, 5, 'Quantity should be updated to 5')
  })

  test('should remove item when updating quantity to 0', async ({ assert }) => {
    // Ajouter produit
    const cartItem = await cartService.addItem(user.id, product.id, 2)

    // Mettre à jour la quantité à 0
    const result = await cartService.updateItemQuantity(user.id, cartItem.id, 0)

    assert.isNull(result, 'Should return null when item is removed')
  })

  test('should remove item from cart', async ({ assert }) => {
    // Ajouter produit
    const cartItem = await cartService.addItem(user.id, product.id, 2)

    // Retirer le produit
    await cartService.removeItem(user.id, cartItem.id)

    // Vérifier le panier
    const summary = await cartService.getCartSummary(user.id)
    assert.equal(summary.itemCount, 0, 'Cart should be empty')
  })

  test('should clear entire cart', async ({ assert }) => {
    // Créer un deuxième produit
    const product2 = await Product.create({
      name: 'Test Product 2',
      description: 'Test description 2',
      price: 2000,
      stock: 5,
      categoryId: category.id,
      isActive: true,
      reference: 'TEST-PRODUCT-002',
    })

    // Ajouter plusieurs produits
    await cartService.addItem(user.id, product.id, 2)
    await cartService.addItem(user.id, product2.id, 3)

    // Vider le panier
    await cartService.clearCart(user.id)

    // Vérifier le panier
    const summary = await cartService.getCartSummary(user.id)
    assert.equal(summary.itemCount, 0, 'Cart should be empty')
    assert.equal(summary.totalAmount, 0, 'Total should be 0')
  })

  test('should calculate cart summary correctly', async ({ assert }) => {
    // Créer un deuxième produit
    const product2 = await Product.create({
      name: 'Test Product 2',
      description: 'Test description 2',
      price: 2000,
      stock: 5,
      categoryId: category.id,
      isActive: true,
      reference: 'TEST-PRODUCT-003',
    })

    // Ajouter produits
    await cartService.addItem(user.id, product.id, 2) // 2 * 1000 = 2000
    await cartService.addItem(user.id, product2.id, 1) // 1 * 2000 = 2000

    // Récupérer le résumé
    const summary = await cartService.getCartSummary(user.id)

    assert.equal(summary.itemCount, 3, 'Should have 3 items total')
    assert.equal(summary.totalAmount, 4000, 'Total should be 4000')
    assert.equal(summary.items.length, 2, 'Should have 2 different products')
  })

  test('should validate stock correctly', async ({ assert }) => {
    // Ajouter produit avec quantité valide
    await cartService.addItem(user.id, product.id, 5)

    // Récupérer le panier
    const cart = await cartService.getOrCreateCart(user.id)

    // Valider le stock (devrait être valide)
    const validation1 = await cartService.validateStock(cart.id)
    assert.isTrue(validation1.valid, 'Stock should be valid')
    assert.equal(validation1.errors.length, 0, 'Should have no errors')

    // Réduire le stock du produit
    product.stock = 3
    await product.save()

    // Valider à nouveau (devrait échouer)
    const validation2 = await cartService.validateStock(cart.id)
    assert.isFalse(validation2.valid, 'Stock should be invalid')
    assert.isAbove(validation2.errors.length, 0, 'Should have errors')
  })

  test('should detect inactive products in validation', async ({ assert }) => {
    // Ajouter produit
    await cartService.addItem(user.id, product.id, 2)

    // Récupérer le panier
    const cart = await cartService.getOrCreateCart(user.id)

    // Désactiver le produit
    product.isActive = false
    await product.save()

    // Valider le stock
    const validation = await cartService.validateStock(cart.id)

    assert.isFalse(validation.valid, 'Validation should fail')
    assert.include(
      validation.errors[0],
      "n'est plus disponible",
      'Error should mention product unavailability'
    )
  })

  test('should mark cart as converted', async ({ assert }) => {
    const cart = await cartService.getOrCreateCart(user.id)

    await cartService.markAsConverted(cart.id)

    // Recharger le panier
    await cart.refresh()

    assert.equal(cart.status, CartStatus.CONVERTED, 'Cart should be marked as converted')
  })

  test('should cleanup expired carts', async ({ assert }) => {
    // Créer un deuxième utilisateur
    const user2 = await User.create({
      email: 'expired-cart-test@example.com',
      passwordHash: 'password123',
      firstName: 'Test',
      lastName: 'User 2',
      phone: '+237600000001',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Créer un panier expiré manuellement
    const expiredCart = await Cart.create({
      userId: user2.id,
      status: CartStatus.ACTIVE,
      expiresAt: DateTime.now().minus({ days: 1 }),
    })

    // Nettoyer les paniers expirés
    const cleanedCount = await cartService.cleanupExpiredCarts()

    assert.isAbove(cleanedCount, 0, 'Should have cleaned at least one cart')

    // Recharger le panier
    await expiredCart.refresh()

    assert.equal(expiredCart.status, CartStatus.ABANDONED, 'Expired cart should be abandoned')
  })

  test('should create new cart when previous is expired', async ({ assert }) => {
    // Créer un panier expiré manuellement
    await Cart.create({
      userId: user.id,
      status: CartStatus.ACTIVE,
      expiresAt: DateTime.now().minus({ days: 1 }),
    })

    // Essayer de récupérer le panier (devrait en créer un nouveau)
    const cart = await cartService.getOrCreateCart(user.id)

    assert.isFalse(cart.isExpired(), 'New cart should not be expired')
    assert.equal(cart.status, CartStatus.ACTIVE, 'New cart should be active')
  })
})
