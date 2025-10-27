import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import Mission, { MissionStatus } from '#models/mission'
import Address from '#models/address'
import Feedback from '#models/feedback'

test.group('Feedback Model', (group) => {
  let affreteur: User
  let transporteur: User
  let mission: Mission
  let adresseDepart: Address
  let adresseArrivee: Address

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Créer les utilisateurs
    affreteur = await User.create({
      email: 'affreteur@test.com',
      passwordHash: 'password123',
      firstName: 'Jane',
      lastName: 'Shipper',
      role: UserRole.AFFRETEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    transporteur = await User.create({
      email: 'transporteur@test.com',
      passwordHash: 'password123',
      firstName: 'John',
      lastName: 'Driver',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    // Créer les adresses
    adresseDepart = await Address.create({
      street: '123 Rue Test',
      city: 'Douala',
      region: 'Littoral',
      country: 'Cameroun',
      postalCode: '1234',
    })

    adresseArrivee = await Address.create({
      street: '456 Avenue Test',
      city: 'Yaoundé',
      region: 'Centre',
      country: 'Cameroun',
      postalCode: '5678',
    })

    // Créer une mission
    mission = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission test',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create a feedback with all fields', async ({ assert }) => {
    const feedback = await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 5,
      description: 'Excellent service',
    })

    assert.exists(feedback.id)
    assert.equal(feedback.missionId, mission.id)
    assert.equal(feedback.affreteurId, affreteur.id)
    assert.equal(feedback.transporteurId, transporteur.id)
    assert.equal(feedback.rating, 5)
    assert.equal(feedback.description, 'Excellent service')
    assert.exists(feedback.createdAt)
    assert.exists(feedback.updatedAt)
  })

  test('should create a feedback without description', async ({ assert }) => {
    const feedback = await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 3,
    })

    assert.exists(feedback.id)
    assert.equal(feedback.rating, 3)
    assert.isUndefined(feedback.description)
  })

  test('should load mission relation', async ({ assert }) => {
    const feedback = await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 4,
    })

    await feedback.load('mission')

    assert.exists(feedback.mission)
    assert.equal(feedback.mission.id, mission.id)
    assert.equal(feedback.mission.title, 'Mission test')
  })

  test('should load transporteur relation', async ({ assert }) => {
    const feedback = await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 4,
    })

    await feedback.load('transporteur')

    assert.exists(feedback.transporteur)
    assert.equal(feedback.transporteur.id, transporteur.id)
    assert.equal(feedback.transporteur.email, 'transporteur@test.com')
  })

  test('should load affreteur relation', async ({ assert }) => {
    const feedback = await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 4,
    })

    await feedback.load('affreteur')

    assert.exists(feedback.affreteur)
    assert.equal(feedback.affreteur.id, affreteur.id)
    assert.equal(feedback.affreteur.email, 'affreteur@test.com')
  })

  test('getStars() should return correct number of stars', async ({ assert }) => {
    const feedback1 = await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 1,
    })

    // Créer une autre mission pour le feedback 3 étoiles
    const mission2 = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission 2',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const feedback3 = await Feedback.create({
      missionId: mission2.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 3,
    })

    // Créer une autre mission pour le feedback 5 étoiles
    const mission3 = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission 3',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const feedback5 = await Feedback.create({
      missionId: mission3.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 5,
    })

    assert.equal(feedback1.getStars(), '⭐')
    assert.equal(feedback3.getStars(), '⭐⭐⭐')
    assert.equal(feedback5.getStars(), '⭐⭐⭐⭐⭐')
  })

  test('isPositive() should return true for ratings >= 4', async ({ assert }) => {
    const feedback4 = await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 4,
    })

    // Créer une autre mission pour le feedback 5 étoiles
    const mission2 = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission 2',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const feedback5 = await Feedback.create({
      missionId: mission2.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 5,
    })

    assert.isTrue(feedback4.isPositive())
    assert.isTrue(feedback5.isPositive())
  })

  test('isPositive() should return false for ratings < 4', async ({ assert }) => {
    const feedback1 = await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 1,
    })

    // Créer une autre mission pour le feedback 3 étoiles
    const mission2 = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission 2',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const feedback3 = await Feedback.create({
      missionId: mission2.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 3,
    })

    assert.isFalse(feedback1.isPositive())
    assert.isFalse(feedback3.isPositive())
  })

  test('should enforce unique constraint on mission_id', async ({ assert }) => {
    await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 5,
    })

    // Tenter de créer un deuxième feedback pour la même mission
    try {
      await Feedback.create({
        missionId: mission.id,
        affreteurId: affreteur.id,
        transporteurId: transporteur.id,
        rating: 4,
      })
      assert.fail('Should have thrown unique constraint error')
    } catch (error: any) {
      // L'erreur devrait être une violation de contrainte unique
      assert.include(error.message.toLowerCase(), 'unique')
    }
  })

  test('should query feedbacks by transporteur', async ({ assert }) => {
    const autreTransporteur = await User.create({
      email: 'autre-transporteur@test.com',
      passwordHash: 'password123',
      firstName: 'Bob',
      lastName: 'Driver',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.ACTIVE,
      mfaEnabled: false,
    })

    await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 5,
    })

    const mission2 = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: autreTransporteur.id,
      title: 'Mission 2',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    await Feedback.create({
      missionId: mission2.id,
      affreteurId: affreteur.id,
      transporteurId: autreTransporteur.id,
      rating: 3,
    })

    const feedbacks = await Feedback.query().where('transporteur_id', transporteur.id)

    assert.equal(feedbacks.length, 1)
    assert.equal(feedbacks[0].transporteurId, transporteur.id)
    assert.equal(feedbacks[0].rating, 5)
  })

  test('should calculate average rating for a transporteur', async ({ assert }) => {
    const mission2 = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission 2',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    const mission3 = await Mission.create({
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      title: 'Mission 3',
      status: MissionStatus.COMPLETED,
      adresseDepartId: adresseDepart.id,
      adresseArriveeId: adresseArrivee.id,
    })

    await Feedback.create({
      missionId: mission.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 5,
    })

    await Feedback.create({
      missionId: mission2.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 4,
    })

    await Feedback.create({
      missionId: mission3.id,
      affreteurId: affreteur.id,
      transporteurId: transporteur.id,
      rating: 3,
    })

    const result = await Database.from('feedbacks')
      .where('transporteur_id', transporteur.id)
      .avg('rating as average')
      .first()

    const average = Number(result?.average)
    assert.equal(average, 4) // (5 + 4 + 3) / 3 = 4
  })
})
