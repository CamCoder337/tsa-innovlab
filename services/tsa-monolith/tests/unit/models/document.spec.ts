import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Database from '@adonisjs/lucid/services/db'
import Document, { DocumentStatus } from '#models/document'
import DocumentType, { DocumentApplicableTo } from '#models/document_type'
import User, { UserRole } from '#models/user'
import { TestHelpers } from '../../utils/test_helpers.js'

test.group('Document Model', (group) => {
  let testUser: User
  let testDocumentType: DocumentType
  let adminUser: User

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Créer utilisateurs de test
    testUser = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)
    adminUser = await TestHelpers.createTestUser(UserRole.ADMIN)

    // Créer type de document de test
    testDocumentType = await TestHelpers.createTestDocumentType(
      'TEST_DOC',
      DocumentApplicableTo.USER,
      ['transporteur']
    )
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create a document with all required fields', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    assert.exists(document.id)
    assert.equal(document.documentTypeId, testDocumentType.id)
    assert.equal(document.userId, testUser.id)
    assert.equal(document.status, DocumentStatus.PENDING)
    assert.equal(document.fileName, 'test.jpg')
    assert.equal(document.fileSizeBytes, 1024)
    assert.equal(document.version, 1)
  })

  test('should load documentType relation', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    await document.load('documentType')

    assert.exists(document.documentType)
    assert.equal(document.documentType.id, testDocumentType.id)
    assert.equal(document.documentType.code, 'TEST_DOC')
  })

  test('should load user relation', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    await document.load('user')

    assert.exists(document.user)
    assert.equal(document.user.id, testUser.id)
  })

  test('isPending() should return true for pending documents', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    assert.isTrue(document.isPending())
    assert.isFalse(document.isValidated())
    assert.isFalse(document.isRejected())
  })

  test('isValidated() should return true for validated documents', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      validatedById: adminUser.id,
      validatedAt: DateTime.now(),
    })

    assert.isTrue(document.isValidated())
    assert.isFalse(document.isPending())
    assert.isFalse(document.isRejected())
  })

  test('isRejected() should return true for rejected documents', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.REJECTED,
      rejectionReason: 'Document illisible',
    })

    assert.isTrue(document.isRejected())
    assert.isFalse(document.isPending())
    assert.isFalse(document.isValidated())
    assert.equal(document.rejectionReason, 'Document illisible')
  })

  test('isExpired() should return true for expired documents by status', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.EXPIRED,
    })

    assert.isTrue(document.isExpired())
  })

  test('isExpired() should return true for documents with past expiration date', async ({
    assert,
  }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      expirationDate: DateTime.now().minus({ days: 1 }),
    })

    assert.isTrue(document.isExpired())
  })

  test('isExpired() should return false for documents with future expiration date', async ({
    assert,
  }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      expirationDate: DateTime.now().plus({ days: 30 }),
    })

    assert.isFalse(document.isExpired())
  })

  test('canBeValidated() should return true only for pending documents', async ({ assert }) => {
    const pendingDoc = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    assert.isTrue(pendingDoc.canBeValidated())

    // Marquer comme remplacé avant de créer un nouveau document pour le même user/type
    pendingDoc.status = DocumentStatus.REPLACED
    await pendingDoc.save()

    const validatedDoc = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test2.jpg',
      fileName: 'test2.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
    })

    assert.isFalse(validatedDoc.canBeValidated())
  })

  test('canBeRejected() should return true only for pending documents', async ({ assert }) => {
    const pendingDoc = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    assert.isTrue(pendingDoc.canBeRejected())

    // Marquer comme remplacé avant de créer un nouveau document pour le même user/type
    pendingDoc.status = DocumentStatus.REPLACED
    await pendingDoc.save()

    const rejectedDoc = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test2.jpg',
      fileName: 'test2.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.REJECTED,
    })

    assert.isFalse(rejectedDoc.canBeRejected())
  })

  test('daysUntilExpiration() should return correct number of days', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      expirationDate: DateTime.now().plus({ days: 30 }),
    })

    const daysLeft = document.daysUntilExpiration()
    assert.isNotNull(daysLeft)
    assert.isTrue(daysLeft! >= 29 && daysLeft! <= 31) // Account for time precision
  })

  test('daysUntilExpiration() should return null when no expiration date', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    assert.isNull(document.daysUntilExpiration())
  })

  test('isExpiringWithinDays() should detect documents expiring soon', async ({ assert }) => {
    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      expirationDate: DateTime.now().plus({ days: 7 }),
    })

    assert.isTrue(document.isExpiringWithinDays(10))
    assert.isTrue(document.isExpiringWithinDays(30))
    assert.isFalse(document.isExpiringWithinDays(5))
  })

  test('statusLabel getter should return correct French labels', async ({ assert }) => {
    const statuses = [
      { status: DocumentStatus.PENDING, label: 'En attente' },
      { status: DocumentStatus.VALIDATED, label: 'Validé' },
      { status: DocumentStatus.REJECTED, label: 'Rejeté' },
      { status: DocumentStatus.EXPIRED, label: 'Expiré' },
      { status: DocumentStatus.REPLACED, label: 'Remplacé' },
    ]

    for (const { status, label } of statuses) {
      const doc = await Document.create({
        documentTypeId: testDocumentType.id,
        userId: testUser.id,
        fileUrl: `https://example.com/test-${status}.jpg`,
        fileName: `test-${status}.jpg`,
        fileSizeBytes: 1024,
        mimeType: 'image/jpeg',
        status,
      })

      assert.equal(doc.statusLabel, label)

      // Marquer comme remplacé pour éviter conflit avec le prochain document
      if (status !== DocumentStatus.REPLACED) {
        doc.status = DocumentStatus.REPLACED
        await doc.save()
      }
    }
  })

  test('fileSizeFormatted getter should format file sizes correctly', async ({ assert }) => {
    const testCases = [
      { bytes: 500, expected: '500 B' },
      { bytes: 1024, expected: '1.00 KB' },
      { bytes: 1024 * 500, expected: '500.00 KB' },
      { bytes: 1024 * 1024, expected: '1.00 MB' },
      { bytes: 1024 * 1024 * 2.5, expected: '2.50 MB' },
    ]

    for (const { bytes, expected } of testCases) {
      const doc = await Document.create({
        documentTypeId: testDocumentType.id,
        userId: testUser.id,
        fileUrl: `https://example.com/test-${bytes}.jpg`,
        fileName: `test-${bytes}.jpg`,
        fileSizeBytes: bytes,
        mimeType: 'image/jpeg',
        status: DocumentStatus.PENDING,
      })

      assert.equal(doc.fileSizeFormatted, expected)

      // Marquer comme remplacé pour éviter conflit avec le prochain document
      doc.status = DocumentStatus.REPLACED
      await doc.save()
    }
  })

  test('should support document versioning with replacedById', async ({ assert }) => {
    const originalDoc = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/original.jpg',
      fileName: 'original.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.VALIDATED,
      version: 1,
    })

    const newDoc = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/new.jpg',
      fileName: 'new.jpg',
      fileSizeBytes: 2048,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
      version: 2,
    })

    // Marquer l'ancien document comme remplacé
    originalDoc.status = DocumentStatus.REPLACED
    originalDoc.replacedById = newDoc.id
    await originalDoc.save()

    assert.equal(originalDoc.status, DocumentStatus.REPLACED)
    assert.equal(originalDoc.replacedById, newDoc.id)
  })

  test('should store metadata as JSON', async ({ assert }) => {
    const metadata = {
      extracted_info: {
        nom: 'DUPONT',
        prenom: 'Jean',
      },
      ai_confidence: 0.95,
    }

    const document = await Document.create({
      documentTypeId: testDocumentType.id,
      userId: testUser.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
      metadata,
    })

    assert.deepEqual(document.metadata, metadata)
    assert.equal(document.metadata!.extracted_info.nom, 'DUPONT')
  })
})
