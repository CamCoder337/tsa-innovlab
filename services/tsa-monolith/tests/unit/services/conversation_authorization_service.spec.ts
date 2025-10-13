import { test } from '@japa/runner'
import ConversationAuthorizationService from '#services/conversation_authorization_service'
import User, { UserRole } from '#models/user'
import Mission from '#models/mission'
import Database from '@adonisjs/lucid/services/db'

test.group('ConversationAuthorizationService', (group) => {
  group.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  // ===== Tests Conversations Directes =====

  test('Admin should be able to converse with Affreteur', async ({ assert }) => {
    const admin = await User.create({
      email: 'admin@test.com',
      passwordHash: 'hash',
      firstName: 'Admin',
      lastName: 'Test',
      phone: '+33612345678',
      role: UserRole.ADMIN,
    })

    const affreteur = await User.create({
      email: 'affreteur@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur',
      lastName: 'Test',
      phone: '+33612345679',
      role: UserRole.AFFRETEUR,
    })

    const canConverse = ConversationAuthorizationService.canConverseDirect(admin, affreteur)
    assert.isTrue(canConverse)
  })

  test('Admin should be able to converse with Transporteur', async ({ assert }) => {
    const admin = await User.create({
      email: 'admin2@test.com',
      passwordHash: 'hash',
      firstName: 'Admin',
      lastName: 'Test',
      phone: '+33612345680',
      role: UserRole.ADMIN,
    })

    const transporteur = await User.create({
      email: 'transporteur@test.com',
      passwordHash: 'hash',
      firstName: 'Transporteur',
      lastName: 'Test',
      phone: '+33612345681',
      role: UserRole.TRANSPORTEUR,
    })

    const canConverse = ConversationAuthorizationService.canConverseDirect(admin, transporteur)
    assert.isTrue(canConverse)
  })

  test('Affreteur should NOT be able to converse directly with Transporteur', async ({
    assert,
  }) => {
    const affreteur = await User.create({
      email: 'affreteur2@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur',
      lastName: 'Test',
      phone: '+33612345682',
      role: UserRole.AFFRETEUR,
    })

    const transporteur = await User.create({
      email: 'transporteur2@test.com',
      passwordHash: 'hash',
      firstName: 'Transporteur',
      lastName: 'Test',
      phone: '+33612345683',
      role: UserRole.TRANSPORTEUR,
    })

    const canConverse = ConversationAuthorizationService.canConverseDirect(affreteur, transporteur)
    assert.isFalse(canConverse)
  })

  test('Transporteur should NOT be able to converse directly with Affreteur', async ({
    assert,
  }) => {
    const transporteur = await User.create({
      email: 'transporteur3@test.com',
      passwordHash: 'hash',
      firstName: 'Transporteur',
      lastName: 'Test',
      phone: '+33612345684',
      role: UserRole.TRANSPORTEUR,
    })

    const affreteur = await User.create({
      email: 'affreteur3@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur',
      lastName: 'Test',
      phone: '+33612345685',
      role: UserRole.AFFRETEUR,
    })

    const canConverse = ConversationAuthorizationService.canConverseDirect(transporteur, affreteur)
    assert.isFalse(canConverse)
  })

  test('Users with same role should be able to converse', async ({ assert }) => {
    const affreteur1 = await User.create({
      email: 'affreteur4@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur1',
      lastName: 'Test',
      phone: '+33612345686',
      role: UserRole.AFFRETEUR,
    })

    const affreteur2 = await User.create({
      email: 'affreteur5@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur2',
      lastName: 'Test',
      phone: '+33612345687',
      role: UserRole.AFFRETEUR,
    })

    const canConverse = ConversationAuthorizationService.canConverseDirect(affreteur1, affreteur2)
    assert.isTrue(canConverse)
  })

  test('Should return correct denial reason for Affreteur-Transporteur', async ({ assert }) => {
    const affreteur = await User.create({
      email: 'affreteur6@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur',
      lastName: 'Test',
      phone: '+33612345688',
      role: UserRole.AFFRETEUR,
    })

    const transporteur = await User.create({
      email: 'transporteur4@test.com',
      passwordHash: 'hash',
      firstName: 'Transporteur',
      lastName: 'Test',
      phone: '+33612345689',
      role: UserRole.TRANSPORTEUR,
    })

    const reason = ConversationAuthorizationService.getDirectConversationDenialReason(
      affreteur,
      transporteur
    )

    assert.include(
      reason,
      'Les conversations directes entre affreteurs et transporteurs ne sont pas autorisées'
    )
    assert.include(reason, 'mission')
  })

  // ===== Tests Conversations Mission =====

  test('Affreteur and Transporteur linked to same mission should be able to converse', async ({
    assert,
  }) => {
    const affreteur = await User.create({
      email: 'affreteur7@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur',
      lastName: 'Test',
      phone: '+33612345690',
      role: UserRole.AFFRETEUR,
    })

    const transporteur = await User.create({
      email: 'transporteur5@test.com',
      passwordHash: 'hash',
      firstName: 'Transporteur',
      lastName: 'Test',
      phone: '+33612345691',
      role: UserRole.TRANSPORTEUR,
    })

    const mission = await Mission.create({
      titre: 'Test Mission',
      description: 'Test Description',
      typeMarchandise: 'Electronics',
      poids: 100,
      volume: 50,
      budgetMin: 50000,
      budgetMax: 100000,
      status: 'published',
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
    })

    const result = await ConversationAuthorizationService.canConverseMission(
      affreteur,
      transporteur,
      mission
    )

    assert.isTrue(result.authorized)
    assert.isUndefined(result.reason)
  })

  test('Should reject conversation when Affreteur is not linked to mission', async ({
    assert,
  }) => {
    const affreteur = await User.create({
      email: 'affreteur8@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur',
      lastName: 'Test',
      phone: '+33612345692',
      role: UserRole.AFFRETEUR,
    })

    const transporteur = await User.create({
      email: 'transporteur6@test.com',
      passwordHash: 'hash',
      firstName: 'Transporteur',
      lastName: 'Test',
      phone: '+33612345693',
      role: UserRole.TRANSPORTEUR,
    })

    const otherAffreteur = await User.create({
      email: 'affreteur9@test.com',
      passwordHash: 'hash',
      firstName: 'OtherAffreteur',
      lastName: 'Test',
      phone: '+33612345694',
      role: UserRole.AFFRETEUR,
    })

    const mission = await Mission.create({
      titre: 'Test Mission 2',
      description: 'Test Description',
      typeMarchandise: 'Electronics',
      poids: 100,
      volume: 50,
      budgetMin: 50000,
      budgetMax: 100000,
      status: 'published',
      affreteurId: otherAffreteur.id,
      transporteurId: transporteur.id,
    })

    const result = await ConversationAuthorizationService.canConverseMission(
      affreteur,
      transporteur,
      mission
    )

    assert.isFalse(result.authorized)
    assert.exists(result.reason)
    assert.include(result.reason!, 'pas lié à cette mission')
  })

  test('Should reject conversation when Transporteur is not linked to mission', async ({
    assert,
  }) => {
    const affreteur = await User.create({
      email: 'affreteur10@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur',
      lastName: 'Test',
      phone: '+33612345695',
      role: UserRole.AFFRETEUR,
    })

    const transporteur = await User.create({
      email: 'transporteur7@test.com',
      passwordHash: 'hash',
      firstName: 'Transporteur',
      lastName: 'Test',
      phone: '+33612345696',
      role: UserRole.TRANSPORTEUR,
    })

    const mission = await Mission.create({
      titre: 'Test Mission 3',
      description: 'Test Description',
      typeMarchandise: 'Electronics',
      poids: 100,
      volume: 50,
      budgetMin: 50000,
      budgetMax: 100000,
      status: 'published',
      affreteurId: affreteur.id,
      transporteurId: null, // Pas de transporteur assigné
    })

    const result = await ConversationAuthorizationService.canConverseMission(
      affreteur,
      transporteur,
      mission
    )

    assert.isFalse(result.authorized)
    assert.exists(result.reason)
    assert.include(result.reason!, 'pas lié à cette mission')
  })

  test('Admin should always be able to create mission conversations', async ({ assert }) => {
    const admin = await User.create({
      email: 'admin3@test.com',
      passwordHash: 'hash',
      firstName: 'Admin',
      lastName: 'Test',
      phone: '+33612345697',
      role: UserRole.ADMIN,
    })

    const transporteur = await User.create({
      email: 'transporteur8@test.com',
      passwordHash: 'hash',
      firstName: 'Transporteur',
      lastName: 'Test',
      phone: '+33612345698',
      role: UserRole.TRANSPORTEUR,
    })

    const affreteur = await User.create({
      email: 'affreteur11@test.com',
      passwordHash: 'hash',
      firstName: 'Affreteur',
      lastName: 'Test',
      phone: '+33612345699',
      role: UserRole.AFFRETEUR,
    })

    const mission = await Mission.create({
      titre: 'Test Mission 4',
      description: 'Test Description',
      typeMarchandise: 'Electronics',
      poids: 100,
      volume: 50,
      budgetMin: 50000,
      budgetMax: 100000,
      status: 'published',
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
    })

    const result = await ConversationAuthorizationService.canConverseMission(
      admin,
      transporteur,
      mission
    )

    assert.isTrue(result.authorized)
  })

  // ===== Tests Accès Conversation =====

  test('Should allow access when user is participant', async ({ assert }) => {
    const userId = 'user-123'
    const participantIds = ['user-123', 'user-456']

    const canAccess = ConversationAuthorizationService.canAccessConversation(
      userId,
      participantIds
    )

    assert.isTrue(canAccess)
  })

  test('Should deny access when user is not participant', async ({ assert }) => {
    const userId = 'user-789'
    const participantIds = ['user-123', 'user-456']

    const canAccess = ConversationAuthorizationService.canAccessConversation(
      userId,
      participantIds
    )

    assert.isFalse(canAccess)
  })
})
