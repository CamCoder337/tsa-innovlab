import { test } from '@japa/runner'
import {
  uploadDocumentValidator,
  validateDocumentValidator,
  rejectDocumentValidator,
  updateDocumentValidator,
  searchDocumentsValidator,
} from '#validators/document_validator'

test.group('Document Validators', () => {
  test('uploadDocumentValidator should accept valid upload data', async ({ assert }) => {
    const validData = {
      documentTypeId: '550e8400-e29b-41d4-a716-446655440000',
      fileUrl: 'https://storage.example.com/documents/cni-123.jpg',
      fileName: 'cni-recto.jpg',
      fileSizeBytes: 204800,
      mimeType: 'image/jpeg',
    }

    const result = await uploadDocumentValidator.validate(validData)

    assert.equal(result.documentTypeId, validData.documentTypeId)
    assert.equal(result.fileUrl, validData.fileUrl)
    assert.equal(result.fileName, validData.fileName)
  })

  test('uploadDocumentValidator should accept optional fields', async ({ assert }) => {
    const validData = {
      documentTypeId: '550e8400-e29b-41d4-a716-446655440000',
      vehicleId: '550e8400-e29b-41d4-a716-446655440001',
      fileUrl: 'https://storage.example.com/documents/cni-123.jpg',
      fileName: 'cni-recto.jpg',
      fileSizeBytes: 204800,
      mimeType: 'image/jpeg',
      issueDate: new Date('2020-01-01'),
      expirationDate: new Date('2030-01-01'),
      metadata: {
        extracted_name: 'DUPONT Jean',
        confidence: 0.95,
      },
    }

    const result = await uploadDocumentValidator.validate(validData)

    assert.equal(result.vehicleId, validData.vehicleId)
    assert.exists(result.issueDate)
    assert.exists(result.expirationDate)
    assert.deepEqual(result.metadata, validData.metadata)
  })

  test('uploadDocumentValidator should reject invalid UUID', async ({ assert }) => {
    const invalidData = {
      documentTypeId: 'not-a-uuid',
      fileUrl: 'https://storage.example.com/documents/cni-123.jpg',
      fileName: 'cni-recto.jpg',
      fileSizeBytes: 204800,
      mimeType: 'image/jpeg',
    }

    await assert.rejects(async () => {
      await uploadDocumentValidator.validate(invalidData)
    })
  })

  test('uploadDocumentValidator should reject invalid URL', async ({ assert }) => {
    const invalidData = {
      documentTypeId: '550e8400-e29b-41d4-a716-446655440000',
      fileUrl: 'not-a-url',
      fileName: 'cni-recto.jpg',
      fileSizeBytes: 204800,
      mimeType: 'image/jpeg',
    }

    await assert.rejects(async () => {
      await uploadDocumentValidator.validate(invalidData)
    })
  })

  test('uploadDocumentValidator should reject negative file size', async ({ assert }) => {
    const invalidData = {
      documentTypeId: '550e8400-e29b-41d4-a716-446655440000',
      fileUrl: 'https://storage.example.com/documents/cni-123.jpg',
      fileName: 'cni-recto.jpg',
      fileSizeBytes: -100,
      mimeType: 'image/jpeg',
    }

    await assert.rejects(async () => {
      await uploadDocumentValidator.validate(invalidData)
    })
  })

  test('uploadDocumentValidator should accept null for optional vehicleId', async ({ assert }) => {
    const validData = {
      documentTypeId: '550e8400-e29b-41d4-a716-446655440000',
      vehicleId: null,
      fileUrl: 'https://storage.example.com/documents/cni-123.jpg',
      fileName: 'cni-recto.jpg',
      fileSizeBytes: 204800,
      mimeType: 'image/jpeg',
    }

    const result = await uploadDocumentValidator.validate(validData)

    assert.isNull(result.vehicleId)
  })

  test('validateDocumentValidator should accept valid validation data', async ({ assert }) => {
    const validData = {
      notes: 'Document conforme, bien lisible',
    }

    const result = await validateDocumentValidator.validate(validData)

    assert.equal(result.notes, validData.notes)
  })

  test('validateDocumentValidator should accept without notes', async ({ assert }) => {
    const validData = {}

    const result = await validateDocumentValidator.validate(validData)

    assert.isUndefined(result.notes)
  })

  test('validateDocumentValidator should reject notes exceeding 1000 chars', async ({ assert }) => {
    const invalidData = {
      notes: 'a'.repeat(1001),
    }

    await assert.rejects(async () => {
      await validateDocumentValidator.validate(invalidData)
    })
  })

  test('rejectDocumentValidator should accept valid rejection data', async ({ assert }) => {
    const validData = {
      reason: 'Document illisible, merci de soumettre une photo de meilleure qualité',
    }

    const result = await rejectDocumentValidator.validate(validData)

    assert.equal(result.reason, validData.reason)
  })

  test('rejectDocumentValidator should reject reason less than 10 chars', async ({ assert }) => {
    const invalidData = {
      reason: 'Court',
    }

    await assert.rejects(async () => {
      await rejectDocumentValidator.validate(invalidData)
    })
  })

  test('rejectDocumentValidator should reject reason exceeding 1000 chars', async ({ assert }) => {
    const invalidData = {
      reason: 'a'.repeat(1001),
    }

    await assert.rejects(async () => {
      await rejectDocumentValidator.validate(invalidData)
    })
  })

  test('rejectDocumentValidator should require reason field', async ({ assert }) => {
    const invalidData = {}

    await assert.rejects(async () => {
      await rejectDocumentValidator.validate(invalidData)
    })
  })

  test('updateDocumentValidator should accept valid update data', async ({ assert }) => {
    const validData = {
      metadata: {
        notes: 'Document mis à jour',
      },
      issueDate: new Date('2020-01-01'),
      expirationDate: new Date('2030-01-01'),
    }

    const result = await updateDocumentValidator.validate(validData)

    assert.deepEqual(result.metadata, validData.metadata)
    assert.exists(result.issueDate)
    assert.exists(result.expirationDate)
  })

  test('updateDocumentValidator should accept partial updates', async ({ assert }) => {
    const validData = {
      metadata: { note: 'Just metadata' },
    }

    const result = await updateDocumentValidator.validate(validData)

    assert.deepEqual(result.metadata, validData.metadata)
    assert.isUndefined(result.issueDate)
  })

  test('searchDocumentsValidator should accept valid search filters', async ({ assert }) => {
    const validData = {
      status: 'pending',
      documentTypeId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      page: 1,
      limit: 20,
    }

    const result = await searchDocumentsValidator.validate(validData)

    assert.equal(result.status, validData.status)
    assert.equal(result.documentTypeId, validData.documentTypeId)
    assert.equal(result.page, validData.page)
    assert.equal(result.limit, validData.limit)
  })

  test('searchDocumentsValidator should accept all status values', async ({ assert }) => {
    const statuses = ['pending', 'validated', 'rejected', 'expired', 'replaced']

    for (const status of statuses) {
      const validData = { status }
      const result = await searchDocumentsValidator.validate(validData)
      assert.equal(result.status, status)
    }
  })

  test('searchDocumentsValidator should reject invalid status', async ({ assert }) => {
    const invalidData = {
      status: 'invalid_status',
    }

    await assert.rejects(async () => {
      await searchDocumentsValidator.validate(invalidData)
    })
  })

  test('searchDocumentsValidator should enforce max limit of 100', async ({ assert }) => {
    const invalidData = {
      limit: 101,
    }

    await assert.rejects(async () => {
      await searchDocumentsValidator.validate(invalidData)
    })
  })

  test('searchDocumentsValidator should reject negative page number', async ({ assert }) => {
    const invalidData = {
      page: -1,
    }

    await assert.rejects(async () => {
      await searchDocumentsValidator.validate(invalidData)
    })
  })

  test('searchDocumentsValidator should reject zero page number', async ({ assert }) => {
    const invalidData = {
      page: 0,
    }

    await assert.rejects(async () => {
      await searchDocumentsValidator.validate(invalidData)
    })
  })

  test('searchDocumentsValidator should accept all filters as optional', async ({ assert }) => {
    const validData = {}

    const result = await searchDocumentsValidator.validate(validData)

    assert.isUndefined(result.status)
    assert.isUndefined(result.documentTypeId)
    assert.isUndefined(result.page)
    assert.isUndefined(result.limit)
  })

  test('searchDocumentsValidator should accept vehicleId filter', async ({ assert }) => {
    const validData = {
      vehicleId: '550e8400-e29b-41d4-a716-446655440000',
    }

    const result = await searchDocumentsValidator.validate(validData)

    assert.equal(result.vehicleId, validData.vehicleId)
  })
})
