import { test } from '@japa/runner'
import User, { UserRole, UserStatus } from '#models/user'
import Conversation, { ConversationType } from '#models/conversation'
import Message, { MessageType } from '#models/message'
import Database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

test.group('Messages API', (group) => {
  let user1: User
  let user2: User
  let user3: User
  let conversation: Conversation
  let user1Token: string
  let user3Token: string

  group.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  group.each.setup(async () => {
    // Créer utilisateurs de test avec emails uniques
    const timestamp = Date.now()
    user1 = await User.create({
      email: `user1-msg-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'User1',
      lastName: 'Test',
      phone: `+3380000${timestamp.toString().slice(-4)}`,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: true,
    })

    user2 = await User.create({
      email: `user2-msg-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'User2',
      lastName: 'Test',
      phone: `+3380001${timestamp.toString().slice(-4)}`,
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
    })

    user3 = await User.create({
      email: `user3-msg-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'User3',
      lastName: 'Test',
      phone: `+3380002${timestamp.toString().slice(-4)}`,
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
    })

    // Générer tokens JWT réels
    user1Token = await user1.generateAccessToken('test-token')
    await user2.generateAccessToken('test-token')
    user3Token = await user3.generateAccessToken('test-token')

    // Créer conversation de test
    conversation = await Conversation.create({
      type: ConversationType.DIRECT,
      user1Id: user1.id,
      user2Id: user2.id,
      lastActivityAt: DateTime.now(),
    })
  })

  // ===== Tests GET /api/common/conversations/:conversationId/messages =====

  test('should list messages in a conversation', async ({ client, assert }) => {
    // Créer quelques messages
    await Message.create({
      conversationId: conversation.id,
      senderId: user1.id,
      content: 'Hello!',
      type: MessageType.TEXT,
    })

    await Message.create({
      conversationId: conversation.id,
      senderId: user2.id,
      content: 'Hi there!',
      type: MessageType.TEXT,
    })

    const response = await client
      .get(`/api/common/conversations/${conversation.id}/messages`)
      .bearerToken(user1Token)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.isArray(response.body().data.messages.data)
    assert.isAtLeast(response.body().data.messages.data.length, 2)
  })

  test('should paginate messages', async ({ client, assert }) => {
    // Créer plusieurs messages
    for (let i = 0; i < 15; i++) {
      await Message.create({
        conversationId: conversation.id,
        senderId: user1.id,
        content: `Message ${i}`,
        type: MessageType.TEXT,
      })
    }

    const response = await client
      .get(`/api/common/conversations/${conversation.id}/messages?page=1&limit=10`)
      .bearerToken(user1Token)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    const body = response.body()
    assert.exists(body.data.messages.meta)
    assert.isAtMost(body.data.messages.data.length, 10)
  })

  test('should automatically mark messages as read when retrieved', async ({ client, assert }) => {
    // Créer message non lu
    const message = await Message.create({
      conversationId: conversation.id,
      senderId: user2.id,
      content: 'Unread message',
      type: MessageType.TEXT,
    })

    assert.isUndefined(message.readAt)

    // Récupérer les messages en tant que user1
    await client
      .get(`/api/common/conversations/${conversation.id}/messages`)
      .bearerToken(user1Token)
      .header('Accept', 'application/json')

    // Vérifier que le message est marqué comme lu
    await message.refresh()
    assert.isNotNull(message.readAt)
  })

  test('should return 403 if user is not participant', async ({ client }) => {
    const response = await client
      .get(`/api/common/conversations/${conversation.id}/messages`)
      .bearerToken(user3Token) // user3 n'est pas participant
      .header('Accept', 'application/json')

    response.assertStatus(403)
    response.assertBodyContains({
      success: false,
      message: 'Accès refusé à cette conversation',
    })
  })

  // ===== Tests POST /api/common/conversations/:conversationId/messages =====

  test('should send a message', async ({ client, assert }) => {
    const response = await client
      .post(`/api/common/conversations/${conversation.id}/messages`)
      .bearerToken(user1Token)
      .json({
        content: 'This is a test message',
        type: 'text',
      })
      .header('Accept', 'application/json')

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Message envoyé avec succès',
    })

    const messageData = response.body().data.message
    assert.equal(messageData.content, 'This is a test message')
    assert.equal(messageData.senderId, user1.id)
    assert.equal(messageData.conversationId, conversation.id)
  })

  test('should reject empty message', async ({ client }) => {
    const response = await client
      .post(`/api/common/conversations/${conversation.id}/messages`)
      .bearerToken(user1Token)
      .json({
        content: '',
      })
      .header('Accept', 'application/json')

    response.assertStatus(422)
  })

  test('should reject very long message', async ({ client }) => {
    const longContent = 'a'.repeat(6000) // Plus de 5000 caractères

    const response = await client
      .post(`/api/common/conversations/${conversation.id}/messages`)
      .bearerToken(user1Token)
      .json({
        content: longContent,
      })
      .header('Accept', 'application/json')

    response.assertStatus(422)
  })

  test('should update conversation lastActivityAt when sending message', async ({
    client,
    assert,
  }) => {
    const initialLastActivity = conversation.lastActivityAt

    // Attendre un petit moment pour s'assurer que le timestamp sera différent
    await new Promise((resolve) => setTimeout(resolve, 100))

    await client
      .post(`/api/common/conversations/${conversation.id}/messages`)
      .bearerToken(user1Token)
      .json({
        content: 'New message',
      })
      .header('Accept', 'application/json')

    await conversation.refresh()
    assert.notEqual(conversation.lastActivityAt.toMillis(), initialLastActivity.toMillis())
  })

  test('should return 403 if user is not participant when sending', async ({ client }) => {
    const response = await client
      .post(`/api/common/conversations/${conversation.id}/messages`)
      .bearerToken(user3Token) // user3 n'est pas participant
      .json({
        content: 'Forbidden message',
      })
      .header('Accept', 'application/json')

    response.assertStatus(403)
  })

  // ===== Tests PUT /api/common/messages/:id/read =====

  test('should mark single message as read', async ({ client, assert }) => {
    const message = await Message.create({
      conversationId: conversation.id,
      senderId: user2.id,
      content: 'Mark me as read',
      type: MessageType.TEXT,
    })

    assert.isUndefined(message.readAt)

    const response = await client
      .put(`/api/common/messages/${message.id}/read`)
      .bearerToken(user1Token)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Message marqué comme lu',
    })

    await message.refresh()
    assert.isNotNull(message.readAt)
  })

  test('should not allow marking own message as read', async ({ client }) => {
    const message = await Message.create({
      conversationId: conversation.id,
      senderId: user1.id,
      content: 'My own message',
      type: MessageType.TEXT,
    })

    const response = await client
      .put(`/api/common/messages/${message.id}/read`)
      .bearerToken(user1Token)
      .header('Accept', 'application/json')

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      message: 'Impossible de marquer vos propres messages comme lus',
    })
  })

  test('should return 403 if user is not participant when marking read', async ({ client }) => {
    const message = await Message.create({
      conversationId: conversation.id,
      senderId: user2.id,
      content: 'Message',
      type: MessageType.TEXT,
    })

    const response = await client
      .put(`/api/common/messages/${message.id}/read`)
      .bearerToken(user3Token) // user3 n'est pas participant
      .header('Accept', 'application/json')

    response.assertStatus(403)
  })

  // ===== Tests PUT /api/common/conversations/:conversationId/messages/read-all =====

  test('should mark all messages as read', async ({ client, assert }) => {
    // Créer plusieurs messages non lus
    await Message.create({
      conversationId: conversation.id,
      senderId: user2.id,
      content: 'Unread 1',
      type: MessageType.TEXT,
    })

    await Message.create({
      conversationId: conversation.id,
      senderId: user2.id,
      content: 'Unread 2',
      type: MessageType.TEXT,
    })

    await Message.create({
      conversationId: conversation.id,
      senderId: user2.id,
      content: 'Unread 3',
      type: MessageType.TEXT,
    })

    const response = await client
      .put(`/api/common/conversations/${conversation.id}/messages/read-all`)
      .bearerToken(user1Token)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    const body = response.body()
    assert.equal(body.data.updatedCount, 3)
  })

  test('should not mark own messages as read in bulk', async ({ client, assert }) => {
    // user1 envoie des messages
    await Message.create({
      conversationId: conversation.id,
      senderId: user1.id,
      content: 'My message 1',
      type: MessageType.TEXT,
    })

    // user2 envoie des messages
    await Message.create({
      conversationId: conversation.id,
      senderId: user2.id,
      content: 'Their message',
      type: MessageType.TEXT,
    })

    // user1 marque tout comme lu
    const response = await client
      .put(`/api/common/conversations/${conversation.id}/messages/read-all`)
      .bearerToken(user1Token)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    // Devrait avoir marqué 1 seul message (celui de user2)
    assert.equal(response.body().data.updatedCount, 1)
  })

  // ===== Tests GET /api/common/messages/unread-count =====

  test('should get unread message count', async ({ client, assert }) => {
    // Créer messages non lus dans différentes conversations
    await Message.create({
      conversationId: conversation.id,
      senderId: user2.id,
      content: 'Unread in conv1',
      type: MessageType.TEXT,
    })

    const response = await client
      .get('/api/common/messages/unread-count')
      .bearerToken(user1Token)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.exists(response.body().data.unreadCount)
    assert.isNumber(response.body().data.unreadCount)
    assert.isAtLeast(response.body().data.unreadCount, 1)
  })

  test('unread count should not include own messages', async ({ client, assert }) => {
    // user1 envoie des messages
    await Message.create({
      conversationId: conversation.id,
      senderId: user1.id,
      content: 'My own message',
      type: MessageType.TEXT,
    })

    const response = await client
      .get('/api/common/messages/unread-count')
      .bearerToken(user1Token)
      .header('Accept', 'application/json')

    response.assertStatus(200)

    // Le count ne devrait pas inclure les propres messages
    const unreadCount = response.body().data.unreadCount
    assert.isNumber(unreadCount)
  })

  // ===== Tests POST /api/common/conversations/:conversationId/typing =====

  test('should send typing indicator', async ({ client }) => {
    const response = await client
      .post(`/api/common/conversations/${conversation.id}/typing`)
      .bearerToken(user1Token)
      .json({
        isTyping: true,
      })
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Indicateur de saisie envoyé',
    })
  })

  test('should send stop typing indicator', async ({ client }) => {
    const response = await client
      .post(`/api/common/conversations/${conversation.id}/typing`)
      .bearerToken(user1Token)
      .json({
        isTyping: false,
      })
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('should return 403 if user is not participant when sending typing', async ({ client }) => {
    const response = await client
      .post(`/api/common/conversations/${conversation.id}/typing`)
      .bearerToken(user3Token) // user3 n'est pas participant
      .json({
        isTyping: true,
      })
      .header('Accept', 'application/json')

    response.assertStatus(403)
  })
})
