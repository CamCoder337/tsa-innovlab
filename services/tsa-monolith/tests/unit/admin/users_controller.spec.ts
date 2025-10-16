import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import AuditLog from '#models/audit_log'

test.group('Admin Users Controller', (group) => {
  let adminUser: User
  let adminToken: string

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Créer un utilisateur admin pour les tests
    adminUser = await User.create({
      email: 'admin-test@example.com',
      passwordHash: 'password123',
      firstName: 'Admin',
      lastName: 'Test',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mfaEnabled: true,
    })

    // Générer un token d'accès
    const token = await adminUser.generateAccessToken('test-token')
    adminToken = token
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should list users with pagination', async ({ client, assert }) => {
    // Créer quelques utilisateurs de test
    await User.createMany([
      {
        email: 'transporteur1@example.com',
        passwordHash: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TRANSPORTEUR,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
      {
        email: 'affreteur1@example.com',
        passwordHash: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.AFFRETEUR,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
      {
        email: 'client1@example.com',
        passwordHash: 'password123',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
    ])

    const response = await client
      .get('/api/admin/users')
      .bearerToken(adminToken)
      .qs({ page: 1, limit: 2 })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Users retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.users)
    assert.exists(body.data.pagination)
    assert.equal(body.data.pagination.perPage, 2)
  })

  test('should search users by email', async ({ client, assert }) => {
    await User.create({
      email: 'unique.user@example.com',
      passwordHash: 'password123',
      firstName: 'Unique',
      lastName: 'User',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const response = await client
      .get('/api/admin/users')
      .bearerToken(adminToken)
      .qs({ search: 'unique.user' })

    response.assertStatus(200)

    const body = response.body()
    assert.isAtLeast(body.data.users.length, 1)
    const foundUser = body.data.users.find((u: any) => u.email === 'unique.user@example.com')
    assert.exists(foundUser)
  })

  test('should search users by name', async ({ client, assert }) => {
    await User.create({
      email: 'searchtest@example.com',
      passwordHash: 'password123',
      firstName: 'Alexander',
      lastName: 'Hamilton',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const response = await client
      .get('/api/admin/users')
      .bearerToken(adminToken)
      .qs({ search: 'Alexander' })

    response.assertStatus(200)

    const body = response.body()
    assert.isAtLeast(body.data.users.length, 1)
    const foundUser = body.data.users.find((u: any) => u.firstName === 'Alexander')
    assert.exists(foundUser)
  })

  test('should filter users by role', async ({ client, assert }) => {
    await User.createMany([
      {
        email: 'transporteur2@example.com',
        passwordHash: 'password123',
        firstName: 'Driver',
        lastName: 'One',
        role: UserRole.TRANSPORTEUR,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
      {
        email: 'affreteur2@example.com',
        passwordHash: 'password123',
        firstName: 'Shipper',
        lastName: 'Two',
        role: UserRole.AFFRETEUR,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
    ])

    const response = await client
      .get('/api/admin/users')
      .bearerToken(adminToken)
      .qs({ role: UserRole.TRANSPORTEUR })

    response.assertStatus(200)

    const body = response.body()
    assert.isTrue(body.data.users.every((u: any) => u.role === UserRole.TRANSPORTEUR))
  })

  test('should filter users by status', async ({ client, assert }) => {
    await User.createMany([
      {
        email: 'active@example.com',
        passwordHash: 'password123',
        firstName: 'Active',
        lastName: 'User',
        role: UserRole.TRANSPORTEUR,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
      {
        email: 'suspended@example.com',
        passwordHash: 'password123',
        firstName: 'Suspended',
        lastName: 'User',
        role: UserRole.TRANSPORTEUR,
        status: UserStatus.SUSPENDED,
        mfaEnabled: false,
      },
    ])

    const response = await client
      .get('/api/admin/users')
      .bearerToken(adminToken)
      .qs({ status: UserStatus.SUSPENDED })

    response.assertStatus(200)

    const body = response.body()
    assert.isTrue(body.data.users.every((u: any) => u.status === UserStatus.SUSPENDED))
  })

  test('should show user details with client statistics', async ({ client, assert }) => {
    const clientUser = await User.create({
      email: 'client-detail@example.com',
      passwordHash: 'password123',
      firstName: 'Client',
      lastName: 'Detail',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const response = await client.get(`/api/admin/users/${clientUser.id}`).bearerToken(adminToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'User details retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.user)
    assert.exists(body.data.stats)
    assert.equal(body.data.user.id, clientUser.id)
    assert.equal(body.data.user.role, UserRole.CLIENT)
    // Stats should exist for client (even if 0)
    assert.exists(body.data.stats.totalOrders)
    assert.exists(body.data.stats.totalSpent)
  })

  test('should show user details with affreteur statistics', async ({ client, assert }) => {
    const affreteurUser = await User.create({
      email: 'affreteur-detail@example.com',
      passwordHash: 'password123',
      firstName: 'Affreteur',
      lastName: 'Detail',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const response = await client
      .get(`/api/admin/users/${affreteurUser.id}`)
      .bearerToken(adminToken)

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.data.user.id, affreteurUser.id)
    assert.equal(body.data.user.role, UserRole.AFFRETEUR)
    // Stats should exist for affreteur (even if 0)
    assert.exists(body.data.stats.totalMissions)
    assert.exists(body.data.stats.publishedMissions)
    assert.exists(body.data.stats.completedMissions)
  })

  test('should show user details with transporteur statistics', async ({ client, assert }) => {
    const transporteurUser = await User.create({
      email: 'transporteur-detail@example.com',
      passwordHash: 'password123',
      firstName: 'Transporteur',
      lastName: 'Detail',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const response = await client
      .get(`/api/admin/users/${transporteurUser.id}`)
      .bearerToken(adminToken)

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.data.user.id, transporteurUser.id)
    assert.equal(body.data.user.role, UserRole.TRANSPORTEUR)
    // Stats should exist for transporteur (even if 0)
    assert.exists(body.data.stats.totalPropositions)
    assert.exists(body.data.stats.acceptedPropositions)
    assert.exists(body.data.stats.pendingPropositions)
  })

  test('should return 404 for non-existent user', async ({ client }) => {
    const response = await client
      .get('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .bearerToken(adminToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'User not found',
    })
  })

  test('should suspend a user successfully', async ({ client, assert }) => {
    const userToSuspend = await User.create({
      email: 'to-suspend@example.com',
      passwordHash: 'password123',
      firstName: 'To',
      lastName: 'Suspend',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const response = await client
      .post(`/api/admin/users/${userToSuspend.id}/suspend`)
      .bearerToken(adminToken)
      .json({
        status: UserStatus.SUSPENDED,
        reason: "Violation des conditions d'utilisation",
      })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'User suspended successfully',
    })

    // Vérifier en base de données
    await userToSuspend.refresh()
    assert.equal(userToSuspend.status, UserStatus.SUSPENDED)

    // Vérifier l'audit log
    const auditLog = await AuditLog.query()
      .where('action', 'user.suspend')
      .where('entity_id', userToSuspend.id)
      .first()

    assert.exists(auditLog)
    assert.equal(auditLog!.userId, adminUser.id)
    assert.exists(auditLog!.newValues)
    assert.equal(auditLog!.newValues!.suspendReason, "Violation des conditions d'utilisation")
  })

  test('should not allow admin to suspend themselves', async ({ client }) => {
    const response = await client
      .post(`/api/admin/users/${adminUser.id}/suspend`)
      .bearerToken(adminToken)
      .json({
        status: UserStatus.SUSPENDED,
        reason: 'Test',
      })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      message: 'You cannot suspend your own account',
    })
  })

  test('should reject suspend with invalid status', async ({ client }) => {
    const userToSuspend = await User.create({
      email: 'invalid-suspend@example.com',
      passwordHash: 'password123',
      firstName: 'Invalid',
      lastName: 'Suspend',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const response = await client
      .post(`/api/admin/users/${userToSuspend.id}/suspend`)
      .bearerToken(adminToken)
      .json({
        status: UserStatus.ACTIVE, // Devrait être SUSPENDED
      })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Invalid status',
    })
  })

  test('should activate a suspended user', async ({ client, assert }) => {
    const suspendedUser = await User.create({
      email: 'suspended-user@example.com',
      passwordHash: 'password123',
      firstName: 'Suspended',
      lastName: 'User',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.SUSPENDED,
      mfaEnabled: false,
      failedLoginAttempts: 3,
    })

    const response = await client
      .post(`/api/admin/users/${suspendedUser.id}/activate`)
      .bearerToken(adminToken)
      .json({
        status: UserStatus.ACTIVE,
        reason: 'Compte réhabilité après vérification',
      })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'User activated successfully',
    })

    // Vérifier en base de données
    await suspendedUser.refresh()
    assert.equal(suspendedUser.status, UserStatus.ACTIVE)
    assert.equal(suspendedUser.failedLoginAttempts, 0)
    assert.isNull(suspendedUser.lockedUntil)

    // Vérifier l'audit log
    const auditLog = await AuditLog.query()
      .where('action', 'user.activate')
      .where('entity_id', suspendedUser.id)
      .first()

    assert.exists(auditLog)
    assert.equal(auditLog!.userId, adminUser.id)
  })

  test('should reject activate with invalid status', async ({ client }) => {
    const suspendedUser = await User.create({
      email: 'invalid-activate@example.com',
      passwordHash: 'password123',
      firstName: 'Invalid',
      lastName: 'Activate',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.SUSPENDED,
      mfaEnabled: false,
    })

    const response = await client
      .post(`/api/admin/users/${suspendedUser.id}/activate`)
      .bearerToken(adminToken)
      .json({
        status: UserStatus.SUSPENDED, // Devrait être ACTIVE
      })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Invalid status',
    })
  })

  test('should return user statistics', async ({ client, assert }) => {
    // Créer des utilisateurs de différents types
    await User.createMany([
      {
        email: 'stats-admin@example.com',
        passwordHash: 'password123',
        firstName: 'Stats',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        mfaEnabled: true,
      },
      {
        email: 'stats-transporteur@example.com',
        passwordHash: 'password123',
        firstName: 'Stats',
        lastName: 'Transporteur',
        role: UserRole.TRANSPORTEUR,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
      {
        email: 'stats-affreteur@example.com',
        passwordHash: 'password123',
        firstName: 'Stats',
        lastName: 'Affreteur',
        role: UserRole.AFFRETEUR,
        status: UserStatus.SUSPENDED,
        mfaEnabled: false,
      },
      {
        email: 'stats-client@example.com',
        passwordHash: 'password123',
        firstName: 'Stats',
        lastName: 'Client',
        role: UserRole.CLIENT,
        status: UserStatus.PENDING,
        mfaEnabled: false,
      },
    ])

    const response = await client.get('/api/admin/users/stats').bearerToken(adminToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'User statistics retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.stats)
    assert.exists(body.data.stats.byRole)
    assert.exists(body.data.stats.byStatus)
    assert.exists(body.data.stats.security)

    // Vérifier que les statistiques sont des nombres
    assert.isNumber(body.data.stats.total)
    assert.isNumber(body.data.stats.byRole.admin)
    assert.isNumber(body.data.stats.byRole.transporteur)
    assert.isNumber(body.data.stats.byRole.affreteur)
    assert.isNumber(body.data.stats.byRole.client)
    assert.isNumber(body.data.stats.byStatus.active)
    assert.isNumber(body.data.stats.byStatus.suspended)
    assert.isNumber(body.data.stats.byStatus.pending)
    assert.isNumber(body.data.stats.security.mfaEnabled)
  })

  test('should require admin authentication', async ({ client }) => {
    const response = await client.get('/api/admin/users')

    response.assertStatus(401)
  })

  test('should not allow non-admin users', async ({ client }) => {
    const regularUser = await User.create({
      email: 'regular@example.com',
      passwordHash: 'password123',
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const regularToken = await regularUser.generateAccessToken('test-token')

    const response = await client.get('/api/admin/users').bearerToken(regularToken)

    response.assertStatus(403)
  })

  test('should not allow affreteur to access admin users', async ({ client }) => {
    const affreteurUser = await User.create({
      email: 'affreteur-forbidden@example.com',
      passwordHash: 'password123',
      firstName: 'Affreteur',
      lastName: 'Forbidden',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const affreteurToken = await affreteurUser.generateAccessToken('test-token')

    const response = await client.get('/api/admin/users').bearerToken(affreteurToken)

    response.assertStatus(403)
  })
})
