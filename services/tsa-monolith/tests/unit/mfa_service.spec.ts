import { test } from '@japa/runner'
import MFAService from '#services/mfa_service'
import User from '#models/user'
import * as OTPAuth from 'otpauth'
import Database from '@adonisjs/lucid/services/db'

test.group('MFAService', (group) => {
  let mfaService: MFAService
  let testUser: User

  group.setup(async () => {
    await Database.beginGlobalTransaction()
    mfaService = new MFAService()
    
    // Create test user
    testUser = await User.create({
      email: 'mfa@test.com',
      passwordHash: 'hashedpassword',
      firstName: 'MFA',
      lastName: 'Test',
      phone: '+33612345682',
      role: 'admin',
      status: 'active'
    })
  })

  group.teardown(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should generate MFA secret and recovery codes', async ({ assert }) => {
    const mfaData = await mfaService.generateSecret(testUser)

    assert.exists(mfaData.secret)
    assert.exists(mfaData.manualEntryKey)
    assert.isArray(mfaData.recoveryCodes)
    assert.equal(mfaData.recoveryCodes.length, 10)
    
    // Check secret is base32
    assert.match(mfaData.secret, /^[A-Z2-7]+$/)
    
    // Check manual entry key is formatted
    assert.include(mfaData.manualEntryKey, ' ')
    
    // Refresh user to check MFA secret is stored
    await testUser.refresh()
    assert.exists(testUser.mfaSecret)
    assert.isFalse(testUser.mfaEnabled) // Should be false until verified
  })

  test('should verify TOTP token correctly', async ({ assert }) => {
    // Generate MFA secret
    const mfaData = await mfaService.generateSecret(testUser)
    
    // Create TOTP instance with same config
    const totp = new OTPAuth.TOTP({
      issuer: 'TSA Logistics',
      label: testUser.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: mfaData.secret,
    })

    // Generate current token
    const currentToken = totp.generate()
    
    // Verify token
    const isValid = await mfaService.verifyTOTP(testUser, currentToken)
    assert.isFalse(isValid) // Should be false because MFA not enabled yet
    
    // Enable MFA
    testUser.mfaEnabled = true
    await testUser.save()
    
    // Now verification should work
    const isValidEnabled = await mfaService.verifyTOTP(testUser, currentToken)
    assert.isTrue(isValidEnabled)
  })

  test('should verify and enable MFA for user', async ({ assert }) => {
    // Generate MFA secret
    const mfaData = await mfaService.generateSecret(testUser)
    
    // Create TOTP for current time
    const totp = new OTPAuth.TOTP({
      issuer: 'TSA Logistics',
      label: testUser.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: mfaData.secret,
    })

    const currentToken = totp.generate()
    
    // Verify and enable
    const result = await mfaService.verifyAndEnable(testUser, currentToken)
    
    assert.isTrue(result)
    
    // Check user MFA is now enabled
    await testUser.refresh()
    assert.isTrue(testUser.mfaEnabled)
  })

  test('should reject invalid TOTP token', async ({ assert }) => {
    // Generate MFA secret
    await mfaService.generateSecret(testUser)
    
    // Try with invalid token
    const result = await mfaService.verifyAndEnable(testUser, '000000')
    
    assert.isFalse(result)
    
    // Check user MFA is still disabled
    await testUser.refresh()
    assert.isFalse(testUser.mfaEnabled)
  })

  test('should disable MFA and clean up', async ({ assert }) => {
    // Setup MFA
    const mfaData = await mfaService.generateSecret(testUser)
    testUser.mfaEnabled = true
    testUser.mfaSecret = mfaData.secret
    await testUser.save()

    // Disable MFA
    await mfaService.disable(testUser)

    // Check cleanup
    await testUser.refresh()
    assert.isFalse(testUser.mfaEnabled)
    assert.isNull(testUser.mfaSecret)
  })
})