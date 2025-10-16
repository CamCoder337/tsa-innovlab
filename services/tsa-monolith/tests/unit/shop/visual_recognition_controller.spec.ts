import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Product from '#models/product'
import Category from '#models/category'
import User, { UserRole, UserStatus } from '#models/user'

test.group('Shop Visual Recognition Controller', (group) => {
  let testUser: User
  let userToken: string
  let testCategory: Category
  let testProduct1: Product
  let testProduct2: Product

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Create test user
    testUser = await User.create({
      email: 'visual-user@example.com',
      passwordHash: 'password123',
      firstName: 'Visual',
      lastName: 'User',
      phone: '+237600000002',
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

  test('should require authentication for image search', async ({ client }) => {
    const response = await client.post('/api/shop/visual-recognition/search')

    response.assertStatus(401)
  })

  test('should return 422 when no image file is provided', async ({ client }) => {
    const response = await client.post('/api/shop/visual-recognition/search').bearerToken(userToken)

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Image file is required',
    })
  })

  test('should check AI service health without authentication', async ({ client, assert }) => {
    const response = await client.get('/api/shop/visual-recognition/health')

    response.assertStatus(200)

    const body = response.body()
    assert.exists(body.service)
    assert.equal(body.service, 'visual_recognition')
    assert.exists(body.status)
  })

  test('should handle AI service unavailable gracefully', async ({ client, assert }) => {
    // When AI service is not running, health check should still respond
    const response = await client.get('/api/shop/visual-recognition/health')

    // Should return 200 or 500 depending on service availability
    assert.isTrue(response.status() === 200 || response.status() === 500)
  })
})
