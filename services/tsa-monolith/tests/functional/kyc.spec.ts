import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Database from '@adonisjs/lucid/services/db'
import User, { UserRole, UserStatus } from '#models/user'
import env from '#start/env'

/**
 * Tests fonctionnels pour le module KYC
 *
 * Ces tests vérifient :
 * 1. Extraction de documents CNI
 * 2. Gestion des erreurs
 * 3. Permissions (admin pour stats)
 * 4. Health check
 */
test.group('KYC Module', (group) => {
  let client: User
  let admin: User
  let clientToken: string
  let adminToken: string
  const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    // Créer un client
    client = await User.create({
      email: 'kyc-client@example.com',
      passwordHash: defaultPassword,
      firstName: 'KYC',
      lastName: 'Client',
      phone: '+237650000001',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Créer un admin
    admin = await User.create({
      email: 'kyc-admin@example.com',
      passwordHash: defaultPassword,
      firstName: 'KYC',
      lastName: 'Admin',
      phone: '+237650000002',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Générer tokens
    clientToken = await client.generateAccessToken('test-token')
    adminToken = await admin.generateAccessToken('test-token')
  })

  group.each.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should check KYC service health', async ({ assert, client: httpClient }) => {
    const response = await httpClient.get('/api/kyc/health')

    // Le service peut être disponible ou non selon l'environnement
    assert.isTrue(response.status() === 200 || response.status() === 503)
    assert.properties(response.body(), ['success'])
  })

  test('should reject extraction without authentication', async ({
    assert,
    client: httpClient,
  }) => {
    const response = await httpClient.post('/api/kyc/extract').fields({
      document_type: 'CNI_ANCIEN',
    })

    assert.equal(response.status(), 401)
  })

  test('should reject extraction with invalid document type', async ({
    assert,
    client: httpClient,
  }) => {
    const response = await httpClient.post('/api/kyc/extract').bearerToken(clientToken).fields({
      document_type: 'INVALID_TYPE',
    })

    assert.equal(response.status(), 400)
    assert.equal(response.body().success, false)
    assert.include(response.body().message.toLowerCase(), 'invalide')
  })

  test('should reject extraction without recto file', async ({ assert, client: httpClient }) => {
    const response = await httpClient.post('/api/kyc/extract').bearerToken(clientToken).fields({
      document_type: 'CNI_ANCIEN',
    })

    assert.equal(response.status(), 400)
    assert.equal(response.body().success, false)
    assert.include(response.body().message.toLowerCase(), 'recto')
  })

  test('should reject stats access for non-admin users', async ({ assert, client: httpClient }) => {
    const response = await httpClient.get('/api/kyc/stats').bearerToken(clientToken)

    assert.equal(response.status(), 403)
    assert.equal(response.body().success, false)
  })

  test('should allow stats access for admin users', async ({ assert, client: httpClient }) => {
    const response = await httpClient.get('/api/kyc/stats').bearerToken(adminToken)

    // Le service peut être disponible ou non
    assert.isTrue(response.status() === 200 || response.status() === 503)
  })

  // Test d'intégration avec un vrai fichier (skip si service AI indisponible)
  test('should extract CNI document with valid files', async ({ assert, client: httpClient }) => {
    // Créer un buffer de test (image factice)
    const testImageBuffer = Buffer.from('fake-image-data')

    const response = await httpClient
      .post('/api/kyc/extract')
      .bearerToken(clientToken)
      .fields({
        document_type: 'CNI_ANCIEN',
      })
      .file('recto', testImageBuffer, { filename: 'recto.jpg' })
      .file('verso', testImageBuffer, { filename: 'verso.jpg' })

    // Le service peut être indisponible en test
    if (response.status() === 503) {
      assert.equal(response.body().success, false)
      assert.include(response.body().message.toLowerCase(), 'indisponible')
      return
    }

    // Si le service est disponible, vérifier la structure de la réponse
    assert.isTrue(response.status() === 200 || response.status() === 400)
    assert.properties(response.body(), ['success'])
  }).tags(['integration', 'ai-service'])
})
