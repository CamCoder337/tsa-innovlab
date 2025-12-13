import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import UserVerificationStatus, { KycStatus } from '#models/user_verification_status'
import { TestHelpers } from '../../utils/test_helpers.js'
import { UserRole } from '#models/user'

test.group('UserVerificationStatus Model', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create a user verification status', async ({ assert }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)

    const status = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.INCOMPLETE,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 0,
      documentsValidatedCount: 0,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.exists(status.id)
    assert.equal(status.userId, user.id)
    assert.equal(status.kycStatus, KycStatus.INCOMPLETE)
    assert.equal(status.documentsRequiredCount, 5)
  })

  test('isComplete() should return true only for validated status', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()

    const validatedStatus = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 3,
      documentsSubmittedCount: 3,
      documentsValidatedCount: 3,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    const pendingStatus = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.PENDING,
      documentsRequiredCount: 3,
      documentsSubmittedCount: 3,
      documentsValidatedCount: 0,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.isTrue(validatedStatus.isComplete())
    assert.isFalse(pendingStatus.isComplete())
  })

  test('hasPendingDocuments() should detect pending documents', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()

    const withPending = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.PENDING,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 5,
      documentsValidatedCount: 3,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    const withoutPending = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 5,
      documentsValidatedCount: 5,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.isTrue(withPending.hasPendingDocuments())
    assert.isFalse(withoutPending.hasPendingDocuments())
  })

  test('getCompletionPercentage() should calculate correctly', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()

    const testCases = [
      { required: 5, validated: 0, expected: 0 },
      { required: 5, validated: 1, expected: 20 },
      { required: 5, validated: 3, expected: 60 },
      { required: 5, validated: 5, expected: 100 },
      { required: 3, validated: 2, expected: 67 },
    ]

    for (const { required, validated, expected } of testCases) {
      const status = await UserVerificationStatus.create({
        userId: user.id,
        kycStatus: KycStatus.PENDING,
        documentsRequiredCount: required,
        documentsSubmittedCount: validated,
        documentsValidatedCount: validated,
        documentsRejectedCount: 0,
        documentsExpiredCount: 0,
      })

      assert.equal(status.getCompletionPercentage(), expected)
    }
  })

  test('getCompletionPercentage() should return 0 when no documents required', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()

    const status = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.INCOMPLETE,
      documentsRequiredCount: 0,
      documentsSubmittedCount: 0,
      documentsValidatedCount: 0,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.equal(status.getCompletionPercentage(), 0)
  })

  test('needsAction() should detect statuses requiring user action', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()

    const actionRequiredStatus = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.ACTION_REQUIRED,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 5,
      documentsValidatedCount: 3,
      documentsRejectedCount: 1,
      documentsExpiredCount: 0,
    })

    const rejectedStatus = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.REJECTED,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 5,
      documentsValidatedCount: 0,
      documentsRejectedCount: 5,
      documentsExpiredCount: 0,
    })

    const expiredStatus = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.EXPIRED,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 5,
      documentsValidatedCount: 4,
      documentsRejectedCount: 0,
      documentsExpiredCount: 1,
    })

    const validStatus = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.VALIDATED,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 5,
      documentsValidatedCount: 5,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.isTrue(actionRequiredStatus.needsAction())
    assert.isTrue(rejectedStatus.needsAction())
    assert.isTrue(expiredStatus.needsAction())
    assert.isFalse(validStatus.needsAction())
  })

  test('allDocumentsSubmitted() should check if all required docs are submitted', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()

    const allSubmitted = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.PENDING,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 5,
      documentsValidatedCount: 0,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    const partialSubmitted = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.INCOMPLETE,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 3,
      documentsValidatedCount: 0,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
    })

    assert.isTrue(allSubmitted.allDocumentsSubmitted())
    assert.isFalse(partialSubmitted.allDocumentsSubmitted())
  })

  test('getMissingDocumentsCount() should calculate missing documents', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()

    const testCases = [
      { required: 5, submitted: 0, missing: 5 },
      { required: 5, submitted: 2, missing: 3 },
      { required: 5, submitted: 5, missing: 0 },
      { required: 3, submitted: 5, missing: 0 }, // Cannot be negative
    ]

    for (const { required, submitted, missing } of testCases) {
      const status = await UserVerificationStatus.create({
        userId: user.id,
        kycStatus: KycStatus.INCOMPLETE,
        documentsRequiredCount: required,
        documentsSubmittedCount: submitted,
        documentsValidatedCount: 0,
        documentsRejectedCount: 0,
        documentsExpiredCount: 0,
      })

      assert.equal(status.getMissingDocumentsCount(), missing)
    }
  })

  test('statusLabel getter should return correct French labels', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()

    const statuses = [
      { status: KycStatus.INCOMPLETE, label: 'Incomplet' },
      { status: KycStatus.PENDING, label: 'En attente' },
      { status: KycStatus.VALIDATED, label: 'Validé' },
      { status: KycStatus.REJECTED, label: 'Rejeté' },
      { status: KycStatus.EXPIRED, label: 'Expiré' },
      { status: KycStatus.ACTION_REQUIRED, label: 'Action requise' },
    ]

    for (const { status, label } of statuses) {
      const verificationStatus = await UserVerificationStatus.create({
        userId: user.id,
        kycStatus: status,
        documentsRequiredCount: 5,
        documentsSubmittedCount: 0,
        documentsValidatedCount: 0,
        documentsRejectedCount: 0,
        documentsExpiredCount: 0,
      })

      assert.equal(verificationStatus.statusLabel, label)
    }
  })

  test('should track last document submission and validation dates', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const { DateTime } = await import('luxon')
    const now = DateTime.now()

    const status = await UserVerificationStatus.create({
      userId: user.id,
      kycStatus: KycStatus.PENDING,
      documentsRequiredCount: 5,
      documentsSubmittedCount: 3,
      documentsValidatedCount: 1,
      documentsRejectedCount: 0,
      documentsExpiredCount: 0,
      lastDocumentSubmittedAt: now,
      lastDocumentValidatedAt: now.minus({ hours: 1 }),
    })

    assert.exists(status.lastDocumentSubmittedAt)
    assert.exists(status.lastDocumentValidatedAt)
    assert.isTrue(status.lastDocumentSubmittedAt! > status.lastDocumentValidatedAt!)
  })
})
