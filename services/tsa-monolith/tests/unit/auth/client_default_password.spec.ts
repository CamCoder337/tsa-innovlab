import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User, { UserRole, UserStatus } from '#models/user'
import hash from '@adonisjs/core/services/hash'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Test spécial pour vérifier la création d'un client avec le mot de passe par défaut
 *
 * Ce test vérifie que :
 * 1. Un client peut être créé avec le mot de passe par défaut "Admin123!"
 * 2. Le mot de passe est correctement haché en base de données
 * 3. La connexion fonctionne avec ce mot de passe par défaut
 * 4. Tous les clients utilisent le même mot de passe par défaut
 */
test.group('Client Default Password', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should create client with default password Admin123!', async ({ assert }) => {
    // Récupérer le mot de passe par défaut depuis l'environnement
    const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    // Créer un client avec le mot de passe par défaut
    const client = await User.create({
      email: 'client-default-password@example.com',
      passwordHash: defaultPassword, // Le modèle va automatiquement hasher
      firstName: 'Test',
      lastName: 'Client',
      phone: '+237600000000',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    assert.isDefined(client, 'Client should be created')
    assert.equal(client.role, UserRole.CLIENT, 'User should have CLIENT role')
    assert.equal(client.email, 'client-default-password@example.com', 'Email should be correct')

    // Vérifier que le mot de passe a été haché (ne devrait pas être en clair)
    assert.notEqual(
      client.passwordHash,
      defaultPassword,
      'Password should be hashed, not stored in plain text'
    )

    // Vérifier que le hash est valide
    const isPasswordValid = await hash.verify(client.passwordHash, defaultPassword)
    assert.isTrue(isPasswordValid, 'Default password Admin123! should match the stored hash')
  })

  test('should authenticate client with default password', async ({ assert }) => {
    const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    // Créer client
    const client = await User.create({
      email: 'auth-test-client@example.com',
      passwordHash: defaultPassword,
      firstName: 'Auth',
      lastName: 'Test',
      phone: '+237600000001',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Tester l'authentification avec le mot de passe par défaut
    const authenticatedUser = await User.verifyCredentials(client.email, defaultPassword)

    assert.isDefined(authenticatedUser, 'User should be authenticated')
    assert.equal(authenticatedUser.id, client.id, 'Should return correct user')
    assert.equal(authenticatedUser.role, UserRole.CLIENT, 'Should have CLIENT role')
  })

  test('should fail authentication with wrong password', async ({ assert }) => {
    const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    // Créer client
    await User.create({
      email: 'wrong-password-test@example.com',
      passwordHash: defaultPassword,
      firstName: 'Wrong',
      lastName: 'Password',
      phone: '+237600000002',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Tester avec un mauvais mot de passe
    await assert.rejects(async () => {
      await User.verifyCredentials('wrong-password-test@example.com', 'WrongPassword123!')
    })
  })

  test('should create multiple clients with same default password', async ({ assert }) => {
    const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    // Créer client 1
    const client1 = await User.create({
      email: 'client1-default@example.com',
      passwordHash: defaultPassword,
      firstName: 'Client',
      lastName: 'One',
      phone: '+237600000003',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Créer client 2
    const client2 = await User.create({
      email: 'client2-default@example.com',
      passwordHash: defaultPassword,
      firstName: 'Client',
      lastName: 'Two',
      phone: '+237600000004',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Créer client 3
    const client3 = await User.create({
      email: 'client3-default@example.com',
      passwordHash: defaultPassword,
      firstName: 'Client',
      lastName: 'Three',
      phone: '+237600000005',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Vérifier que tous les clients peuvent s'authentifier avec le même mot de passe
    const auth1 = await User.verifyCredentials(client1.email, defaultPassword)
    const auth2 = await User.verifyCredentials(client2.email, defaultPassword)
    const auth3 = await User.verifyCredentials(client3.email, defaultPassword)

    assert.isDefined(auth1, 'Client 1 should authenticate')
    assert.isDefined(auth2, 'Client 2 should authenticate')
    assert.isDefined(auth3, 'Client 3 should authenticate')

    assert.equal(auth1.id, client1.id, 'Should authenticate as client 1')
    assert.equal(auth2.id, client2.id, 'Should authenticate as client 2')
    assert.equal(auth3.id, client3.id, 'Should authenticate as client 3')
  })

  test('should verify default password is Admin123!', async ({ assert }) => {
    const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    // Vérifier explicitement que le mot de passe par défaut est bien "Admin123!"
    assert.equal(
      defaultPassword,
      'Admin123!',
      'Default password should be Admin123! (from ADMIN_PASSWORD env or fallback)'
    )
  })

  test('should create client with default password and verify CLIENT role abilities', async ({
    assert,
  }) => {
    const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    // Créer client
    const client = await User.create({
      email: 'client-abilities-test@example.com',
      passwordHash: defaultPassword,
      firstName: 'Abilities',
      lastName: 'Test',
      phone: '+237600000006',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Vérifier les abilities du rôle CLIENT
    const abilities = client.getAbilities()

    assert.include(abilities, 'shop', 'Client should have shop ability')
    assert.include(abilities, 'manage_cart', 'Client should have manage_cart ability')
    assert.include(abilities, 'place_orders', 'Client should have place_orders ability')
    assert.include(abilities, 'view_orders', 'Client should have view_orders ability')

    // Vérifier que le client N'A PAS les abilities d'admin
    assert.notInclude(abilities, 'manage_users', 'Client should NOT have manage_users ability')
    assert.notInclude(abilities, 'view_reports', 'Client should NOT have view_reports ability')
  })

  test('should verify client does not require MFA by default', async ({ assert }) => {
    const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    // Créer client
    const client = await User.create({
      email: 'client-mfa-test@example.com',
      passwordHash: defaultPassword,
      firstName: 'MFA',
      lastName: 'Test',
      phone: '+237600000007',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    // Vérifier que MFA n'est pas requis pour les clients (contrairement aux admins)
    assert.isFalse(client.mfaEnabled, 'MFA should be disabled by default for clients')
    assert.isFalse(
      client.requiresMFA(),
      'MFA should not be required for CLIENT role (only ADMIN requires MFA)'
    )
  })

  test('should create client seeder-style with default password', async ({ assert }) => {
    // Simulation de la création comme dans default_users_seeder.ts
    const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    const clientData = {
      email: 'client-seeder-test@tsa-logistics.com',
      firstName: 'Test',
      lastName: 'Client',
      phone: '+237600000008',
      role: UserRole.CLIENT,
    }

    const client = await User.create({
      email: clientData.email.toLowerCase(),
      passwordHash: defaultPassword, // Même approche que le seeder
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      phone: clientData.phone,
      role: clientData.role,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
      lastLoginAt: null,
      lockedUntil: null,
    })

    assert.equal(client.email, 'client-seeder-test@tsa-logistics.com', 'Email should be correct')
    assert.equal(client.role, UserRole.CLIENT, 'Role should be CLIENT')

    // Vérifier la connexion avec le mot de passe par défaut
    const authenticated = await User.verifyCredentials(client.email, defaultPassword)
    assert.isDefined(authenticated, 'Client should authenticate with default password')
  })
})
