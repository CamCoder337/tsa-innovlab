import { test } from '@japa/runner'
import AuthService from '#services/auth_service'
import MFAService from '#services/mfa_service'
import EmailService from '#services/email_service'
import CacheService from '#services/cache_service'
import User, { UserRole, UserStatus } from '#models/user'
import Database from '@adonisjs/lucid/services/db'

test.group('AuthService', (group) => {
  let authService: AuthService
  let mfaService: MFAService
  let emailService: EmailService
  let cacheService: CacheService

  group.setup(async () => {
    await Database.beginGlobalTransaction()

    // Mock services
    mfaService = new MFAService()
    const resendServiceModule = await import('#services/resend_service')
    const ResendService = resendServiceModule.default
    const resendService = new ResendService()
    emailService = new EmailService(resendService)
    cacheService = new CacheService()
    authService = new AuthService(cacheService, mfaService, emailService)
  })

  group.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should register admin user with MFA enabled', async ({ assert }) => {
    const userData = {
      email: 'admin@test.com',
      password: 'password123!',
      firstName: 'Admin',
      lastName: 'Test',
      phone: '+33612345678',
      role: UserRole.ADMIN,
    }

    const user = await authService.register(userData, '127.0.0.1')

    assert.equal(user.email, 'admin@test.com')
    assert.equal(user.role, 'admin')
    assert.isTrue(user.mfaEnabled)
    assert.equal(user.status, 'pending')
  })

  test('should register normal user without MFA', async ({ assert }) => {
    const userData = {
      email: 'user@test.com',
      password: 'password123!',
      firstName: 'User',
      lastName: 'Test',
      phone: '+33612345679',
      role: UserRole.TRANSPORTEUR,
    }

    const user = await authService.register(userData, '127.0.0.1')

    assert.equal(user.email, 'user@test.com')
    assert.equal(user.role, 'transporteur')
    assert.equal(user.mfaEnabled, false)
    assert.equal(user.status, 'pending')
  })

  test('should prevent duplicate email registration', async ({ assert }) => {
    const userData = {
      email: 'duplicate@test.com',
      password: 'password123!',
      firstName: 'User',
      lastName: 'Test',
      phone: '+33612345680',
      role: UserRole.TRANSPORTEUR,
    }

    // First registration
    await authService.register(userData, '127.0.0.1')

    // Second registration should fail
    await assert.rejects(
      () => authService.register(userData, '127.0.0.1'),
      'Email already registered'
    )
  })

  test('should verify email and activate account', async ({ assert }) => {
    // Create test user
    const user = await User.create({
      email: 'verify@test.com',
      passwordHash: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      phone: '+33612345681',
      role: UserRole.TRANSPORTEUR,
      status: UserStatus.PENDING,
    })

    // Store verification token
    const token = 'test-verification-token'
    await cacheService.set(`email_verification:${user.id}`, token, 3600)

    // Verify email
    const result = await authService.verifyEmail(token)

    assert.isTrue(result.success)
    assert.equal(result.message, 'Email verified successfully')

    // Check user is now active
    await user.refresh()
    assert.equal(user.status, 'active')
    assert.exists(user.emailVerifiedAt)
  })

  test('should handle invalid verification token', async ({ assert }) => {
    const result = await authService.verifyEmail('invalid-token')

    assert.isFalse(result.success)
    assert.equal(result.message, 'Invalid or expired token')
  })
})
