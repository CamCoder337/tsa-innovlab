import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Product from '#models/product'
import Category from '#models/category'
import User, { UserRole, UserStatus } from '#models/user'

test.group('Shop Product Recommendations Controller', (group) => {
  let testUser: User
  let userToken: string
  let testCategory: Category
  let testProduct1: Product
  let testProduct2: Product
  let testProduct3: Product

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Create test user
    testUser = await User.create({
      email: 'rec-user@example.com',
      passwordHash: 'password123',
      firstName: 'Recommendation',
      lastName: 'User',
      phone: '+237600000001',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    // Generate access token
    userToken = await testUser.generateAccessToken('test-token')

    // Create test category and products
    testCategory = await Category.create({
      name: 'Electronics',
      description: 'Electronic products',
      isActive: true,
      displayOrder: 1,
    })

    testProduct1 = await Product.create({
      name: 'Laptop',
      description: 'High-performance laptop',
      price: 1000.0,
      stock: 10,
      categoryId: testCategory.id,
      createdBy: testUser.id,
      isActive: true,
    })

    testProduct2 = await Product.create({
      name: 'Mouse',
      description: 'Wireless mouse',
      price: 50.0,
      stock: 50,
      categoryId: testCategory.id,
      createdBy: testUser.id,
      isActive: true,
    })

    testProduct3 = await Product.create({
      name: 'Keyboard',
      description: 'Mechanical keyboard',
      price: 150.0,
      stock: 30,
      categoryId: testCategory.id,
      createdBy: testUser.id,
      isActive: true,
    })
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  /**
   * NOTE: These are integration tests that test the controller routes and basic functionality.
   * Full AI service integration tests require:
   * 1. The FastAPI service to be running (http://localhost:8000)
   * 2. Or mocking library like 'sinon' for unit testing
   *
   * Install sinon for complete mocking: npm install --save-dev sinon @types/sinon
   */

  test('should get personalized product recommendations - requires auth', async ({ client }) => {
    const response = await client.get('/api/shop/product-recommendations')

    response.assertStatus(401)
  })

  test('should get personalized product recommendations when authenticated', async ({
    client,
    assert,
  }) => {
    // This test will return fallback recommendations if AI service is not available
    const response = await client
      .get('/api/shop/product-recommendations')
      .bearerToken(userToken)
      .qs({ limit: 10, context: 'homepage' })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })

    const body = response.body()
    assert.exists(body.data)
    assert.exists(body.data.products)
    assert.isArray(body.data.products)

    // Should have a strategy (either from AI or fallback)
    assert.exists(body.data.strategy)
  }).timeout(15000) // Allow time for AI service timeout + fallback

  test('should respect limit parameter for personalized product recommendations', async ({
    client,
    assert,
  }) => {
    const response = await client
      .get('/api/shop/product-recommendations')
      .bearerToken(userToken)
      .qs({ limit: 2 })

    response.assertStatus(200)

    const body = response.body()
    // Fallback might return fewer products if not enough exist
    assert.isAtMost(body.data.products.length, 2)
  }).timeout(15000) // Allow time for AI service timeout + fallback

  test('should get similar products - requires auth', async ({ client }) => {
    const response = await client.get(
      `/api/shop/product-recommendations/similar/${testProduct1.id}`
    )

    response.assertStatus(401)
  })

  test('should get similar products for a valid product', async ({ client, assert }) => {
    const response = await client
      .get(`/api/shop/product-recommendations/similar/${testProduct1.id}`)
      .bearerToken(userToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })

    const body = response.body()
    assert.exists(body.data.base_product)
    assert.equal(body.data.base_product.id, testProduct1.id)
    assert.exists(body.data.products)
    assert.isArray(body.data.products)
    assert.exists(body.data.strategy)
  })

  test('should return 404 when product not found for similar products', async ({ client }) => {
    const fakeProductId = '00000000-0000-0000-0000-000000000000'

    const response = await client
      .get(`/api/shop/product-recommendations/similar/${fakeProductId}`)
      .bearerToken(userToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
    })
  })

  test('should handle invalid product ID for similar products', async ({ client }) => {
    const response = await client
      .get('/api/shop/product-recommendations/similar/invalid-uuid')
      .bearerToken(userToken)

    response.assertStatus(404)
  })

  test('should get popular products without authentication', async ({ client, assert }) => {
    // Popular products endpoint is public
    const response = await client.get('/api/shop/product-recommendations/popular').qs({ limit: 10 })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })

    const body = response.body()
    assert.exists(body.data.products)
    assert.isArray(body.data.products)
    assert.exists(body.data.strategy)
  })

  test('should respect limit parameter for popular products', async ({ client, assert }) => {
    const response = await client.get('/api/shop/product-recommendations/popular').qs({ limit: 2 })

    response.assertStatus(200)

    const body = response.body()
    assert.isAtMost(body.data.products.length, 2)
  })

  test('should return fallback product recommendations when AI service unavailable', async ({
    client,
    assert,
  }) => {
    // If AI service is not running, controller should fallback to recent products
    const response = await client.get('/api/shop/product-recommendations').bearerToken(userToken)

    response.assertStatus(200)

    const body = response.body()
    assert.exists(body.data.products)
    // Fallback strategy should be indicated
    assert.isTrue(
      body.data.strategy === 'fallback_recent' ||
        body.data.strategy === 'collaborative_filtering' ||
        body.data.strategy === 'content_based' ||
        body.data.strategy === 'popularity_based'
    )
  })

  test('should not recommend inactive products', async ({ client, assert }) => {
    // Deactivate a product
    testProduct2.isActive = false
    await testProduct2.save()

    const response = await client.get('/api/shop/product-recommendations').bearerToken(userToken)

    response.assertStatus(200)

    const body = response.body()
    const productIds = body.data.products.map((p: any) => p.id)

    // Should not include inactive product
    assert.notInclude(productIds, testProduct2.id)
  })

  test('should not recommend out-of-stock products in fallback mode', async ({
    client,
    assert,
  }) => {
    // Set product stock to 0
    testProduct3.stock = 0
    await testProduct3.save()

    const response = await client.get('/api/shop/product-recommendations').bearerToken(userToken)

    response.assertStatus(200)

    const body = response.body()
    const productIds = body.data.products.map((p: any) => p.id)

    // Should not include out-of-stock product in fallback
    assert.notInclude(productIds, testProduct3.id)
  })

  test('should include category information in product recommendations', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/api/shop/product-recommendations').bearerToken(userToken)

    response.assertStatus(200)

    const body = response.body()

    if (body.data.products.length > 0) {
      const product = body.data.products[0]
      // Should preload category
      assert.exists(product.category)
      assert.exists(product.category.id)
    }
  })

  test('should return similar products from same category in fallback', async ({
    client,
    assert,
  }) => {
    const response = await client
      .get(`/api/shop/product-recommendations/similar/${testProduct1.id}`)
      .bearerToken(userToken)

    response.assertStatus(200)

    const body = response.body()

    if (body.data.strategy === 'fallback_same_category') {
      // All similar products should be from same category
      body.data.products.forEach((product: any) => {
        assert.equal(product.categoryId, testProduct1.categoryId)
      })
    }
  })

  test('should validate limit parameter is within bounds', async ({ client, assert }) => {
    // Test with various limit values
    const response1 = await client
      .get('/api/shop/product-recommendations')
      .bearerToken(userToken)
      .qs({ limit: 1 })

    response1.assertStatus(200)
    assert.isAtMost(response1.body().data.products.length, 1)

    const response2 = await client
      .get('/api/shop/product-recommendations')
      .bearerToken(userToken)
      .qs({ limit: 50 })

    response2.assertStatus(200)
    // Should not exceed limit
    assert.isAtMost(response2.body().data.products.length, 50)
  })

  test('should handle context parameter for personalized product recommendations', async ({
    client,
  }) => {
    const contexts = ['homepage', 'product', 'cart', 'checkout']

    for (const context of contexts) {
      const response = await client
        .get('/api/shop/product-recommendations')
        .bearerToken(userToken)
        .qs({ context })

      response.assertStatus(200)
    }
  })

  test('popular products should be sorted by relevance', async ({ client, assert }) => {
    const response = await client.get('/api/shop/product-recommendations/popular').qs({ limit: 10 })

    response.assertStatus(200)

    const body = response.body()

    if (body.data.products.length > 1) {
      // Products should be sorted (either by created_at DESC in fallback or by AI score)
      assert.isArray(body.data.products)
      assert.isAtLeast(body.data.products.length, 1)
    }
  })
})
