import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'
import DocumentType, { DocumentApplicableTo } from '#models/document_type'
import { UserRole } from '#models/user'

test.group('DocumentType Model', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create a document type for users', async ({ assert }) => {
    const docType = await DocumentType.create({
      code: 'CNI',
      labelFr: "Carte Nationale d'Identité",
      labelEn: 'National Identity Card',
      applicableTo: DocumentApplicableTo.USER,
      requiredForRoles: [UserRole.TRANSPORTEUR, UserRole.AFFRETEUR],
      hasExpiration: true,
      defaultValidityDays: 3650, // 10 ans
      fileFormatRestrictions: {
        allowed: ['image/jpeg', 'image/png'],
        max_size_mb: 5,
      },
      isActive: true,
      displayOrder: 1,
    })

    assert.exists(docType.id)
    assert.equal(docType.code, 'CNI')
    assert.equal(docType.applicableTo, DocumentApplicableTo.USER)
    assert.isTrue(docType.hasExpiration)
    assert.equal(docType.defaultValidityDays, 3650)
  })

  test('should create a document type for vehicles', async ({ assert }) => {
    const docType = await DocumentType.create({
      code: 'CARTE_GRISE',
      labelFr: 'Carte Grise',
      labelEn: 'Vehicle Registration',
      applicableTo: DocumentApplicableTo.VEHICLE,
      requiredForVehicleTypes: ['CAMION', 'CAMIONNETTE'],
      hasExpiration: false,
      fileFormatRestrictions: {
        allowed: ['application/pdf', 'image/jpeg'],
        max_size_mb: 10,
      },
      isActive: true,
      displayOrder: 1,
    })

    assert.equal(docType.applicableTo, DocumentApplicableTo.VEHICLE)
    assert.deepEqual(docType.requiredForVehicleTypes, ['CAMION', 'CAMIONNETTE'])
    assert.isFalse(docType.hasExpiration)
  })

  test('isRequiredForRole() should check if document is required for a role', async ({
    assert,
  }) => {
    const docType = await DocumentType.create({
      code: 'REGISTRE_COMMERCE',
      labelFr: 'Registre de Commerce',
      labelEn: 'Business Registration',
      applicableTo: DocumentApplicableTo.USER,
      requiredForRoles: [UserRole.TRANSPORTEUR],
      hasExpiration: true,
      defaultValidityDays: 365,
      isActive: true,
      displayOrder: 1,
    })

    assert.isTrue(docType.isRequiredForRole(UserRole.TRANSPORTEUR))
    assert.isFalse(docType.isRequiredForRole(UserRole.AFFRETEUR))
    assert.isFalse(docType.isRequiredForRole(UserRole.ADMIN))
  })

  test('isRequiredForRole() should return false when requiredForRoles is null', async ({
    assert,
  }) => {
    const docType = await DocumentType.create({
      code: 'OPTIONAL_DOC',
      labelFr: 'Document Optionnel',
      labelEn: 'Optional Document',
      applicableTo: DocumentApplicableTo.USER,
      requiredForRoles: null,
      hasExpiration: false,
      isActive: true,
      displayOrder: 1,
    })

    assert.isFalse(docType.isRequiredForRole(UserRole.TRANSPORTEUR))
  })

  test('isRequiredForVehicleType() should check if document is required for vehicle type', async ({
    assert,
  }) => {
    const docType = await DocumentType.create({
      code: 'ASSURANCE',
      labelFr: 'Assurance Véhicule',
      labelEn: 'Vehicle Insurance',
      applicableTo: DocumentApplicableTo.VEHICLE,
      requiredForVehicleTypes: ['CAMION', 'CAMIONNETTE', 'MOTO'],
      hasExpiration: true,
      defaultValidityDays: 365,
      isActive: true,
      displayOrder: 1,
    })

    assert.isTrue(docType.isRequiredForVehicleType('CAMION'))
    assert.isTrue(docType.isRequiredForVehicleType('CAMIONNETTE'))
    assert.isTrue(docType.isRequiredForVehicleType('MOTO'))
    assert.isFalse(docType.isRequiredForVehicleType('VOITURE'))
  })

  test('isRequiredForVehicleType() should return false when requiredForVehicleTypes is null', async ({
    assert,
  }) => {
    const docType = await DocumentType.create({
      code: 'OPTIONAL_VEHICLE_DOC',
      labelFr: 'Document Optionnel Véhicule',
      labelEn: 'Optional Vehicle Document',
      applicableTo: DocumentApplicableTo.VEHICLE,
      requiredForVehicleTypes: null,
      hasExpiration: false,
      isActive: true,
      displayOrder: 1,
    })

    assert.isFalse(docType.isRequiredForVehicleType('CAMION'))
  })

  test('getAllowedFormats() should return allowed file formats', async ({ assert }) => {
    const docType = await DocumentType.create({
      code: 'TEST_DOC',
      labelFr: 'Test Document',
      labelEn: 'Test Document',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: false,
      fileFormatRestrictions: {
        allowed: ['image/jpeg', 'image/png', 'application/pdf'],
        max_size_mb: 5,
      },
      isActive: true,
      displayOrder: 1,
    })

    const formats = docType.getAllowedFormats()
    assert.deepEqual(formats, ['image/jpeg', 'image/png', 'application/pdf'])
  })

  test('getAllowedFormats() should return empty array when no restrictions', async ({ assert }) => {
    const docType = await DocumentType.create({
      code: 'TEST_DOC',
      labelFr: 'Test Document',
      labelEn: 'Test Document',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: false,
      fileFormatRestrictions: null,
      isActive: true,
      displayOrder: 1,
    })

    const formats = docType.getAllowedFormats()
    assert.deepEqual(formats, [])
  })

  test('getMaxFileSizeMB() should return max file size', async ({ assert }) => {
    const docType = await DocumentType.create({
      code: 'TEST_DOC',
      labelFr: 'Test Document',
      labelEn: 'Test Document',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: false,
      fileFormatRestrictions: {
        allowed: ['image/jpeg'],
        max_size_mb: 10,
      },
      isActive: true,
      displayOrder: 1,
    })

    assert.equal(docType.getMaxFileSizeMB(), 10)
  })

  test('getMaxFileSizeMB() should return default 5MB when no restrictions', async ({ assert }) => {
    const docType = await DocumentType.create({
      code: 'TEST_DOC',
      labelFr: 'Test Document',
      labelEn: 'Test Document',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: false,
      fileFormatRestrictions: null,
      isActive: true,
      displayOrder: 1,
    })

    assert.equal(docType.getMaxFileSizeMB(), 5)
  })

  test('getLabel() should return French label by default', async ({ assert }) => {
    const docType = await DocumentType.create({
      code: 'CNI',
      labelFr: "Carte Nationale d'Identité",
      labelEn: 'National Identity Card',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: true,
      isActive: true,
      displayOrder: 1,
    })

    assert.equal(docType.getLabel(), "Carte Nationale d'Identité")
    assert.equal(docType.getLabel('fr'), "Carte Nationale d'Identité")
  })

  test('getLabel() should return English label when specified', async ({ assert }) => {
    const docType = await DocumentType.create({
      code: 'CNI',
      labelFr: "Carte Nationale d'Identité",
      labelEn: 'National Identity Card',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: true,
      isActive: true,
      displayOrder: 1,
    })

    assert.equal(docType.getLabel('en'), 'National Identity Card')
  })

  test('should support validation rules as JSON', async ({ assert }) => {
    const validationRules = {
      min_age: 18,
      require_photo: true,
      expiration_warning_days: [30, 7],
    }

    const docType = await DocumentType.create({
      code: 'CNI',
      labelFr: "Carte Nationale d'Identité",
      labelEn: 'National Identity Card',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: true,
      defaultValidityDays: 3650,
      validationRules,
      isActive: true,
      displayOrder: 1,
    })

    assert.deepEqual(docType.validationRules, validationRules)
    assert.equal(docType.validationRules!.min_age, 18)
    assert.isTrue(docType.validationRules!.require_photo)
  })

  test('should support display order for sorting', async ({ assert }) => {
    const doc1 = await DocumentType.create({
      code: 'DOC1',
      labelFr: 'Document 1',
      labelEn: 'Document 1',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: false,
      isActive: true,
      displayOrder: 3,
    })

    const doc2 = await DocumentType.create({
      code: 'DOC2',
      labelFr: 'Document 2',
      labelEn: 'Document 2',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: false,
      isActive: true,
      displayOrder: 1,
    })

    const doc3 = await DocumentType.create({
      code: 'DOC3',
      labelFr: 'Document 3',
      labelEn: 'Document 3',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: false,
      isActive: true,
      displayOrder: 2,
    })

    const sorted = await DocumentType.query().orderBy('display_order', 'asc')

    assert.equal(sorted[0].id, doc2.id)
    assert.equal(sorted[1].id, doc3.id)
    assert.equal(sorted[2].id, doc1.id)
  })

  test('should filter active document types', async ({ assert }) => {
    await DocumentType.create({
      code: 'ACTIVE_DOC',
      labelFr: 'Active Document',
      labelEn: 'Active Document',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: false,
      isActive: true,
      displayOrder: 1,
    })

    await DocumentType.create({
      code: 'INACTIVE_DOC',
      labelFr: 'Inactive Document',
      labelEn: 'Inactive Document',
      applicableTo: DocumentApplicableTo.USER,
      hasExpiration: false,
      isActive: false,
      displayOrder: 2,
    })

    const activeTypes = await DocumentType.query().where('is_active', true)
    const inactiveTypes = await DocumentType.query().where('is_active', false)

    assert.lengthOf(activeTypes, 1)
    assert.equal(activeTypes[0].code, 'ACTIVE_DOC')
    assert.lengthOf(inactiveTypes, 1)
    assert.equal(inactiveTypes[0].code, 'INACTIVE_DOC')
  })
})
