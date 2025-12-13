import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Database from '@adonisjs/lucid/services/db'
import VehicleVerificationStatus from '#models/vehicle_verification_status'
import { KycStatus } from '#models/user_verification_status'
import { TestHelpers } from '../../utils/test_helpers.js'
import { UserRole } from '#models/user'

test.group('VehicleVerificationStatus Model', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create a vehicle verification status', async ({ assert }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)
    const vehicle = await TestHelpers.createTestVehicle(user.id, 'CAMION')

    const status = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.INCOMPLETE,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 0,
      documentsValidatedCount: 0,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.exists(status.id)
    assert.equal(status.vehicleId, vehicle.id)
    assert.equal(status.verificationStatus, KycStatus.INCOMPLETE)
    assert.equal(status.documentsRequiredCount, 10)
  })

  test('isComplete() should return true only for validated status', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const validatedStatus = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 10,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    const pendingStatus = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.PENDING,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 5,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.isTrue(validatedStatus.isComplete())
    assert.isFalse(pendingStatus.isComplete())
  })

  test('hasPendingDocuments() should detect pending documents', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const withPending = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.PENDING,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 7,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    const withoutPending = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 10,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.isTrue(withPending.hasPendingDocuments())
    assert.isFalse(withoutPending.hasPendingDocuments())
  })

  test('getCompletionPercentage() should calculate correctly', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const testCases = [
      { required: 10, validated: 0, expected: 0 },
      { required: 10, validated: 5, expected: 50 },
      { required: 10, validated: 7, expected: 70 },
      { required: 10, validated: 10, expected: 100 },
    ]

    for (const { required, validated, expected } of testCases) {
      const status = await VehicleVerificationStatus.create({
        vehicleId: vehicle.id,
        verificationStatus: KycStatus.PENDING,
        documentsRequiredCount: required,
        documentsSubmittedCount: validated,
        documentsValidatedCount: validated,
        documentsRejectedCount: 0,
        documentsExpiredCount: 0,
      })

      assert.equal(status.getCompletionPercentage(), expected)
    }
  })

  test('needsAction() should detect statuses requiring action', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const actionRequired = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.ACTION_REQUIRED,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 8,
      documentsRejectedCount: 1,
      documentsExpiredCount: 0,
    })

    const validated = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 10,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.isTrue(actionRequired.needsAction())
    assert.isFalse(validated.needsAction())
  })

  test('daysUntilNextExpiration() should calculate days correctly', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const status = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 10,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
      nextExpirationDate: DateTime.now().plus({ days: 30 }),
    })

    const daysLeft = status.daysUntilNextExpiration()
    assert.isNotNull(daysLeft)
    assert.isTrue(daysLeft! >= 29 && daysLeft! <= 31)
  })

  test('daysUntilNextExpiration() should return null when no expiration date', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const status = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.INCOMPLETE,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 0,
      documentsValidatedCount: 0,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
      nextExpirationDate: null,
    })

    assert.isNull(status.daysUntilNextExpiration())
  })

  test('hasExpiringDocuments() should detect documents expiring soon', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const expiringSoon = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 10,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
      nextExpirationDate: DateTime.now().plus({ days: 15 }),
    })

    const notExpiring = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 10,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
      nextExpirationDate: DateTime.now().plus({ days: 60 }),
    })

    assert.isTrue(expiringSoon.hasExpiringDocuments(30))
    assert.isFalse(expiringSoon.hasExpiringDocuments(10))
    assert.isFalse(notExpiring.hasExpiringDocuments(30))
  })

  test('hasExpiringDocuments() should use default 30 days threshold', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const status = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 10,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
      nextExpirationDate: DateTime.now().plus({ days: 20 }),
    })

    assert.isTrue(status.hasExpiringDocuments()) // Default is 30 days
  })

  test('hasExpiringDocuments() should return false when no expiration date', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const status = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.INCOMPLETE,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 0,
      documentsValidatedCount: 0,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
      nextExpirationDate: null,
    })

    assert.isFalse(status.hasExpiringDocuments(30))
  })

  test('statusLabel getter should return correct French labels', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const statuses = [
      { status: KycStatus.INCOMPLETE, label: 'Incomplet' },
      { status: KycStatus.PENDING, label: 'En attente' },
      { status: KycStatus.VALIDATED, label: 'Validé' },
      { status: KycStatus.REJECTED, label: 'Rejeté' },
      { status: KycStatus.EXPIRED, label: 'Expiré' },
      { status: KycStatus.ACTION_REQUIRED, label: 'Action requise' },
    ]

    for (const { status, label } of statuses) {
      const verificationStatus = await VehicleVerificationStatus.create({
        vehicleId: vehicle.id,
        verificationStatus: status,
        documentsRequiredCount: 10,
        documentsSubmittedCount: 0,
        documentsValidatedCount: 0,
        documentsRejectedCount: 0,
        documentsExpiredCount: 0,
      })

      assert.equal(verificationStatus.statusLabel, label)
    }
  })

  test('allDocumentsSubmitted() should check submission status', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const allSubmitted = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.PENDING,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 5,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    const partialSubmitted = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.INCOMPLETE,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 7,
      documentsValidatedCount: 0,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.isTrue(allSubmitted.allDocumentsSubmitted())
    assert.isFalse(partialSubmitted.allDocumentsSubmitted())
  })

  test('getMissingDocumentsCount() should calculate missing documents', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)

    const testCases = [
      { required: 10, submitted: 0, missing: 10 },
      { required: 10, submitted: 5, missing: 5 },
      { required: 10, submitted: 10, missing: 0 },
    ]

    for (const { required, submitted, missing } of testCases) {
      const status = await VehicleVerificationStatus.create({
        vehicleId: vehicle.id,
        verificationStatus: KycStatus.INCOMPLETE,
        documentsRequiredCount: required,
        documentsSubmittedCount: submitted,
        documentsValidatedCount: 0,
        documentsRejectedCount: 0,
        documentsExpiredCount: 0,
      })

      assert.equal(status.getMissingDocumentsCount(), missing)
    }
  })

  test('should track verified date when status is validated', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id)
    const now = DateTime.now()

    const status = await VehicleVerificationStatus.create({
      vehicleId: vehicle.id,
      verificationStatus: KycStatus.VALIDATED,
      verifiedAt: now,
      documentsRequiredCount: 10,
      documentsSubmittedCount: 10,
      documentsValidatedCount: 10,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.exists(status.verifiedAt)
    assert.isTrue(status.verifiedAt!.equals(now))
  })
})
