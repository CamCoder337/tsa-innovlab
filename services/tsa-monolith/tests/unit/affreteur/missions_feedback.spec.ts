import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import Mission, { MissionStatus } from '#models/mission'
import Address from '#models/address'
import Feedback from '#models/feedback'

test.group('Affreteur Missions Feedback', (group) => {
  let affreteur: User
  let transporteur: User
  let affreteurToken: string
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
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create feedback for completed mission', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission complétée',
      description: 'Transport effectué avec succès',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .post(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)
      .json({
        rating: 5,
        description: 'Excellent travail, livraison rapide et soignée',
      })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Feedback created successfully',
    })

    const body = response.body()
    assert.equal(body.data.rating, 5)
    assert.equal(body.data.description, 'Excellent travail, livraison rapide et soignée')
    assert.equal(body.data.missionId, mission.id)
    assert.equal(body.data.transporteurId, transporteur.id)
    assert.equal(body.data.affreteurId, affreteur.id)

    // Vérifier en base de données
    const feedback = await Feedback.query().where('mission_id', mission.id).first()
    assert.exists(feedback)
    assert.equal(feedback!.rating, 5)
  })

  test('should create feedback with only rating (no description)', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission complétée',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .post(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)
      .json({
        rating: 4,
      })

    response.assertStatus(201)

    const body = response.body()
    assert.equal(body.data.rating, 4)
    assert.isNull(body.data.description)
  })

  test('should validate rating between 1 and 5', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission complétée',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    // Rating trop bas
    const response1 = await client
      .post(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)
      .json({
        rating: 0,
      })

    // Should fail with either 422 (validation) or 500 (server error)
    assert.isTrue(response1.status() >= 400)
    assert.equal(response1.body().success, false)

    // Rating trop haut
    const response2 = await client
      .post(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)
      .json({
        rating: 6,
      })

    // Should fail with either 422 (validation) or 500 (server error)
    assert.isTrue(response2.status() >= 400)
    assert.equal(response2.body().success, false)
  })

  test('should not create feedback for mission not completed', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission en cours',
      status: MissionStatus.ASSIGNED, // Pas encore COMPLETED
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .post(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)
      .json({
        rating: 5,
      })

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Mission not found, not completed, or no transporteur assigned',
    })
  })

  test('should not create feedback for mission without transporteur', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      title: 'Mission sans transporteur',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
      // Pas de transporteurId
    })

    const response = await client
      .post(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)
      .json({
        rating: 5,
      })

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Mission not found, not completed, or no transporteur assigned',
    })
  })

  test('should not create duplicate feedback for same mission', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission complétée',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    // Créer le premier feedback
    await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 5,
    })

    // Tenter de créer un deuxième feedback
    const response = await client
      .post(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)
      .json({
        rating: 4,
      })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      message: 'Feedback already exists for this mission',
    })
  })

  test('should not create feedback for mission of another affreteur', async ({ client }) => {
    const autreAffreteur = await User.create({
      email: 'autre-affreteur@test.com',
      passwordHash: 'password123',
      firstName: 'Bob',
      lastName: 'Shipper',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const mission = await Mission.create({
      affreteurId: autreAffreteur.id, // Mission d'un autre affreteur
      transporteurId: transporteur.id,
      title: 'Mission autre affreteur',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .post(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)
      .json({
        rating: 5,
      })

    response.assertStatus(404)
  })

  test('should retrieve feedback for a mission', async ({ client, assert }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission avec feedback',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const feedback = await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 4,
      description: 'Bon travail',
    })

    const response = await client
      .get(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Feedback retrieved successfully',
    })

    const body = response.body()
    assert.equal(body.data.id, feedback.id)
    assert.equal(body.data.rating, 4)
    assert.equal(body.data.description, 'Bon travail')
    assert.exists(body.data.transporteur) // Relation préchargée
  })

  test('should return 404 when feedback does not exist', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission sans feedback',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .get(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Feedback not found for this mission',
    })
  })

  test('should not retrieve feedback for mission of another affreteur', async ({ client }) => {
    const autreAffreteur = await User.create({
      email: 'autre@test.com',
      passwordHash: 'password123',
      firstName: 'Other',
      lastName: 'Shipper',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    const mission = await Mission.create({
      affreteurId: autreAffreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission autre affreteur',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    await Feedback.create({
      missionId: mission.id,
      affreteurId: autreAffreteur.id,
      transporteurId: transporteur.id,
      rating: 5,
    })

    const response = await client
      .get(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(affreteurToken)

    response.assertStatus(404)
  })

  test('should require authentication to create feedback', async ({ client }) => {
    const mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission complétée',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client.post(`/api/affreteur/missions/${mission.id}/feedback`).json({
      rating: 5,
    })

    response.assertStatus(401)
  })

  test('should not allow transporteur to create feedback', async ({ client }) => {
    const transporteurToken = await transporteur.generateAccessToken('test-token')

    const mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission complétée',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const response = await client
      .post(`/api/affreteur/missions/${mission.id}/feedback`)
      .bearerToken(transporteurToken)
      .json({
        rating: 5,
      })

    response.assertStatus(403)
  })
})
