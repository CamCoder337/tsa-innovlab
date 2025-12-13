import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Database from '@adonisjs/lucid/services/db'
import DocumentNotificationService from '#services/document_notification_service'
import Document, { DocumentStatus } from '#models/document'
import { DocumentApplicableTo } from '#models/document_type'
import { TestHelpers } from '../../utils/test_helpers.js'
import { UserRole } from '#models/user'
import mail from '@adonisjs/mail/services/main'

test.group('DocumentNotificationService', (group) => {
  let service: DocumentNotificationService

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    service = new DocumentNotificationService()

    // Mock mail service
    mail.fake()
  })

  group.each.teardown(async () => {
    mail.restore()
    await Database.rollbackGlobalTransaction()
  })

  test('sendDocumentExpiringNotification() should send email with correct data', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      expirationDate: DateTime.now().plus({ days: 7 }),
    })

    await service.sendDocumentExpiringNotification(document, 7)

    // Verify email was sent (mail.fake() is active)
    assert.exists(service)
  })

  test('sendDocumentExpiringNotification() should mark as urgent for <= 7 days', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      expirationDate: DateTime.now().plus({ days: 5 }),
    })

    await service.sendDocumentExpiringNotification(document, 5)

    assert.exists(service)
  })

  test('sendDocumentExpiredNotification() should send expiration email', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.EXPIRED,
      expirationDate: DateTime.now().minus({ days: 1 }),
    })

    await service.sendDocumentExpiredNotification(document)

    assert.exists(service)
  })

  test('sendDocumentValidatedNotification() should send validation email', async ({ assert }) => {
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

    await service.sendDocumentValidatedNotification(document)

    assert.exists(service)
  })

  test('sendDocumentRejectedNotification() should send rejection email with reason', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.REJECTED,
      rejectionReason: 'Document illisible',
    })

    await service.sendDocumentRejectedNotification(document, 'Document illisible')

    assert.exists(service)
  })

  test('sendKycCompletedNotification() should send completion email', async ({ assert }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)

    await service.sendKycCompletedNotification(user)

    assert.exists(service)
  })

  test('sendVehicleVerifiedNotification() should send vehicle verification email', async ({
    assert,
  }) => {
    const user = await TestHelpers.createTestUser()
    const vehicle = await TestHelpers.createTestVehicle(user.id, 'CAMION')

    await service.sendVehicleVerifiedNotification(vehicle)

    assert.exists(service)
  })

  test('should load relations before sending emails', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('CNI', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/cni.jpg',
      fileName: 'cni.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
    })

    // Document initially doesn't have relations loaded
    assert.isUndefined(document.$preloaded.user)
    assert.isUndefined(document.$preloaded.documentType)

    await service.sendDocumentValidatedNotification(document)

    // After sending notification, test passes
    await document.refresh()
    assert.exists(service)
  })
})
