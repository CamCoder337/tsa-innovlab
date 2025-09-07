import User from '#models/user'
import RefreshToken from '#models/refresh_token'
import AccessToken from '#models/access_token'
import AuditLog from '#models/audit_log'
import Hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import CacheService from './cache_service.js'
import MFAService from './mfa_service.js'
import EmailService from './email_service.js'
import { Exception } from '@adonisjs/core/exceptions'
import { inject } from '@adonisjs/core'
import string from '@adonisjs/core/helpers/string'

export interface LoginCredentials {
  email: string
  password: string
  mfaCode?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export interface MFARequiredResponse {
  requiresMFA: boolean
  mfaSetupRequired?: boolean
  message: string
}

@inject()
export default class AuthService {
  constructor(
    private cacheService: CacheService,
    private mfaService: MFAService,
    private emailService: EmailService
  ) {}

  async login(
    credentials: LoginCredentials,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuthTokens | MFARequiredResponse> {
    const { email, password, mfaCode } = credentials

    // Find user with rate limiting check
    const rateLimitKey = `login:${email.toLowerCase()}`
    const { allowed } = await this.cacheService.checkRateLimit(rateLimitKey, 5, 900)

    if (!allowed) {
      throw new Exception('Too many login attempts', { status: 429 })
    }

    const user = await User.query().where('email', email.toLowerCase()).first()

    if (!user) {
      await this.logFailedLogin(email, ipAddress, userAgent)
      throw new Exception('Invalid credentials', { status: 401 })
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new Exception('Account is locked. Please try again later.', { status: 403 })
    }

    // Check if account is active
    if (!user.isActive()) {
      throw new Exception('Account is not active', { status: 403 })
    }

    // Verify password
    const isValidPassword = await Hash.verify(user.passwordHash, password)
    if (!isValidPassword) {
      await user.incrementFailedAttempts()
      await this.logFailedLogin(email, ipAddress, userAgent)
      throw new Exception('Invalid credentials', { status: 401 })
    }

    // Check MFA if required
    if (user.requiresMFA()) {
      if (!mfaCode) {
        // Si l'utilisateur doit configurer MFA mais ne l'a pas encore fait
        if (user.mustEnableMFA()) {
          return {
            requiresMFA: true,
            mfaSetupRequired: true,
            message: 'MFA setup required for admin accounts',
          }
        }

        // MFA requis mais pas fourni
        return {
          requiresMFA: true,
          mfaSetupRequired: false,
          message: 'MFA code required',
        }
      }

      // Vérifier le code MFA (TOTP ou recovery code)
      let isValidMFA = false

      if (user.mfaEnabled) {
        isValidMFA = await this.mfaService.verifyTOTP(user, mfaCode)

        // Si TOTP échoue, essayer avec les recovery codes
        if (!isValidMFA) {
          isValidMFA = await this.mfaService.verifyRecoveryCode(user, mfaCode)
        }
      }

      if (!isValidMFA) {
        await this.logFailedLogin(email, ipAddress, userAgent, 'Invalid MFA code')
        throw new Exception('Invalid MFA code', { status: 401 })
      }
    }

    // Reset failed attempts on successful login
    await user.resetFailedAttempts()

    // Generate tokens
    const tokens = await this.generateTokens(user)

    // Log successful login
    await AuditLog.logLogin(user, ipAddress)

    // Cache user session with Redis
    await this.cacheService.setUserSession(user.id, {
      userId: user.id,
      role: user.role,
      abilities: user.getAbilities(),
      lastActivity: DateTime.now().toISO(),
    })

    return tokens
  }

  async logout(userId: string, token: string): Promise<void> {
    // Revoke access token
    const accessToken = await AccessToken.query()
      .where('hash', await Hash.make(token))
      .first()

    if (accessToken) {
      await accessToken.revoke()
    }

    // Revoke all refresh tokens for this user
    await RefreshToken.query()
      .where('userId', userId)
      .whereNull('revokedAt')
      .update({ revokedAt: DateTime.now() })

    // Clear Redis cache
    await this.cacheService.clearUserSession(userId)
    await this.cacheService.blacklistToken(token)
  }

  async refreshTokens(refreshTokenString: string): Promise<AuthTokens> {
    // Check if refresh token is blacklisted
    const isBlacklisted = await this.cacheService.isTokenBlacklisted(refreshTokenString)
    if (isBlacklisted) {
      throw new Exception('Invalid refresh token', { status: 401 })
    }

    // Find and verify refresh token
    const refreshToken = await RefreshToken.query()
      .where('tokenHash', await Hash.make(refreshTokenString))
      .preload('user')
      .first()

    if (!refreshToken || !refreshToken.isValid()) {
      throw new Exception('Invalid or expired refresh token', { status: 401 })
    }

    // Rotate refresh token
    const { token: newRefreshToken } = await refreshToken.rotate()

    // Blacklist old refresh token
    await this.cacheService.blacklistToken(refreshTokenString)

    // Generate new access token
    const accessToken = await refreshToken.user.generateAccessToken()

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer',
    }
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    // Generate access token
    const accessToken = await user.generateAccessToken()

    // Generate refresh token
    const { token: refreshToken } = await RefreshToken.generateFor(user, {
      platform: 'web',
      lastActivity: DateTime.now().toISO(),
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer',
    }
  }

  private async logFailedLogin(
    email: string,
    ipAddress: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    await AuditLog.logFailedLogin(email, ipAddress, userAgent, reason)
  }

  async register(data: any, ipAddress: string): Promise<User> {
    // Check if email already exists
    const existingUser = await User.findBy('email', data.email.toLowerCase())
    if (existingUser) {
      throw new Exception('Email already registered', { status: 422 })
    }

    // Create user
    const { password, ...userData } = data
    const user = await User.create({
      ...userData,
      email: data.email.toLowerCase(),
      passwordHash: password,
      status: 'pending',
    })

    // Log registration
    await AuditLog.logUserRegistration(user, ipAddress)

    // Send verification email via queue Redis
    const verificationToken = string.generateRandom(32)
    await this.emailService.sendVerificationEmail(user, verificationToken)

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user)

    return user
  }

  /**
   * Initialise le MFA pour un utilisateur
   */
  async initializeMFA(user: User): Promise<{
    secret: string
    qrCode: string
    recoveryCodes: string[]
  }> {
    if (!user.requiresMFA()) {
      throw new Exception('MFA not required for this account', { status: 403 })
    }

    const mfaData = await this.mfaService.generateSecret(user)

    // Log MFA initialization
    await AuditLog.logMFAInitialization(user)

    return mfaData
  }

  /**
   * Active le MFA après vérification du premier code
   */
  async enableMFA(user: User, verificationCode: string): Promise<boolean> {
    const success = await this.mfaService.verifyAndEnable(user, verificationCode)

    if (success) {
      // Log MFA activation
      await AuditLog.logMFAEnabled(user)

      // Send notification email
      await this.emailService.sendMFAEnabledNotification(user)

      return true
    }

    return false
  }

  /**
   * Désactive le MFA
   */
  async disableMFA(user: User): Promise<void> {
    await this.mfaService.disable(user)

    // Log MFA deactivation
    await AuditLog.logMFADisabled(user)
  }

  /**
   * Génère de nouveaux codes de récupération
   */
  async regenerateRecoveryCodes(user: User): Promise<string[]> {
    const codes = await this.mfaService.regenerateRecoveryCodes(user)

    // Log recovery codes regeneration
    await AuditLog.logMFARecoveryCodesRegenerated(user)

    return codes
  }

  /**
   * Vérifie un code MFA (méthode publique)
   */
  async verifyMFACode(user: User, code: string): Promise<boolean> {
    return await this.mfaService.verifyTOTP(user, code)
  }
}
