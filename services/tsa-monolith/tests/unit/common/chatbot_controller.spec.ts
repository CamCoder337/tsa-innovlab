import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'

test.group('Chatbot Controller', (group) => {
  let testUser: User
  let userToken: string

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Create test user
    testUser = await User.create({
      email: 'chatbot@test.com',
      passwordHash: 'password123',
      firstName: 'Chat',
      lastName: 'Bot',
      phone: '+237600000010',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    // Generate access token
    userToken = await testUser.generateAccessToken('test-token')
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should query chatbot successfully', async ({ client, assert }) => {
    const response = await client
      .post('/api/common/chatbot/query')
      .bearerToken(userToken)
      .json({
        message: 'Bonjour',
      })

    // Should return 200 or 503 (if AI service is down)
    assert.oneOf(response.status(), [200, 503])

    if (response.status() === 200) {
      assert.properties(response.body(), ['success', 'message', 'intent', 'suggestions'])
      assert.isTrue(response.body().success)
      assert.isString(response.body().message)
      assert.isObject(response.body().intent)
      assert.isArray(response.body().suggestions)
    }
  })

  test('should reject empty message', async ({ client, assert }) => {
    const response = await client
      .post('/api/common/chatbot/query')
      .bearerToken(userToken)
      .json({
        message: '',
      })

    response.assertStatus(400)
    assert.isFalse(response.body().success)
    assert.equal(response.body().message, 'Message is required')
  })

  test('should reject missing message', async ({ client, assert }) => {
    const response = await client.post('/api/common/chatbot/query').bearerToken(userToken).json({})

    response.assertStatus(400)
    assert.isFalse(response.body().success)
  })

  test('should require authentication', async ({ client }) => {
    const response = await client.post('/api/common/chatbot/query').json({
      message: 'Bonjour',
    })

    response.assertStatus(401)
  })

  test('should get conversation history', async ({ client, assert }) => {
    const response = await client
      .get(`/api/common/chatbot/history/${testUser.id}`)
      .bearerToken(userToken)

    // Should return 200 or 503 (if AI service is down)
    assert.oneOf(response.status(), [200, 503])

    if (response.status() === 200) {
      assert.properties(response.body(), ['success'])
      assert.isTrue(response.body().success)
    }
  })

  test('should check chatbot health', async ({ client, assert }) => {
    const response = await client.get('/api/common/chatbot/health')

    // Should return 200 or 503 (if AI service is down)
    assert.oneOf(response.status(), [200, 503])
    assert.properties(response.body(), ['success', 'status'])
  })

  test('should handle complex queries', async ({ client, assert }) => {
    const response = await client
      .post('/api/common/chatbot/query')
      .bearerToken(userToken)
      .json({
        message: 'Combien coûte un transport de Douala à Yaoundé pour 500kg ?',
        context: {
          page: 'pricing',
        },
      })

    assert.oneOf(response.status(), [200, 503])

    if (response.status() === 200) {
      assert.isTrue(response.body().success)
      assert.isString(response.body().message)
      // Should detect pricing intent
      if (response.body().intent) {
        assert.oneOf(response.body().intent.name, ['pricing', 'unknown'])
      }
    }
  })

  test('should handle conversation context', async ({ client, assert }) => {
    const conversationId = `conv_${testUser.id}_${Date.now()}`

    // First message
    const response1 = await client
      .post('/api/common/chatbot/query')
      .bearerToken(userToken)
      .json({
        message: 'Bonjour',
        conversation_id: conversationId,
      })

    assert.oneOf(response1.status(), [200, 503])

    // Second message in same conversation
    const response2 = await client
      .post('/api/common/chatbot/query')
      .bearerToken(userToken)
      .json({
        message: 'Où est mon colis #12345 ?',
        conversation_id: conversationId,
      })

    assert.oneOf(response2.status(), [200, 503])

    if (response2.status() === 200) {
      assert.isTrue(response2.body().success)
    }
  })
})
