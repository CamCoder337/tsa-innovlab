import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import Mission, { MissionStatus } from '#models/mission'
import Address from '#models/address'

test.group('Transporteur Missions Controller', (group) => {
  let transporteur: User
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

  test('should list available missions (published and unclaimed)', async ({ client, assert }) => {
    // Créer des missions de différents statuts
    await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission DRAFT',
      status: MissionStatus.DRAFT,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const publishedMission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission PUBLISHED',
      status: MissionStatus.PUBLISHED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
      budgetMin: 10000,
      budgetMax: 20000,
    })

    await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission ASSIGNED',
      status: MissionStatus.PUBLISHED,
      transporteurId: transporteur.id, // Déjà réclamée
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get('/api/transporteur/missions/available')
      .bearerToken(transporteurToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Available missions retrieved successfully',
    })

    const body = response.body()
    assert.exists(body.data.missions)
    // Vérifier que les missions PUBLISHED sans transporteur sont présentes
    const missions = body.data.missions.data || body.data.missions
    assert.isAtLeast(missions.length, 1)

    // Vérifier que notre mission publiée est dans les résultats
    const ourMission = missions.find((m: any) => m.id === publishedMission.id)
    assert.exists(ourMission)
    assert.equal(ourMission.status, MissionStatus.PUBLISHED)
    assert.isNull(ourMission.transporteurId)

    // Vérifier qu'aucune mission DRAFT ou avec transporteur n'est présente
    const allPublished = missions.every((m: any) => m.status === MissionStatus.PUBLISHED)
    const allUnassigned = missions.every((m: any) => m.transporteurId === null)
    assert.isTrue(allPublished)
    assert.isTrue(allUnassigned)
  })

  test('should claim a published mission successfully', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission à réclamer',
      description: 'Transport de marchandises',
      status: MissionStatus.PUBLISHED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
      budgetMin: 15000,
      budgetMax: 25000,
    })

    const response = await client
      .post(`/api/transporteur/missions/${mission.id}/claim`)
      .bearerToken(transporteurToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Mission claimed successfully',
    })

    const body = response.body()
    assert.equal(body.data.transporteurId, transporteur.id)
    assert.equal(body.data.status, MissionStatus.ASSIGNED)

    // Vérifier en base de données
    await mission.refresh()
    assert.equal(mission.transporteurId, transporteur.id)
    assert.equal(mission.status, MissionStatus.ASSIGNED)
  })

  test('should not claim a mission that is not published', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission DRAFT',
      status: MissionStatus.DRAFT,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .post(`/api/transporteur/missions/${mission.id}/claim`)
      .bearerToken(transporteurToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Mission not found, not available, or already claimed',
    })
  })

  test('should not claim a mission already claimed by another transporteur', async ({ client }) => {
    const autreTransporteur = await User.create({
      email: 'autre-transporteur@test.com',
      passwordHash: 'password123',
      firstName: 'Bob',
      lastName: 'Transporter',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission déjà réclamée',
      status: MissionStatus.PUBLISHED,
      transporteurId: autreTransporteur.id, // Déjà réclamée
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .post(`/api/transporteur/missions/${mission.id}/claim`)
      .bearerToken(transporteurToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Mission not found, not available, or already claimed',
    })
  })

  test('should list my assigned missions', async ({ client, assert }) => {
    // Créer des missions assignées à ce transporteur
    const myMission1 = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Ma mission 1',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const myMission2 = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Ma mission 2',
      status: MissionStatus.COMPLETED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    // Mission assignée à un autre transporteur
    const autreTransporteur = await User.create({
      email: 'autre@test.com',
      passwordHash: 'password123',
      firstName: 'Other',
      lastName: 'Driver',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission autre transporteur',
      status: MissionStatus.ASSIGNED,
      transporteurId: autreTransporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get('/api/transporteur/my-missions')
      .bearerToken(transporteurToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'My missions retrieved successfully',
    })

    const body = response.body()
    const missions = body.data.missions.data || body.data.missions
    assert.equal(missions.length, 2)

    const missionIds = missions.map((m: any) => m.id)
    assert.include(missionIds, myMission1.id)
    assert.include(missionIds, myMission2.id)
  })

  test('should filter my missions by status', async ({ client, assert }) => {
    await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission ASSIGNED',
      status: MissionStatus.ASSIGNED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission COMPLETED',
      status: MissionStatus.COMPLETED,
      transporteurId: transporteur.id,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get('/api/transporteur/my-missions')
      .bearerToken(transporteurToken)
      .qs({ status: MissionStatus.ASSIGNED })

    response.assertStatus(200)

    const body = response.body()
    const missions = body.data.missions.data || body.data.missions
    assert.equal(missions.length, 1)
    assert.equal(missions[0].status, MissionStatus.ASSIGNED)
  })

  test('should require authentication to claim mission', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission publique',
      status: MissionStatus.PUBLISHED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client.post(`/api/transporteur/missions/${mission.id}/claim`)

    response.assertStatus(401)
  })

  test('should not allow affreteur to claim mission', async ({ client }) => {
    const affreteurToken = await affreteur.generateAccessToken('test-token')

    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission publique',
      status: MissionStatus.PUBLISHED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .post(`/api/transporteur/missions/${mission.id}/claim`)
      .bearerToken(affreteurToken)

    response.assertStatus(403)
  })
})
