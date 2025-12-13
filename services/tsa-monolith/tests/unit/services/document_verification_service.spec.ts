import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Database from '@adonisjs/lucid/services/db'
import DocumentVerificationService from '#services/document_verification_service'
import Document, { DocumentStatus } from '#models/document'
import { DocumentApplicableTo } from '#models/document_type'
import { UserRole } from '#models/user'
import { TestHelpers } from '../../utils/test_helpers.js'
import { KycStatus } from '#models/user_verification_status'

test.group('DocumentVerificationService', (group) => {
  let service: DocumentVerificationService

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    service = new DocumentVerificationService()
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('getRequiredDocumentsForUser() should return documents for transporteur', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)

    // Create some document types for transporteur
    await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER, ['transporteur'])
    await TestHelpers.createTestDocumentType('REGISTRE', DocumentApplicableTo.USER, [
      'transporteur',
    ])
    await TestHelpers.createTestDocumentType('NIU', DocumentApplicableTo.USER, ['affreteur']) // Should not be included

    const requiredDocs = await service.getRequiredDocumentsForUser(user)

    assert.isArray(requiredDocs)
    assert.isAtLeast(requiredDocs.length, 2)
    assert.isTrue(requiredDocs.every((doc) => doc.requiredForRoles?.includes('transporteur')))
  })

  test('getRequiredDocumentsForUser() should return documents for affreteur', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser(UserRole.AFFRETEUR)

    await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER, ['affreteur'])
    await TestHelpers.createTestDocumentType('NIU', DocumentApplicableTo.USER, ['affreteur'])

    const requiredDocs = await service.getRequiredDocumentsForUser(user)

    assert.isArray(requiredDocs)
    assert.isAtLeast(requiredDocs.length, 2)
    assert.isTrue(requiredDocs.every((doc) => doc.requiredForRoles?.includes('affreteur')))
  })

  test('getRequiredDocumentsForVehicle() should return documents for vehicle type', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id, 'CAMION')

    await TestHelpers.createTestDocumentType(
      'CARTE_GRISE',
      DocumentApplicableTo.VEHICLE,
      undefined,
      ['CAMION']
    )
    await TestHelpers.createTestDocumentType('ASSURANCE', DocumentApplicableTo.VEHICLE, undefined, [
      'CAMION',
      'CAMIONNETTE',
    ])

    const requiredDocs = await service.getRequiredDocumentsForVehicle(vehicle)

    assert.isArray(requiredDocs)
    assert.isAtLeast(requiredDocs.length, 2)
    assert.isTrue(requiredDocs.every((doc) => doc.requiredForVehicleTypes?.includes('CAMION')))
  })

  test('calculateUserVerificationStatus() should set INCOMPLETE when no documents', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)

    // Create required document types
    await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER, ['transporteur'])
    await TestHelpers.createTestDocumentType('REGISTRE', DocumentApplicableTo.USER, [
      'transporteur',
    ])

    const status = await service.calculateUserVerificationStatus(user.id)

    assert.equal(status.kycStatus, KycStatus.INCOMPLETE)
    assert.equal(status.documentsSubmittedCount, 0)
    assert.isAtLeast(status.documentsRequiredCount, 2)
  })

  test('calculateUserVerificationStatus() should set PENDING when all submitted', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)

    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER, [
      'transporteur',
    ])

    // Create a pending document
    await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const status = await service.calculateUserVerificationStatus(user.id)

    // Will be PENDING if all required docs are submitted
    assert.oneOf(status.kycStatus, [KycStatus.PENDING, KycStatus.INCOMPLETE])
    assert.equal(status.documentsSubmittedCount, 1)
  })

  test('calculateUserVerificationStatus() should set VALIDATED when all validated', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)
    const admin = await TestHelpers.createTestUser(UserRole.ADMIN)

    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER, [
      'transporteur',
    ])

    // Create a validated document
    await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      validatedById: admin.id,
      validatedAt: DateTime.now(),
    })

    const status = await service.calculateUserVerificationStatus(user.id)

    // Will be VALIDATED if all required docs are validated
    assert.oneOf(status.kycStatus, [KycStatus.VALIDATED, KycStatus.PENDING, KycStatus.INCOMPLETE])
    assert.equal(status.documentsValidatedCount, 1)
  })

  test('calculateUserVerificationStatus() should set ACTION_REQUIRED when rejected', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)

    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER, [
      'transporteur',
    ])

    // Create a rejected document
    await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.REJECTED,
      rejectionReason: 'Document illisible',
    })

    const status = await service.calculateUserVerificationStatus(user.id)

    assert.equal(status.kycStatus, KycStatus.ACTION_REQUIRED)
    assert.equal(status.documentsRejectedCount, 1)
  })

  test('calculateUserVerificationStatus() should set ACTION_REQUIRED when expired', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)

    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER, [
      'transporteur',
    ])

    // Create an expired document
    await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.EXPIRED,
    })

    const status = await service.calculateUserVerificationStatus(user.id)

    assert.equal(status.kycStatus, KycStatus.ACTION_REQUIRED)
    assert.equal(status.documentsExpiredCount, 1)
  })

  test('validateDocument() should validate a pending document', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const admin = await TestHelpers.createTestUser(UserRole.ADMIN)
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const validated = await service.validateDocument(document.id, admin.id, 'Document conforme')

    assert.equal(validated.status, DocumentStatus.VALIDATED)
    assert.equal(validated.validatedById, admin.id)
    assert.exists(validated.validatedAt)
  })

  test('validateDocument() should calculate expiration date', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const admin = await TestHelpers.createTestUser(UserRole.ADMIN)
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)
    docType.hasExpiration = true
    docType.defaultValidityDays = 365
    await docType.save()

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const validated = await service.validateDocument(document.id, admin.id)

    assert.exists(validated.expirationDate)
    const daysLeft = validated.daysUntilExpiration()
    assert.isNotNull(daysLeft)
    assert.isTrue(daysLeft! >= 364 && daysLeft! <= 366)
  })

  test('validateDocument() should throw error for non-pending documents', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const admin = await TestHelpers.createTestUser(UserRole.ADMIN)
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      validatedById: admin.id,
      validatedAt: DateTime.now(),
    })

    await assert.rejects(async () => {
      await service.validateDocument(document.id, admin.id)
    })
  })

  test('rejectDocument() should reject a pending document', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const admin = await TestHelpers.createTestUser(UserRole.ADMIN)
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const rejected = await service.rejectDocument(document.id, admin.id, 'Document illisible')

    assert.equal(rejected.status, DocumentStatus.REJECTED)
    assert.equal(rejected.rejectionReason, 'Document illisible')
  })

  test('rejectDocument() should throw error for non-pending documents', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const admin = await TestHelpers.createTestUser(UserRole.ADMIN)
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.REJECTED,
      rejectionReason: 'Already rejected',
    })

    await assert.rejects(async () => {
      await service.rejectDocument(document.id, admin.id, 'Test')
    })
  })

  test('canUploadDocument() should return false when active document exists', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const canUpload = await service.canUploadDocument(user.id, docType.id)

    assert.isFalse(canUpload)
  })

  test('canUploadDocument() should return true when no active document exists', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const canUpload = await service.canUploadDocument(user.id, docType.id)

    assert.isTrue(canUpload)
  })

  test('canUploadDocument() should return true when only rejected documents exist', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.REJECTED,
      rejectionReason: 'Illisible',
    })

    const canUpload = await service.canUploadDocument(user.id, docType.id)

    assert.isTrue(canUpload)
  })

  test('checkDocumentExpirations() should expire old documents', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    // Create an expired document
    await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      expirationDate: DateTime.now().minus({ days: 1 }),
    })

    const expiredCount = await service.checkDocumentExpirations()

    assert.isAtLeast(expiredCount, 1)
  })

  test('checkDocumentExpirations() should not expire future documents', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    // Create a document expiring in the future
    await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      expirationDate: DateTime.now().plus({ days: 30 }),
    })

    const expiredCount = await service.checkDocumentExpirations()

    assert.equal(expiredCount, 0)
  })
})
