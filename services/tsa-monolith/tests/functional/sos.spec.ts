import { test } from '@japa/runner'
import User, { UserRole, UserStatus } from '#models/user'
import Mission, { MissionStatus } from '#models/mission'
import MissionIssue, { IssueType, IssueStatus, IssuePriority } from '#models/mission_issue'
import Database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

test.group('SOS API - Driver Endpoint', (group) => {
  let affreteur: User
  let transporteur: User
  let trackingToken: string
  let trackingPin: string

  group.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  group.each.setup(async () => {
    const timestamp = Date.now()

    // Créer utilisateurs
    affreteur = await User.create({
      email: `affreteur-sos-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Affreteur',
      lastName: 'SOS Test',
      phone: `+2376510001${timestamp.toString().slice(-4)}`,
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
    })

    transporteur = await User.create({
      email: `transporteur-sos-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Transporteur',
      lastName: 'SOS Test',
      phone: `+2376510002${timestamp.toString().slice(-4)}`,
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
    })

    // Créer mission avec tracking
    trackingToken = crypto.randomBytes(32).toString('hex')
    trackingPin = '1234'

    await Mission.create({
      title: 'Mission SOS Test',
      description: 'Test mission for SOS',
      typeMarchandise: 'Electronics',
      poids: 100,
      volume: 50,
      budgetMin: 50000,
      budgetMax: 100000,
      status: MissionStatus.IN_PROGRESS,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      trackingLinkToken: trackingToken,
      trackingPin,
    })
  })

  // ===== Tests POST /track/:token/sos =====

  test('should create SOS alert with valid data', async ({ client, assert }) => {
    const response = await client
      .post(`/track/${trackingToken}/sos`)
      .header('X-Tracking-Token', trackingToken)
      .header('X-Tracking-Pin', trackingPin)
      .json({
        type: 'accident',
        latitude: 4.0511,
        longitude: 9.7679,
        description: 'Accident de la route',
      })

    response.assertStatus(201)
    response.assertBodyContains({ success: true })

    const body = response.body()
    assert.exists(body.data.issue)
    assert.equal(body.data.issue.type, 'accident')
    assert.equal(body.data.issue.priority, IssuePriority.CRITICAL)
    assert.exists(body.data.emergencyContacts)
    assert.equal(body.data.emergencyContacts.police, '117')
  })

  test('should set CRITICAL priority for accident', async ({ client, assert }) => {
    const response = await client
      .post(`/track/${trackingToken}/sos`)
      .header('X-Tracking-Token', trackingToken)
      .header('X-Tracking-Pin', trackingPin)
      .json({
        type: 'accident',
        latitude: 4.0511,
        longitude: 9.7679,
      })

    response.assertStatus(201)
    assert.equal(response.body().data.issue.priority, IssuePriority.CRITICAL)
  })

  test('should set CRITICAL priority for medical', async ({ client, assert }) => {
    const response = await client
      .post(`/track/${trackingToken}/sos`)
      .header('X-Tracking-Token', trackingToken)
      .header('X-Tracking-Pin', trackingPin)
      .json({
        type: 'medical',
        latitude: 4.0511,
        longitude: 9.7679,
      })

    response.assertStatus(201)
    assert.equal(response.body().data.issue.priority, IssuePriority.CRITICAL)
  })

  test('should set CRITICAL priority for security', async ({ client, assert }) => {
    const response = await client
      .post(`/track/${trackingToken}/sos`)
      .header('X-Tracking-Token', trackingToken)
      .header('X-Tracking-Pin', trackingPin)
      .json({
        type: 'security',
        latitude: 4.0511,
        longitude: 9.7679,
      })

    response.assertStatus(201)
    assert.equal(response.body().data.issue.priority, IssuePriority.CRITICAL)
  })

  test('should set HIGH priority for breakdown', async ({ client, assert }) => {
    const response = await client
      .post(`/track/${trackingToken}/sos`)
      .header('X-Tracking-Token', trackingToken)
      .header('X-Tracking-Pin', trackingPin)
      .json({
        type: 'breakdown',
        latitude: 4.0511,
        longitude: 9.7679,
      })

    response.assertStatus(201)
    assert.equal(response.body().data.issue.priority, IssuePriority.HIGH)
  })

  test('should reject SOS without GPS coordinates', async ({ client }) => {
    const response = await client
      .post(`/track/${trackingToken}/sos`)
      .header('X-Tracking-Token', trackingToken)
      .header('X-Tracking-Pin', trackingPin)
      .json({
        type: 'accident',
      })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      message: 'GPS location required for SOS',
    })
  })

  test('should reject SOS with invalid type', async ({ client }) => {
    const response = await client
      .post(`/track/${trackingToken}/sos`)
      .header('X-Tracking-Token', trackingToken)
      .header('X-Tracking-Pin', trackingPin)
      .json({
        type: 'invalid_type',
        latitude: 4.0511,
        longitude: 9.7679,
      })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      message: 'Invalid SOS type',
    })
  })

  test('should reject SOS without authentication', async ({ client }) => {
    const response = await client.post(`/track/${trackingToken}/sos`).json({
      type: 'accident',
      latitude: 4.0511,
      longitude: 9.7679,
    })

    response.assertStatus(401)
  })

  test('should reject SOS with wrong PIN', async ({ client }) => {
    const response = await client
      .post(`/track/${trackingToken}/sos`)
      .header('X-Tracking-Token', trackingToken)
      .header('X-Tracking-Pin', 'wrong_pin')
      .json({
        type: 'accident',
        latitude: 4.0511,
        longitude: 9.7679,
      })

    response.assertStatus(401)
  })

  test('should create emergency conversation', async ({ client, assert }) => {
    const response = await client
      .post(`/track/${trackingToken}/sos`)
      .header('X-Tracking-Token', trackingToken)
      .header('X-Tracking-Pin', trackingPin)
      .json({
        type: 'accident',
        latitude: 4.0511,
        longitude: 9.7679,
      })

    response.assertStatus(201)
    // La conversation peut être null si l'affréteur n'existe pas
    // mais dans notre cas il existe
    assert.exists(response.body().data.conversationId)
  })
})

test.group('SOS API - Admin Endpoints', (group) => {
  let admin: User
  let affreteur: User
  let transporteur: User
  let mission: Mission
  let sosIssue: MissionIssue
  let adminToken: string

  group.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  group.each.setup(async () => {
    const timestamp = Date.now()

    // Créer utilisateurs
    admin = await User.create({
      email: `admin-sos-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Admin',
      lastName: 'SOS Test',
      phone: `+2376510000${timestamp.toString().slice(-4)}`,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: true,
    })

    affreteur = await User.create({
      email: `affreteur-admin-sos-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Affreteur',
      lastName: 'Admin SOS Test',
      phone: `+2376510001${timestamp.toString().slice(-4)}`,
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
    })

    transporteur = await User.create({
      email: `transporteur-admin-sos-${timestamp}@test.com`,
      passwordHash: 'hashedpassword123',
      firstName: 'Transporteur',
      lastName: 'Admin SOS Test',
      phone: `+2376510002${timestamp.toString().slice(-4)}`,
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
    })

    mission = await Mission.create({
      title: 'Mission Admin SOS Test',
      description: 'Test mission for admin SOS',
      typeMarchandise: 'Electronics',
      poids: 100,
      volume: 50,
      budgetMin: 50000,
      budgetMax: 100000,
      status: MissionStatus.IN_PROGRESS,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
    })

    // Créer une urgence SOS
    sosIssue = await MissionIssue.create({
      missionId: mission.id,
      reportedById: transporteur.id,
      type: IssueType.ACCIDENT,
      description: 'Test SOS accident',
      latitude: 4.0511,
      longitude: 9.7679,
      status: IssueStatus.REPORTED,
      isEmergency: true,
      priority: IssuePriority.CRITICAL,
    })

    adminToken = await admin.generateAccessToken('test-token')
  })

  // ===== Tests GET /api/admin/emergencies =====

  test('should list emergencies', async ({ client, assert }) => {
    const response = await client
      .get('/api/admin/emergencies')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.isArray(response.body().data.data)
  })

  test('should filter active emergencies', async ({ client, assert }) => {
    const response = await client
      .get('/api/admin/emergencies?status=active')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    const emergencies = response.body().data.data
    assert.isArray(emergencies)

    // Toutes les urgences retournées doivent être actives
    emergencies.forEach((e: any) => {
      assert.include(['reported', 'acknowledged', 'in_progress'], e.status)
    })
  })

  test('should filter by priority', async ({ client, assert }) => {
    const response = await client
      .get('/api/admin/emergencies?priority=1')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    const emergencies = response.body().data.data

    emergencies.forEach((e: any) => {
      assert.equal(e.priority, 1)
    })
  })

  // ===== Tests GET /api/admin/emergencies/stats =====

  test('should get emergency stats', async ({ client, assert }) => {
    const response = await client
      .get('/api/admin/emergencies/stats')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    const stats = response.body().data
    assert.exists(stats.active)
    assert.exists(stats.critical)
    assert.exists(stats.high)
    assert.exists(stats.resolvedToday)
    assert.exists(stats.avgResponseTimeMinutes)
  })

  // ===== Tests GET /api/admin/emergencies/:id =====

  test('should get emergency details', async ({ client, assert }) => {
    const response = await client
      .get(`/api/admin/emergencies/${sosIssue.id}`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    const emergency = response.body().data.emergency
    assert.equal(emergency.id, sosIssue.id)
    assert.equal(emergency.isEmergency, true)
  })

  test('should return 404 for non-existent emergency', async ({ client }) => {
    const response = await client
      .get('/api/admin/emergencies/non-existent-id')
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(404)
  })

  // ===== Tests POST /api/admin/emergencies/:id/acknowledge =====

  test('should acknowledge emergency', async ({ client, assert }) => {
    const response = await client
      .post(`/api/admin/emergencies/${sosIssue.id}/acknowledge`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    const issue = response.body().data.issue
    assert.equal(issue.status, IssueStatus.ACKNOWLEDGED)
    assert.equal(issue.handledById, admin.id)
    assert.exists(issue.firstResponseAt)
  })

  test('should reject acknowledge if already handled', async ({ client }) => {
    // D'abord acknowledge
    await client
      .post(`/api/admin/emergencies/${sosIssue.id}/acknowledge`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    // Tenter de nouveau
    const response = await client
      .post(`/api/admin/emergencies/${sosIssue.id}/acknowledge`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      message: 'Emergency already being handled',
    })
  })

  // ===== Tests POST /api/admin/emergencies/:id/in-progress =====

  test('should mark emergency as in progress', async ({ client, assert }) => {
    // D'abord acknowledge
    await client
      .post(`/api/admin/emergencies/${sosIssue.id}/acknowledge`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    const response = await client
      .post(`/api/admin/emergencies/${sosIssue.id}/in-progress`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(200)
    assert.equal(response.body().data.issue.status, IssueStatus.IN_PROGRESS)
  })

  // ===== Tests POST /api/admin/emergencies/:id/resolve =====

  test('should resolve emergency', async ({ client, assert }) => {
    // D'abord acknowledge
    await client
      .post(`/api/admin/emergencies/${sosIssue.id}/acknowledge`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    const response = await client
      .post(`/api/admin/emergencies/${sosIssue.id}/resolve`)
      .bearerToken(adminToken)
      .json({ resolution_notes: 'Problème résolu, dépanneuse envoyée' })
      .header('Accept', 'application/json')

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    const issue = response.body().data.issue
    assert.equal(issue.status, IssueStatus.RESOLVED)
    assert.exists(issue.resolvedAt)
  })

  test('should reject resolve if already resolved', async ({ client }) => {
    // Acknowledge puis resolve
    await client
      .post(`/api/admin/emergencies/${sosIssue.id}/acknowledge`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    await client
      .post(`/api/admin/emergencies/${sosIssue.id}/resolve`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    // Tenter de résoudre à nouveau
    const response = await client
      .post(`/api/admin/emergencies/${sosIssue.id}/resolve`)
      .bearerToken(adminToken)
      .header('Accept', 'application/json')

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      message: 'Emergency already resolved',
    })
  })

  // ===== Tests d'autorisation =====

  test('should reject non-admin access to emergencies', async ({ client }) => {
    const affreteurToken = await affreteur.generateAccessToken('test-token')

    const response = await client
      .get('/api/admin/emergencies')
      .bearerToken(affreteurToken)
      .header('Accept', 'application/json')

    response.assertStatus(403)
  })
})
