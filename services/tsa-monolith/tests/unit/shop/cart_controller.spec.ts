import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Cart from '#models/cart'
import CartItem from '#models/cart_item'
import Product from '#models/product'
import Category from '#models/category'
import User, { UserRole, UserStatus } from '#models/user'

test.group('Shop Cart Controller', (group) => {
  let testUser: User
  let userToken: string
  let testCategory: Category
  let testProduct1: Product
  let testProduct2: Product

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Créer un utilisateur de test
    testUser = await User.create({
      email: 'cart-user@example.com',
      passwordHash: 'password123',
      firstName: 'Cart',
      lastName: 'User',
      phone: '+237600000000',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    // Générer un token d'accès
    userToken = await testUser.generateAccessToken('test-token')

    // Créer une catégorie et des produits de test
    testCategory = await Category.create({
      name: 'Test Category',
      description: 'Category for cart testing',
      isActive: true,
      displayOrder: 1,
    })

    testProduct1 = await Product.create({
      name: 'Test Product 1',
      description: 'First product for cart testing',
      price: 100.0,
      stock: 50,
      categoryId: testCategory.id,
      createdBy: testUser.id,
      isActive: true,
    })

    testProduct2 = await Product.create({
      name: 'Test Product 2',
      description: 'Second product for cart testing',
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

  test('should get or create empty cart for user', async ({ client, assert }) => {
    const response = await client.get('/api/shop/cart').bearerToken(userToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Cart retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.cart)
    assert.equal(body.data.cart.userId, testUser.id)
    assert.equal(body.data.cart.status, 'active')
    assert.equal(body.data.total, 0)
    assert.equal(body.data.itemsCount, 0)
  })

  test('should add item to cart', async ({ client, assert }) => {
    const response = await client.post('/api/shop/cart/items').bearerToken(userToken).json({
      productId: testProduct1.id,
      quantity: 2,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Product added to cart',
    })

    const body = response.body()
    assert.exists(body.data.cartItem)
    assert.equal(body.data.cartItem.productId, testProduct1.id)
    assert.equal(body.data.cartItem.quantity, 2)
    assert.equal(body.data.cartItem.unitPrice, '100.00')
  })

  test('should update quantity when adding existing product', async ({ client, assert }) => {
    // Ajouter le produit une première fois
    await client.post('/api/shop/cart/items').bearerToken(userToken).json({
      productId: testProduct1.id,
      quantity: 2,
    })

    // Ajouter le même produit encore
    const response = await client.post('/api/shop/cart/items').bearerToken(userToken).json({
      productId: testProduct1.id,
      quantity: 3,
    })

    response.assertStatus(201)

    const body = response.body()
    assert.equal(body.data.cartItem.quantity, 5) // 2 + 3 = 5
  })

  test('should not add product with insufficient stock', async ({ client }) => {
    const response = await client.post('/api/shop/cart/items').bearerToken(userToken).json({
      productId: testProduct1.id,
      quantity: 100, // Stock = 50, demande 100
    })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Insufficient stock',
    })
  })

  test('should not add inactive product', async ({ client }) => {
    // Désactiver le produit
    testProduct1.isActive = false
    await testProduct1.save()

    const response = await client.post('/api/shop/cart/items').bearerToken(userToken).json({
      productId: testProduct1.id,
      quantity: 1,
    })

    response.assertStatus(400)
  })

  test('should update cart item quantity', async ({ client, assert }) => {
    // Ajouter un item au panier
    const cart = await Cart.create({
      userId: testUser.id,
      status: 'active',
    })

    const cartItem = await CartItem.create({
      cartId: cart.id,
      productId: testProduct1.id,
      quantity: 2,
      unitPrice: testProduct1.price.toString(),
    })

    // Mettre à jour la quantité
    const response = await client
      .put(`/api/shop/cart/items/${cartItem.id}`)
      .bearerToken(userToken)
      .json({
        quantity: 5,
      })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Cart item updated',
    })

    const body = response.body()
    assert.equal(body.data.cartItem.quantity, 5)
  })

  test('should not update cart item with insufficient stock', async ({ client }) => {
    // Ajouter un item au panier
    const cart = await Cart.create({
      userId: testUser.id,
      status: 'active',
    })

    const cartItem = await CartItem.create({
      cartId: cart.id,
      productId: testProduct1.id,
      quantity: 2,
      unitPrice: testProduct1.price.toString(),
    })

    // Tenter de mettre à jour avec une quantité trop élevée
    const response = await client
      .put(`/api/shop/cart/items/${cartItem.id}`)
      .bearerToken(userToken)
      .json({
        quantity: 100, // Stock = 50
      })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Insufficient stock',
    })
  })

  test('should not update cart item of another user', async ({ client }) => {
    // Créer un autre utilisateur avec son panier
    const otherUser = await User.create({
      email: `other-user-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      passwordHash: 'password123',
      firstName: 'Other',
      lastName: 'User',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const otherCart = await Cart.create({
      userId: otherUser.id,
      status: 'active',
    })

    const otherCartItem = await CartItem.create({
      cartId: otherCart.id,
      productId: testProduct1.id,
      quantity: 2,
      unitPrice: testProduct1.price.toString(),
    })

    // Essayer de mettre à jour l'item d'un autre utilisateur
    const response = await client
      .put(`/api/shop/cart/items/${otherCartItem.id}`)
      .bearerToken(userToken)
      .json({
        quantity: 5,
      })

    response.assertStatus(403)
    response.assertBodyContains({
      success: false,
      message: 'Access denied',
    })
  })

  test('should remove item from cart', async ({ client, assert }) => {
    // Ajouter un item au panier
    const cart = await Cart.create({
      userId: testUser.id,
      status: 'active',
    })

    const cartItem = await CartItem.create({
      cartId: cart.id,
      productId: testProduct1.id,
      quantity: 2,
      unitPrice: testProduct1.price.toString(),
    })

    const response = await client
      .delete(`/api/shop/cart/items/${cartItem.id}`)
      .bearerToken(userToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Cart item removed',
    })

    // Vérifier que l'item a été supprimé
    const deletedItem = await CartItem.find(cartItem.id)
    assert.isNull(deletedItem)
  })

  test('should not remove cart item of another user', async ({ client }) => {
    // Créer un autre utilisateur avec son panier
    const otherUser = await User.create({
      email: `other-user-remove-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      passwordHash: 'password123',
      firstName: 'Other',
      lastName: 'User',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const otherCart = await Cart.create({
      userId: otherUser.id,
      status: 'active',
    })

    const otherCartItem = await CartItem.create({
      cartId: otherCart.id,
      productId: testProduct1.id,
      quantity: 2,
      unitPrice: testProduct1.price.toString(),
    })

    // Essayer de supprimer l'item d'un autre utilisateur
    const response = await client
      .delete(`/api/shop/cart/items/${otherCartItem.id}`)
      .bearerToken(userToken)

    response.assertStatus(403)
    response.assertBodyContains({
      success: false,
      message: 'Access denied',
    })
  })

  test('should clear entire cart', async ({ client, assert }) => {
    // Créer un panier avec plusieurs items
    const cart = await Cart.create({
      userId: testUser.id,
      status: 'active',
    })

    await CartItem.createMany([
      {
        cartId: cart.id,
        productId: testProduct1.id,
        quantity: 2,
        unitPrice: testProduct1.price.toString(),
      },
      {
        cartId: cart.id,
        productId: testProduct2.id,
        quantity: 3,
        unitPrice: testProduct2.price.toString(),
      },
    ])

    const response = await client.delete('/api/shop/cart').bearerToken(userToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Cart cleared',
    })

    // Vérifier que tous les items ont été supprimés
    const remainingItems = await CartItem.query().where('cartId', cart.id)
    assert.equal(remainingItems.length, 0)
  })

  test('should calculate cart total correctly', async ({ client, assert }) => {
    // Créer un panier avec plusieurs items
    const cart = await Cart.create({
      userId: testUser.id,
      status: 'active',
    })

    await CartItem.createMany([
      {
        cartId: cart.id,
        productId: testProduct1.id,
        quantity: 2, // 2 * 100 = 200
        unitPrice: testProduct1.price.toString(),
      },
      {
        cartId: cart.id,
        productId: testProduct2.id,
        quantity: 3, // 3 * 200 = 600
        unitPrice: testProduct2.price.toString(),
      },
    ])

    const response = await client.get('/api/shop/cart').bearerToken(userToken)

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.data.total, 800) // 200 + 600 = 800
    assert.equal(body.data.itemsCount, 5) // 2 + 3 = 5 items
  })

  test('should require authentication', async ({ client }) => {
    const response = await client.get('/api/shop/cart')

    response.assertStatus(401)
  })

  test('should validate product id format', async ({ client }) => {
    const response = await client.post('/api/shop/cart/items').bearerToken(userToken).json({
      productId: 'invalid-uuid',
      quantity: 1,
    })

    response.assertStatus(400)
  })

  test('should validate quantity is positive', async ({ client }) => {
    const response = await client.post('/api/shop/cart/items').bearerToken(userToken).json({
      productId: testProduct1.id,
      quantity: 0,
    })

    response.assertStatus(400)
  })

  test('should validate quantity maximum', async ({ client }) => {
    const response = await client.post('/api/shop/cart/items').bearerToken(userToken).json({
      productId: testProduct1.id,
      quantity: 101, // Max = 100
    })

    response.assertStatus(400)
  })
})
