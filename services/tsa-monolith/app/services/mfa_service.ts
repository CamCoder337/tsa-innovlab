import User from '#models/user'
import MfaRecoveryCode from '#models/mfa_recovery_code'
import * as OTPAuth from 'otpauth'
import base32 from 'hi-base32'
import crypto from 'node:crypto'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export interface MfaSecretData {
  secret: string
  manualEntryKey: string
  recoveryCodes: string[]
}

export interface MfaVerificationResult {
  success: boolean
  message: string
}

export default class MFAService {
  private readonly issuer = 'TSA Logistics'
  private readonly algorithm = 'SHA1'
  private readonly digits = 6
  private readonly period = 30
  private readonly window = 5

  async generateSecret(user: User, trx?: TransactionClientContract): Promise<MfaSecretData> {
    // Generate random secret
    const buffer = crypto.randomBytes(20)
    const secret = base32.encode(buffer).replace(/=/g, '')

    // Format du secret pour saisie manuelle (groupes de 4, espaces)
    const manualEntryKey = secret.replace(/(.{4})/g, '$1 ').trim()

    // Generate recovery codes
    const recoveryCodes = await MfaRecoveryCode.generateCodesFor(user, 10, trx)

    // Store secret (should be encrypted in production)
    user.mfaSecret = secret
    user.mfaEnabled = false // Will be enabled after verification
    if (trx) {
      user.useTransaction(trx)
    }
    await user.save()

    return {
      secret,
      manualEntryKey,
      recoveryCodes,
    }
  }

  async verifyAndEnable(user: User, token: string): Promise<boolean> {
    if (!user.mfaSecret) {
      throw new Error('MFA secret not found')
    }

    const isValid = this.verifyToken(user.mfaSecret, token)

    if (isValid) {
      user.mfaEnabled = true
      await user.save()
      return true
    }

    return false
  }

  async verifyTOTP(user: User, token: string): Promise<boolean> {
    if (!user.mfaEnabled || !user.mfaSecret) {
      return false
    }

    return this.verifyToken(user.mfaSecret, token)
  }

  private verifyToken(secret: string, token: string): boolean {
    const totp = new OTPAuth.TOTP({
      issuer: this.issuer,
      label: '',
      algorithm: this.algorithm,
      digits: this.digits,
      period: this.period,
      secret: secret,
    })

    // Verify with time window
    const delta = totp.validate({ token, window: this.window })
    return delta !== null
  }

  async verifyRecoveryCode(user: User, code: string): Promise<boolean> {
    const recoveryCodes = await MfaRecoveryCode.query().where('userId', user.id).whereNull('usedAt')

    for (const recoveryCode of recoveryCodes) {
      if (await recoveryCode.verify(code)) {
        await recoveryCode.markAsUsed()
        return true
      }
    }

    return false
  }

  async disable(user: User): Promise<void> {
    user.mfaEnabled = false
    user.mfaSecret = null
    await user.save()

    // Delete all recovery codes
    await MfaRecoveryCode.query().where('userId', user.id).delete()
  }

  async regenerateRecoveryCodes(user: User): Promise<string[]> {
    if (!user.mfaEnabled) {
      throw new Error('MFA is not enabled')
    }

    return MfaRecoveryCode.generateCodesFor(user, 10)
  }
}
