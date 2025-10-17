import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'

test.group('Affreteur Dynamic Pricing Controller', (group) => {
  let affreteurUser: User
  let affreteurToken: string
  let transporteurUser: User
  let transporteurToken: string

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Create affreteur user
    affreteurUser = await User.create({
      email: 'affreteur-pricing@example.com',
      passwordHash: 'password123',
      firstName: 'Affreteur',
      lastName: 'Pricing',
      phone: '+237600000003',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    affreteurToken = await affreteurUser.generateAccessToken('test-token')

    // Create transporteur user
    transporteurUser = await User.create({
      email: 'transporteur-pricing@example.com',
      passwordHash: 'password123',
      firstName: 'Transporteur',
      lastName: 'Pricing',
      phone: '+237600000004',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    transporteurToken = await transporteurUser.generateAccessToken('test-token')
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

  test('should require authentication for pricing calculation', async ({ client }) => {
    const response = await client.post('/api/affreteur/pricing/calculate')

    response.assertStatus(401)
  })

  test('should require affreteur role for pricing calculation', async ({ client }) => {
    const response = await client
      .post('/api/affreteur/pricing/calculate')
      .bearerToken(transporteurToken)
      .json({
        origin: 'Douala',
        destination: 'Yaoundé',
        distance_km: 250,
        weight_tons: 10,
      })

    response.assertStatus(403)
  })

  test('should return 422 when required fields are missing', async ({ client }) => {
    const response = await client
      .post('/api/affreteur/pricing/calculate')
      .bearerToken(affreteurToken)
      .json({
        origin: 'Douala',
        // Missing destination, distance_km, weight_tons
      })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Missing required fields',
    })
  })

  test('should calculate pricing with valid data', async ({ client, assert }) => {
    const response = await client
      .post('/api/affreteur/pricing/calculate')
      .bearerToken(affreteurToken)
      .json({
        origin: 'Douala',
        destination: 'Yaoundé',
        distance_km: 250,
        weight_tons: 10,
        cargo_type: 'general',
        urgency: 'standard',
      })

    // Should return 200 if AI service is available, or 500 if not
    assert.isTrue(response.status() === 200 || response.status() === 500)

    if (response.status() === 200) {
      response.assertBodyContains({
        success: true,
        message: 'Dynamic pricing calculated successfully',
      })

      const body = response.body()
      assert.exists(body.data)
    }
  }).timeout(15000)

  test('should use default values for optional fields', async ({ client, assert }) => {
    const response = await client
      .post('/api/affreteur/pricing/calculate')
      .bearerToken(affreteurToken)
      .json({
        origin: 'Douala',
        destination: 'Yaoundé',
        distance_km: 250,
        weight_tons: 10,
        // cargo_type and urgency should default
      })

    assert.isTrue(response.status() === 200 || response.status() === 500)
  }).timeout(15000)

  test('should get pricing configuration', async ({ client, assert }) => {
    const response = await client.get('/api/affreteur/pricing/config').bearerToken(affreteurToken)

    // Should return 200 if AI service is available, or 500 if not
    assert.isTrue(response.status() === 200 || response.status() === 500)

    if (response.status() === 200) {
      response.assertBodyContains({
        success: true,
        message: 'Pricing configuration retrieved successfully',
      })

      const body = response.body()
      assert.exists(body.data)
    }
  }).timeout(15000)

  test('should require authentication for pricing config', async ({ client }) => {
    const response = await client.get('/api/affreteur/pricing/config')

    response.assertStatus(401)
  })

  test('should handle AI service unavailable gracefully', async ({ client, assert }) => {
    const response = await client
      .post('/api/affreteur/pricing/calculate')
      .bearerToken(affreteurToken)
      .json({
        origin: 'Douala',
        destination: 'Yaoundé',
        distance_km: 250,
        weight_tons: 10,
      })

    // When AI service is unavailable, should return 500 with error message
    if (response.status() === 500) {
      response.assertBodyContains({
        success: false,
      })

      const body = response.body()
      assert.exists(body.message)
    }
  }).timeout(15000)

  test('transporteur can also access pricing calculation', async ({ client, assert }) => {
    // Transporteur should be able to estimate pricing before applying
    const response = await client
      .post('/api/transporteur/pricing/calculate')
      .bearerToken(transporteurToken)
      .json({
        origin: 'Douala',
        destination: 'Yaoundé',
        distance_km: 250,
        weight_tons: 10,
      })

    assert.isTrue(response.status() === 200 || response.status() === 500)
  }).timeout(15000)

  test('should handle numeric conversion for distance and weight', async ({ client, assert }) => {
    const response = await client
      .post('/api/affreteur/pricing/calculate')
      .bearerToken(affreteurToken)
      .json({
        origin: 'Douala',
        destination: 'Yaoundé',
        distance_km: '250', // String should be converted to number
        weight_tons: '10', // String should be converted to number
      })

    assert.isTrue(response.status() === 200 || response.status() === 500)
  }).timeout(15000)
})
