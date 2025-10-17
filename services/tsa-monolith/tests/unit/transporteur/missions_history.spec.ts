import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import Mission, { MissionStatus } from '#models/mission'
import Address from '#models/address'
import MissionUpdate from '#models/mission_update'

test.group('Transporteur Missions History', (group) => {
  let transporteur: User
  let otherTransporteur: User
  let affreteur: User
  let transporteurToken: string
  let adresseDepart: Address
  let adresseArrivee: Address

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

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

    // Créer un autre transporteur
    otherTransporteur = await User.create({
      email: 'other-transporteur@test.com',
      passwordHash: 'password123',
      firstName: 'Other',
      lastName: 'Driver',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

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

    transporteurToken = await transporteur.generateAccessToken('test-token')
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should retrieve mission history for assigned mission', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission assignée',
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
      'Mission réclamée'
    )

    await MissionUpdate.createLocationUpdate(
      mission.id,
      transporteur.id,
      3.8667,
      11.5167,
      'Yaoundé'
    )

    const response = await client
      .get(`/api/transporteur/missions/${mission.id}/history`)
      .bearerToken(transporteurToken)

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
      title: "Mission avec beaucoup d'historique",
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    // Créer 10 mises à jour de localisation
    for (let i = 0; i < 10; i++) {
      await MissionUpdate.createLocationUpdate(
        mission.id,
        transporteur.id,
        3.8667 + i * 0.01,
        11.5167 + i * 0.01
      )
    }

    const response = await client
      .get(`/api/transporteur/missions/${mission.id}/history`)
      .bearerToken(transporteurToken)
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
    await MissionUpdate.createLocationUpdate(mission.id, transporteur.id, 3.8669, 11.5169)

    // Filtrer par type LOCATION_UPDATE (valeur en base: 'location_update')
    const response = await client
      .get(`/api/transporteur/missions/${mission.id}/history`)
      .bearerToken(transporteurToken)
      .qs({ type: 'location_update' })

    response.assertStatus(200)

    const body = response.body()
    const updates = body.data.updates.data || body.data.updates

    assert.isAtLeast(updates.length, 3)
    updates.forEach((update: any) => {
      assert.equal(update.type, 'location_update')
    })
  })

  test('should not retrieve history for mission not assigned to transporteur', async ({
    client,
  }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: "Mission d'un autre transporteur",
      status: MissionStatus.ASSIGNED,
      transporteurId: otherTransporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get(`/api/transporteur/missions/${mission.id}/history`)
      .bearerToken(transporteurToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Mission not found or not assigned to you',
    })
  })

  test('should not retrieve history for unassigned mission', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission non assignée',
      status: MissionStatus.PUBLISHED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get(`/api/transporteur/missions/${mission.id}/history`)
      .bearerToken(transporteurToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Mission not found or not assigned to you',
    })
  })

  test('should preload transporteur information in updates', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission avec historique',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    await MissionUpdate.createLocationUpdate(mission.id, transporteur.id, 3.8667, 11.5167)

    const response = await client
      .get(`/api/transporteur/missions/${mission.id}/history`)
      .bearerToken(transporteurToken)

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
      .get('/api/transporteur/missions/00000000-0000-0000-0000-000000000000/history')
      .bearerToken(transporteurToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Mission not found or not assigned to you',
    })
  })

  test('should require authentication to get history', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission test',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client.get(`/api/transporteur/missions/${mission.id}/history`)

    response.assertStatus(401)
  })

  test('should not allow affreteur to access transporteur history endpoint', async ({ client }) => {
    const affreteurToken = await affreteur.generateAccessToken('test-token')

    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission test',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get(`/api/transporteur/missions/${mission.id}/history`)
      .bearerToken(affreteurToken)

    response.assertStatus(403)
  })

  test('should retrieve empty history for mission with no updates', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission sans historique',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get(`/api/transporteur/missions/${mission.id}/history`)
      .bearerToken(transporteurToken)

    response.assertStatus(200)

    const body = response.body()
    const updates = body.data.updates.data || body.data.updates

    assert.equal(updates.length, 0)
  })
})
