import { test } from '@japa/runner'
import User, { UserRole, UserStatus } from '#models/user'
import Mission from '#models/mission'
import Conversation from '#models/conversation'
import Database from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

test.group('Conversations API', (group) => {
  let admin: User
  let affreteur: User
  let transporteur: User
  let affreteur2: User
  let adminToken: string
  let affreteurToken: string
  let transporteurToken: string

  group.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  group.each.setup(async () => {
    // Créer utilisateurs de test avec emails uniques
    const timestamp = Date.now()
    admin = await User.create({
      email: `admin-conv-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Admin',
      lastName: 'Test',
      phone: `+3370000${timestamp.toString().slice(-4)}`,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: true,
    })

    affreteur = await User.create({
      email: `affreteur-conv-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Affreteur',
      lastName: 'Test',
      phone: `+3370001${timestamp.toString().slice(-4)}`,
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
    })

    affreteur2 = await User.create({
      email: `affreteur2-conv-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Affreteur2',
      lastName: 'Test',
      phone: `+3370002${timestamp.toString().slice(-4)}`,
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
    })

    transporteur = await User.create({
      email: `transporteur-conv-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Transporteur',
      lastName: 'Test',
      phone: `+3370003${timestamp.toString().slice(-4)}`,
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
    })

    // Générer tokens JWT réels
    adminToken = await admin.generateAccessToken('test-token')
    affreteurToken = await affreteur.generateAccessToken('test-token')
    transporteurToken = await transporteur.generateAccessToken('test-token')
  })

  // ===== Tests GET /api/common/conversations =====

  test('should list user conversations', async ({ client, assert }) => {
    // Créer une conversation de test
    const conversation = await Conversation.create({
      type: 'direct',
      user1Id: admin.id,
      user2Id: affreteur.id,
      lastActivityAt: DateTime.now(),
    })

    const response = await client
      .get('/api/common/conversations')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.isArray(response.body().data.data)
  })

  test('should filter conversations by type', async ({ client, assert }) => {
    const response = await client
      .get('/api/common/conversations?type=direct')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    assert.isArray(response.body().data.data)
  })

  test('should paginate conversations', async ({ client, assert }) => {
    const response = await client
      .get('/api/common/conversations?page=1&limit=10')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    const body = response.body()
    assert.exists(body.data.meta)
    assert.exists(body.data.meta.total)
  })

  test('should return 401 if not authenticated', async ({ client }) => {
    const response = await client
      .get('/api/common/conversations')
      .header('Accept', 'application/json')

    response.assertStatus(401)
  })

  // ===== Tests GET /api/common/conversations/:id =====

  test('should get conversation details', async ({ client, assert }) => {
    const conversation = await Conversation.create({
      type: 'direct',
      user1Id: admin.id,
      user2Id: affreteur.id,
      lastActivityAt: DateTime.now(),
    })

    const response = await client
      .get(`/api/common/conversations/${conversation.id}`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    assert.equal(response.body().data.id, conversation.id)
  })

  test('should return 403 if user is not participant', async ({ client }) => {
    const conversation = await Conversation.create({
      type: 'direct',
      user1Id: admin.id,
      user2Id: affreteur.id,
      lastActivityAt: DateTime.now(),
    })

    const response = await client
      .get(`/api/common/conversations/${conversation.id}`)
      .bearerToken(transporteurToken)
      .header('Accept', 'application/json')

    response.assertStatus(403)
    response.assertBodyContains({
      success: false,
      message: 'Accès refusé à cette conversation',
    })
  })

  // ===== Tests POST /api/common/conversations/direct =====

  test('Admin should create direct conversation with Affreteur', async ({ client, assert }) => {
    const response = await client
      .post('/api/common/conversations/direct')
      .bearerToken(adminToken)
      .json({ userId: affreteur.id })
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.equal(response.body().data.type, 'direct')
  })

  test('Admin should create direct conversation with Transporteur', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/api/common/conversations/direct')
      .bearerToken(adminToken)
      .json({ userId: transporteur.id })
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.equal(response.body().data.type, 'direct')
  })

  test('Affreteur should NOT create direct conversation with Transporteur', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/api/common/conversations/direct')
      .bearerToken(affreteurToken)
      .json({ userId: transporteur.id })
      .header('Accept', 'application/json')

    response.assertStatus(403)
    response.assertBodyContains({
      success: false,
    })
    assert.include(
      response.body().message.toLowerCase(),
      'conversations directes entre affreteurs et transporteurs'
    )
  })

  test('Transporteur should NOT create direct conversation with Affreteur', async ({
    client,
  }) => {
    const response = await client
      .post('/api/common/conversations/direct')
      .bearerToken(transporteurToken)
      .json({ userId: affreteur.id })
      .header('Accept', 'application/json')

    response.assertStatus(403)
    response.assertBodyContains({ success: false })
  })

  test('Affreteurs should create conversation between themselves', async ({ client, assert }) => {
    const response = await client
      .post('/api/common/conversations/direct')
      .bearerToken(affreteurToken)
      .json({ userId: affreteur2.id })
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.equal(response.body().data.type, 'direct')
  })

  test('Should return existing conversation if already exists', async ({ client, assert }) => {
    // Créer conversation
    const firstResponse = await client
      .post('/api/common/conversations/direct')
      .bearerToken(adminToken)
      .json({ userId: affreteur.id })
      .header('Accept', 'application/json')

    const firstConversationId = firstResponse.body().data.id

    // Tenter de créer à nouveau
    const secondResponse = await client
      .post('/api/common/conversations/direct')
      .bearerToken(adminToken)
      .json({ userId: affreteur.id })
      .header('Accept', 'application/json')

    assert.equal(secondResponse.body().data.id, firstConversationId)
  })

  test('Should return 400 if trying to create conversation with self', async ({ client }) => {
    const response = await client
      .post('/api/common/conversations/direct')
      .bearerToken(adminToken)
      .json({ userId: admin.id })
      .header('Accept', 'application/json')

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Impossible de créer une conversation avec soi-même',
    })
  })

  // ===== Tests POST /api/common/conversations/mission =====

  test('Should create mission conversation when users are linked', async ({ client, assert }) => {
    const mission = await Mission.create({
      titre: 'Test Mission Conv',
      description: 'Test',
      typeMarchandise: 'Electronics',
      poids: 100,
      volume: 50,
      budgetMin: 50000,
      budgetMax: 100000,
      status: 'published',
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
    })

    const response = await client
      .post('/api/common/conversations/mission')
      .bearerToken(affreteurToken)
      .json({
        missionId: mission.id,
        userId: transporteur.id,
      })
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.equal(response.body().data.type, 'mission')
    assert.equal(response.body().data.missionId, mission.id)
  })

  test('Should reject mission conversation if users not linked', async ({ client }) => {
    const mission = await Mission.create({
      titre: 'Test Mission Conv 2',
      description: 'Test',
      typeMarchandise: 'Electronics',
      poids: 100,
      volume: 50,
      budgetMin: 50000,
      budgetMax: 100000,
      status: 'published',
      affreteurId: affreteur.id,
      transporteurId: null, // Pas de transporteur
    })

    const response = await client
      .post('/api/common/conversations/mission')
      .bearerToken(affreteurToken)
      .json({
        missionId: mission.id,
        userId: transporteur.id, // Transporteur non lié
      })
      .header('Accept', 'application/json')

    response.assertStatus(403)
    response.assertBodyContains({ success: false })
  })

  test('Admin should create mission conversation regardless', async ({ client, assert }) => {
    const mission = await Mission.create({
      titre: 'Test Mission Conv 3',
      description: 'Test',
      typeMarchandise: 'Electronics',
      poids: 100,
      volume: 50,
      budgetMin: 50000,
      budgetMax: 100000,
      status: 'published',
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
    })

    const response = await client
      .post('/api/common/conversations/mission')
      .bearerToken(adminToken)
      .json({
        missionId: mission.id,
        userId: transporteur.id,
      })
      .header('Accept', 'application/json')

    response.assertStatus(200)
    assert.equal(response.body().data.type, 'mission')
  })

  // ===== Tests GET /api/common/conversations/search/users =====

  test('Should search users by name', async ({ client, assert }) => {
    const response = await client
      .get('/api/common/conversations/search/users?search=Affreteur')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    assert.isArray(response.body().data)
  })

  test('Should filter users by role', async ({ client, assert }) => {
    const response = await client
      .get('/api/common/conversations/search/users?role=transporteur')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    const users = response.body().data
    assert.isArray(users)

    if (users.length > 0) {
      assert.equal(users[0].role, 'transporteur')
    }
  })

  test('Should not return current user in search', async ({ client, assert }) => {
    const response = await client
      .get('/api/common/conversations/search/users')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    const users = response.body().data
    const currentUserInResults = users.find((u: any) => u.id === admin.id)

    assert.isUndefined(currentUserInResults)
  })

  test('Should limit search results', async ({ client, assert }) => {
    const response = await client
      .get('/api/common/conversations/search/users?limit=1')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    const users = response.body().data
    assert.isAtMost(users.length, 1)
  })
})
