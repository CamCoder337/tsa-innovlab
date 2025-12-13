import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import Document, { DocumentStatus } from '#models/document'
import DocumentValidationHistory, {
  DocumentValidationAction,
} from '#models/document_validation_history'
import { DocumentApplicableTo } from '#models/document_type'
import { TestHelpers } from '../../utils/test_helpers.js'
import { UserRole } from '#models/user'

test.group('DocumentValidationHistory Model', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create a validation history entry', async ({ assert }) => {
    const user = await TestHelpers.createTestUser(UserRole.TRANSPORTEUR)
    const admin = await TestHelpers.createTestUser(UserRole.ADMIN)
    const docType = await TestHelpers.createTestDocumentType(
      'TEST_DOC',
      DocumentApplicableTo.USER,
      ['transporteur']
    )

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const history = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.VALIDATED,
      previousStatus: DocumentStatus.PENDING,
      newStatus: DocumentStatus.VALIDATED,
      performedById: admin.id,
      reason: 'Document conforme',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    })

    assert.exists(history.id)
    assert.equal(history.documentId, document.id)
    assert.equal(history.action, DocumentValidationAction.VALIDATED)
    assert.equal(history.performedById, admin.id)
  })

  test('should record all action types', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('TEST_DOC', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const actions = [
      DocumentValidationAction.VALIDATED,
      DocumentValidationAction.REJECTED,
      DocumentValidationAction.EXPIRED,
      DocumentValidationAction.REPLACED,
      DocumentValidationAction.RESUBMITTED,
      DocumentValidationAction.AUTO_EXPIRED,
    ]

    for (const action of actions) {
      const history = await DocumentValidationHistory.create({
        documentId: document.id,
        action,
        previousStatus: DocumentStatus.PENDING,
        newStatus: DocumentStatus.VALIDATED,
        performedById: user.id,
      })

      assert.equal(history.action, action)
    }
  })

  test('isSystemAction() should return true when performedById is null', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('TEST_DOC', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const systemAction = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.AUTO_EXPIRED,
      previousStatus: DocumentStatus.VALIDATED,
      newStatus: DocumentStatus.EXPIRED,
      performedById: null,
      reason: 'Expiration automatique',
    })

    const manualAction = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.VALIDATED,
      previousStatus: DocumentStatus.PENDING,
      newStatus: DocumentStatus.VALIDATED,
      performedById: user.id,
    })

    assert.isTrue(systemAction.isSystemAction())
    assert.isFalse(manualAction.isSystemAction())
  })

  test('actionLabel getter should return correct French labels', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('TEST_DOC', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const actionLabels = [
      { action: DocumentValidationAction.VALIDATED, label: 'Validé' },
      { action: DocumentValidationAction.REJECTED, label: 'Rejeté' },
      { action: DocumentValidationAction.EXPIRED, label: 'Expiré' },
      { action: DocumentValidationAction.REPLACED, label: 'Remplacé' },
      { action: DocumentValidationAction.RESUBMITTED, label: 'Resoumis' },
      { action: DocumentValidationAction.AUTO_EXPIRED, label: 'Expiré automatiquement' },
    ]

    for (const { action, label } of actionLabels) {
      const history = await DocumentValidationHistory.create({
        documentId: document.id,
        action,
        previousStatus: DocumentStatus.PENDING,
        newStatus: DocumentStatus.VALIDATED,
        performedById: user.id,
      })

      assert.equal(history.actionLabel, label)
    }
  })

  test('should store metadata as JSON', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('TEST_DOC', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const metadata = {
      admin_comment: 'Document validé après vérification',
      processing_time_ms: 1500,
      confidence_score: 0.95,
    }

    const history = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.VALIDATED,
      previousStatus: DocumentStatus.PENDING,
      newStatus: DocumentStatus.VALIDATED,
      performedById: user.id,
      metadata,
    })

    assert.deepEqual(history.metadata, metadata)
    assert.equal(history.metadata!.admin_comment, 'Document validé après vérification')
  })

  test('should store IP address and user agent', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('TEST_DOC', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const history = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.VALIDATED,
      previousStatus: DocumentStatus.PENDING,
      newStatus: DocumentStatus.VALIDATED,
      performedById: user.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    })

    assert.equal(history.ipAddress, '192.168.1.100')
    assert.include(history.userAgent!, 'Mozilla/5.0')
  })

  test('should load document relation', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('TEST_DOC', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const history = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.VALIDATED,
      previousStatus: DocumentStatus.PENDING,
      newStatus: DocumentStatus.VALIDATED,
      performedById: user.id,
    })

    await history.load('document')

    assert.exists(history.document)
    assert.equal(history.document.id, document.id)
  })

  test('should load performedBy user relation', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const admin = await TestHelpers.createTestUser(UserRole.ADMIN)
    const docType = await TestHelpers.createTestDocumentType('TEST_DOC', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    const history = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.VALIDATED,
      previousStatus: DocumentStatus.PENDING,
      newStatus: DocumentStatus.VALIDATED,
      performedById: admin.id,
    })

    await history.load('performedBy')

    assert.exists(history.performedBy)
    assert.equal(history.performedBy.id, admin.id)
    assert.equal(history.performedBy.role, UserRole.ADMIN)
  })

  test('should order history entries chronologically', async ({ assert }) => {
    const user = await TestHelpers.createTestUser()
    const docType = await TestHelpers.createTestDocumentType('TEST_DOC', DocumentApplicableTo.USER)

    const document = await Document.create({
      documentTypeId: docType.id,
      userId: user.id,
      fileUrl: 'https://example.com/test.jpg',
      fileName: 'test.jpg',
      fileSizeBytes: 1024,
      mimeType: 'image/jpeg',
      status: DocumentStatus.PENDING,
    })

    // Create multiple history entries
    await TestHelpers.wait(10)
    const history1 = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.RESUBMITTED,
      previousStatus: null,
      newStatus: DocumentStatus.PENDING,
      performedById: user.id,
    })

    await TestHelpers.wait(10)
    const history2 = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.VALIDATED,
      previousStatus: DocumentStatus.PENDING,
      newStatus: DocumentStatus.VALIDATED,
      performedById: user.id,
    })

    await TestHelpers.wait(10)
    const history3 = await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.EXPIRED,
      previousStatus: DocumentStatus.VALIDATED,
      newStatus: DocumentStatus.EXPIRED,
      performedById: null,
    })

    const orderedHistory = await DocumentValidationHistory.query()
      .where('document_id', document.id)
      .orderBy('created_at', 'asc')

    assert.lengthOf(orderedHistory, 3)
    assert.equal(orderedHistory[0].id, history1.id)
    assert.equal(orderedHistory[1].id, history2.id)
    assert.equal(orderedHistory[2].id, history3.id)
  })
})
