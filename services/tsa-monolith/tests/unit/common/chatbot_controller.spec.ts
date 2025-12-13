import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import AIService from '#services/ai_service'
import sinon from 'sinon'
import app from '@adonisjs/core/services/app'

test.group('Chatbot Controller', (group) => {
  let testUser: User
  let userToken: string
  let aiServiceStub: sinon.SinonStubbedInstance<AIService>

  group.setup(async () => {
    // ✅ CORRECTION: Pas besoin d'importer start/app, utiliser app service directement
    await app.init()

    // Create AI service stub
    aiServiceStub = sinon.createStubInstance(AIService)

    // Mock chatbot query method
    aiServiceStub.queryChatbot.resolves({
      message: 'Bonjour! Comment puis-je vous aider?',
      intent: {
        name: 'greeting',
        confidence: 0.95,
        entities: {}, // ✅ Champ requis
      },
      suggestions: ['Suivre mon colis', 'Créer une mission', 'Voir les tarifs'],
      requires_human: false, // ✅ Champ requis
      timestamp: new Date().toISOString(), // ✅ Champ requis
    })

    // Mock get conversation history
    aiServiceStub.getChatbotHistory.resolves({
      success: true,
      messages: [],
    })

    // Mock chatbot health (retourne un boolean)
    aiServiceStub.checkChatbotHealth.resolves(true)

    // ✅ Swap the AI service with our stub in the container
    app.container.swap(AIService, () => aiServiceStub as any)
  })

  group.teardown(async () => {
    // ✅ Restore original AI service
    app.container.restore(AIService)
    sinon.restore()
  })

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
    const response = await client.post('/api/common/chatbot/query').bearerToken(userToken).json({
      message: 'Bonjour',
    })

    response.assertStatus(200)
    assert.properties(response.body(), ['success', 'message', 'intent', 'suggestions'])
    assert.isTrue(response.body().success)
    assert.isString(response.body().message)
    assert.isObject(response.body().intent)
    assert.isArray(response.body().suggestions)

    // Verify AI service was called
    sinon.assert.calledOnce(aiServiceStub.queryChatbot)
  })

  test('should reject empty message', async ({ client, assert }) => {
    const response = await client.post('/api/common/chatbot/query').bearerToken(userToken).json({
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

    response.assertStatus(200)
    assert.properties(response.body(), ['success'])
    assert.isTrue(response.body().success)

    // Verify AI service was called
    sinon.assert.calledOnce(aiServiceStub.getChatbotHistory)
  })

  test('should check chatbot health', async ({ client, assert }) => {
    const response = await client.get('/api/common/chatbot/health').bearerToken(userToken)

    response.assertStatus(200)
    // Le contrôleur retourne { success: boolean, healthy: boolean }
    assert.properties(response.body(), ['success', 'healthy'])
    assert.isTrue(response.body().success)
    assert.isTrue(response.body().healthy)

    // Verify AI service was called
    sinon.assert.calledOnce(aiServiceStub.checkChatbotHealth)
  })

  test('should handle complex queries', async ({ client, assert }) => {
    // Configure stub for pricing query
    aiServiceStub.queryChatbot.resolves({
      message: 'Le tarif pour un transport de Douala à Yaoundé pour 500kg est environ 50,000 FCFA.',
      intent: {
        name: 'pricing',
        confidence: 0.92,
        entities: { weight: '500kg', origin: 'Douala', destination: 'Yaoundé' },
      },
      suggestions: ['Créer une mission', 'Voir les transporteurs disponibles'],
      requires_human: false,
      timestamp: new Date().toISOString(),
    })

    const response = await client
      .post('/api/common/chatbot/query')
      .bearerToken(userToken)
      .json({
        message: 'Combien coûte un transport de Douala à Yaoundé pour 500kg ?',
        context: {
          page: 'pricing',
        },
      })

    response.assertStatus(200)
    assert.isTrue(response.body().success)
    assert.isString(response.body().message)
    assert.equal(response.body().intent.name, 'pricing')
  })

  test('should handle conversation context', async ({ client, assert }) => {
    const conversationId = `conv_${testUser.id}_${Date.now()}`

    // First message
    const response1 = await client.post('/api/common/chatbot/query').bearerToken(userToken).json({
      message: 'Bonjour',
      conversation_id: conversationId,
    })

    response1.assertStatus(200)
    assert.isTrue(response1.body().success)

    // Second message in same conversation
    const response2 = await client.post('/api/common/chatbot/query').bearerToken(userToken).json({
      message: 'Où est mon colis #12345 ?',
      conversation_id: conversationId,
    })

    response2.assertStatus(200)
    assert.isTrue(response2.body().success)
  })

  test('should handle AI service errors gracefully', async ({ client, assert }) => {
    // Configure stub to throw error
    aiServiceStub.queryChatbot.rejects(new Error('AI service unavailable'))

    const response = await client.post('/api/common/chatbot/query').bearerToken(userToken).json({
      message: 'Test error handling',
    })

    response.assertStatus(503)
    assert.isFalse(response.body().success)
    assert.include(response.body().message.toLowerCase(), 'unavailable')
  })
})
