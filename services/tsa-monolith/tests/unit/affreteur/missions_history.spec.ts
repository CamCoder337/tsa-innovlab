import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import Mission, { MissionStatus } from '#models/mission'
import Address from '#models/address'
import MissionUpdate from '#models/mission_update'

test.group('Affreteur Missions History', (group) => {
  let affreteur: User
  let otherAffreteur: User
  let transporteur: User
  let affreteurToken: string
  let otherAffreteurToken: string
  let adresseDepart: Address
  let adresseArrivee: Address

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Créer un affreteur
    affreteur = await User.create({
      email: 'affreteur@test.com',
      passwordHash: 'password123',
      firstName: 'Jane',
      lastName: 'Shipper',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    // Créer un autre affreteur
    otherAffreteur = await User.create({
      email: 'other-affreteur@test.com',
      passwordHash: 'password123',
      firstName: 'Other',
      lastName: 'Shipper',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    // Créer un transporteur
    transporteur = await User.create({
      email: 'transporteur@test.com',
      passwordHash: 'password123',
      firstName: 'John',
      lastName: 'Driver',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    // Créer des adresses
    adresseDepart = await Address.create({
      street: '123 Rue de Départ',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '1234',
    })

    adresseArrivee = await Address.create({
      street: '456 Avenue Arrivée',
      city: 'Yaoundé',
      region: 'Centre',
      country: 'Cameroun',
      postalCode: '5678',
    })

    affreteurToken = await affreteur.generateAccessToken('test-token')
    otherAffreteurToken = await otherAffreteur.generateAccessToken('test-token')
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should retrieve mission history for own mission', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission avec historique',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    // Créer quelques mises à jour
    await MissionUpdate.createStatusUpdate(
      mission.id,
      transporteur.id,
      MissionStatus.PUBLISHED,
      MissionStatus.ASSIGNED,
      'Mission assignée'
    )

    await MissionUpdate.createLocationUpdate(
      mission.id,
      transporteur.id,
      3.8667,
      11.5167,
      'Yaoundé'
    )

    const response = await client
      .get(`/api/affreteur/missions/${mission.id}/history`)
      .bearerToken(affreteurToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Mission history retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.mission)
    assert.equal(body.data.mission.id, mission.id)

    const updates = body.data.updates.data || body.data.updates
    assert.isAtLeast(updates.length, 2)

    // Vérifier que les mises à jour sont triées par date décroissante
    const timestamps = updates.map((u: any) => new Date(u.createdAt).getTime())
    const sortedTimestamps = [...timestamps].sort((a, b) => b - a)
    assert.deepEqual(timestamps, sortedTimestamps)
  })

  test('should support pagination for mission history', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission avec beaucoup d\'historique',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    // Créer 10 mises à jour
    for (let i = 0; i < 10; i++) {
      await MissionUpdate.createLocationUpdate(
        mission.id,
        transporteur.id,
        3.8667 + i * 0.01,
        11.5167 + i * 0.01
      )
    }

    const response = await client
      .get(`/api/affreteur/missions/${mission.id}/history`)
      .bearerToken(affreteurToken)
      .qs({ page: 1, limit: 5 })

    response.assertStatus(200)

    const body = response.body()
    const updates = body.data.updates.data || body.data.updates

    assert.isAtMost(updates.length, 5)
    assert.exists(body.data.pagination)
    assert.equal(body.data.pagination.per_page, 5)
  })

  test('should filter mission history by type', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission avec différents types',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    // Créer des mises à jour de différents types
    await MissionUpdate.createStatusUpdate(
      mission.id,
      transporteur.id,
      MissionStatus.PUBLISHED,
      MissionStatus.ASSIGNED,
      'Assignation'
    )

    await MissionUpdate.createLocationUpdate(mission.id, transporteur.id, 3.8667, 11.5167)
    await MissionUpdate.createLocationUpdate(mission.id, transporteur.id, 3.8668, 11.5168)

    // Filtrer par type STATUS_CHANGE (valeur en base: 'status_change')
    const response = await client
      .get(`/api/affreteur/missions/${mission.id}/history`)
      .bearerToken(affreteurToken)
      .qs({ type: 'status_change' })

    response.assertStatus(200)

    const body = response.body()
    const updates = body.data.updates.data || body.data.updates

    assert.isAtLeast(updates.length, 1)
    updates.forEach((update: any) => {
      assert.equal(update.type, 'status_change')
    })
  })

  test('should not retrieve history for mission not owned', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: otherAffreteur.id,
      title: 'Mission d\'un autre affreteur',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get(`/api/affreteur/missions/${mission.id}/history`)
      .bearerToken(affreteurToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Mission not found or not owned by you',
    })
  })

  test('should preload transporteur information in updates', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission avec transporteur',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    await MissionUpdate.createStatusUpdate(
      mission.id,
      transporteur.id,
      MissionStatus.PUBLISHED,
      MissionStatus.ASSIGNED,
      'Assignation'
    )

    const response = await client
      .get(`/api/affreteur/missions/${mission.id}/history`)
      .bearerToken(affreteurToken)

    response.assertStatus(200)

    const body = response.body()
    const updates = body.data.updates.data || body.data.updates

    assert.isAtLeast(updates.length, 1)
    const firstUpdate = updates[0]
    assert.exists(firstUpdate.transporteur)
    assert.equal(firstUpdate.transporteur.id, transporteur.id)
  })

  test('should return 404 for non-existent mission', async ({ client }) => {
    const response = await client
      .get('/api/affreteur/missions/00000000-0000-0000-0000-000000000000/history')
      .bearerToken(affreteurToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Mission not found or not owned by you',
    })
  })

  test('should require authentication to get history', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission test',
      status: MissionStatus.ASSIGNED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client.get(`/api/affreteur/missions/${mission.id}/history`)

    response.assertStatus(401)
  })

  test('should not allow transporteur to access affreteur history endpoint', async ({
    client,
  }) => {
    const transporteurToken = await transporteur.generateAccessToken('test-token')

    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission test',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get(`/api/affreteur/missions/${mission.id}/history`)
      .bearerToken(transporteurToken)

    response.assertStatus(403)
  })
})
