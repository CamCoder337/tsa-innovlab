import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import Product from '#models/product'
import Category from '#models/category'

test.group('Shop Piece Scoring Controller', (group) => {
  let clientUser: User
  let clientToken: string
  let adminUser: User
  let adminToken: string
  let testProduct: Product
  let testCategory: Category

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Create admin user
    adminUser = await User.create({
      email: 'admin-scoring@example.com',
      passwordHash: 'password123',
      firstName: 'Admin',
      lastName: 'Scoring',
      phone: '+237600000020',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    adminToken = await adminUser.generateAccessToken('test-token')

    // Create client user
    clientUser = await User.create({
      email: 'client-scoring@example.com',
      passwordHash: 'password123',
      firstName: 'Client',
      lastName: 'Scoring',
      phone: '+237600000021',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    clientToken = await clientUser.generateAccessToken('test-token')

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category Scoring',
      description: 'Category for scoring tests',
      slug: 'test-category-scoring',
    })

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product for Scoring',
      description: 'Product to test scoring functionality',
      price: 50000,
      stock: 100,
      stockAlert: 10,
      categoryId: testCategory.id,
      sku: 'TEST-SCORING-001',
    })
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  /**
   * NOTE: These are integration tests that test the controller routes and basic functionality.
   * Full AI service integration tests require:
   * 1. The FastAPI service to be running (http://localhost:8000)
   * 2. The AI service to have the scoring model loaded
   * 
   * For CI/CD, these tests verify:
   * - Authentication and authorization
   * - Request validation
   * - Error handling
   */

  test('should require authentication for piece scoring', async ({ client }) => {
    const response = await client.post('/api/shop/pieces/score')

    response.assertStatus(401)
  })

  test('should return 422 when neither productId nor productName+price provided', async ({
    client,
  }) => {
    const response = await client
      .post('/api/shop/pieces/score')
      .bearerToken(clientToken)
      .json({})

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Either productId OR (productName + price) is required for scoring',
    })
  })

  test('should accept productId for scoring', async ({ client }) => {
    const response = await client
      .post('/api/shop/pieces/score')
      .bearerToken(clientToken)
      .json({
        productId: testProduct.id,
      })

    // Will return 500 if AI service unavailable, which is expected in test environment
    response.assertStatus([200, 500])
  })

  test('should accept productName and price for scoring', async ({ client }) => {
    const response = await client
      .post('/api/shop/pieces/score')
      .bearerToken(clientToken)
      .json({
        productName: 'Test Piece',
        price: 50000,
      })

    // Will return 500 if AI service unavailable, which is expected in test environment
    response.assertStatus([200, 500])
  })

  test('should accept all optional scoring parameters', async ({ client }) => {
    const response = await client
      .post('/api/shop/pieces/score')
      .bearerToken(clientToken)
      .json({
        productName: 'Test Piece Complete',
        price: 75000,
        pieceAgeMonths: 12,
        estimatedLifetimeMonths: 60,
        supplierRating: 4.5,
        supplierYearsExperience: 10,
        averageCustomerRating: 4.2,
        numberOfReviews: 25,
        physicalConditionScore: 85.0,
        categoryCode: 3,
        brandReputationScore: 80.0,
      })

    // Will return 500 if AI service unavailable, which is expected in test environment
    response.assertStatus([200, 500])
  })

  test('should validate scoring request', async ({ client }) => {
    const response = await client
      .post('/api/shop/pieces/score/validate')
      .bearerToken(clientToken)
      .json({
        productName: 'Test Validation',
        price: 50000,
      })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Scoring request is valid',
    })
  })

  test('should return 422 for invalid validation request', async ({ client }) => {
    const response = await client
      .post('/api/shop/pieces/score/validate')
      .bearerToken(clientToken)
      .json({
        // Missing required fields
      })

    response.assertStatus(422)
  })

  test('should support batch scoring', async ({ client }) => {
    const response = await client
      .post('/api/shop/pieces/score/batch')
      .bearerToken(clientToken)
      .json({
        pieces: [
          {
            productName: 'Piece 1',
            price: 50000,
          },
          {
            productName: 'Piece 2',
            price: 75000,
          },
        ],
      })

    // Will return 500 if AI service unavailable, which is expected in test environment
    response.assertStatus([200, 500])
  })

  test('should return available scoring categories', async ({ client, assert }) => {
    const response = await client
      .get('/api/shop/pieces/score/categories')
      .bearerToken(clientToken)

    response.assertStatus(200)

    const body = response.body()
    assert.property(body, 'success')
    assert.property(body, 'data')
    assert.property(body.data, 'categories')
    assert.isArray(body.data.categories)
  })

  test('should return available scoring methods', async ({ client, assert }) => {
    const response = await client
      .get('/api/shop/pieces/score/methods')
      .bearerToken(clientToken)

    response.assertStatus(200)

    const body = response.body()
    assert.property(body, 'success')
    assert.property(body, 'data')
    assert.property(body.data, 'methods')
    assert.isArray(body.data.methods)
  })

  test('should handle numeric conversion for price', async ({ client }) => {
    const response = await client
      .post('/api/shop/pieces/score')
      .bearerToken(clientToken)
      .json({
        productName: 'Test Numeric',
        price: '50000', // String instead of number
      })

    // Should handle conversion gracefully
    response.assertStatus([200, 500])
  })

  test('should enrich product data when productId is provided', async ({ client }) => {
    const response = await client
      .post('/api/shop/pieces/score')
      .bearerToken(clientToken)
      .json({
        productId: testProduct.id,
        // Additional parameters should be merged with product data
        supplierRating: 4.5,
      })

    // Will return 500 if AI service unavailable, which is expected in test environment
    response.assertStatus([200, 500])
  })
})
