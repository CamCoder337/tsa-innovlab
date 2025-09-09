import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import User from '#models/user'
import AccessToken from '#models/access_token'
import AuthService from '#services/auth_service'
import AuditLog from '#models/audit_log'
import Hash from '@adonisjs/core/services/hash'
import {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
  enableMFAValidator,
  verifyMFAValidator,
  changePasswordValidator,
  updateProfileValidator,
} from '#validators/auth_validator'

@inject()
export default class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Authentification utilisateur avec gestion MFA
   */
  async login({ request, response }: HttpContext) {
    const { email, password, mfaCode } = await request.validateUsing(loginValidator)
    const ipAddress = request.ip()
    const userAgent = request.header('user-agent')

    try {
      const result = await this.authService.login(
        { email, password, mfaCode },
        ipAddress,
        userAgent
      )

      // Si MFA requis mais pas fourni
      if ('requiresMFA' in result) {
        return response.status(202).json({
          success: false,
          requiresMFA: result.requiresMFA,
          mfaSetupRequired: result.mfaSetupRequired,
          message: result.message,
        })
      }

      // Login réussi avec tokens
      return response.json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          tokenType: result.tokenType,
        },
      })
    } catch (error) {
      return response.status(401).json({
        success: false,
        message: 'Authentication failed',
        errors: [error.message],
      })
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)
    const ipAddress = request.ip()

    try {
      const user = await this.authService.register(data, ipAddress)

      return response.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for verification.',
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Registration failed',
        errors: [error.message],
      })
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail({ request, response }: HttpContext) {
    try {
      const { token } = request.only(['token'])

      if (!token) {
        return response.badRequest({
          success: false,
          message: 'Verification token is required',
          errors: ['Token missing'],
        })
      }

      const result = await this.authService.verifyEmail(token)

      if (result.success) {
        return response.ok({
          success: true,
          message: result.message,
        })
      } else {
        return response.badRequest({
          success: false,
          message: result.message,
          errors: [result.message],
        })
      }
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Email verification failed',
        errors: [error.message],
      })
    }
  }

  /**
   * Déconnexion utilisateur
   */
  async logout({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      
      // Extraire le token pour le blacklister
      const authHeader = request.header('authorization')
      let token = authHeader?.replace('Bearer ', '')

      // Handle case where token already contains "Bearer"
      if (token?.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '')
      }

      if (!token) {
        return response.status(400).json({
          success: false,
          message: 'No authorization token provided',
        })
      }

      // Utiliser le service de logout pour blacklister le token
      await this.authService.logout(user.id, token)
      await AuditLog.logLogout(user)
      
      return response.json({
        success: true,
        message: 'Logout successful',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Logout failed',
        errors: [error.message],
      })
    }
  }

  /**
   * Debug token (pour test seulement)
   */
  async debugToken({ request, response }: HttpContext) {
    const authHeader = request.header('authorization')
    let token = authHeader?.replace('Bearer ', '')

    // Handle case where token already contains "Bearer"
    if (token?.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '')
    }

    if (!token || !authHeader) {
      return response.json({
        hasToken: false,
        authHeader: authHeader,
        token: token,
      })
    }

    // Check all access tokens
    const accessTokens = await AccessToken.query().preload('user')
    const results = []

    for (const at of accessTokens) {
      const isValid = await at.verify(token)
      results.push({
        id: at.id,
        tokenableId: at.tokenableId,
        isValid,
        isExpired: at.isExpired(),
        expiresAt: at.expiresAt?.toISO(),
        userId: at.user?.id,
        userEmail: at.user?.email,
      })
    }

    return response.json({
      hasToken: true,
      token: token.substring(0, 10) + '...',
      totalTokens: accessTokens.length,
      results,
    })
  }

  /**
   * Renouvellement des tokens
   */
  async refreshToken({ request, response }: HttpContext) {
    const { refreshToken } = await request.validateUsing(refreshTokenValidator)

    try {
      const tokens = await this.authService.refreshTokens(refreshToken)

      return response.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      })
    } catch (error) {
      return response.status(401).json({
        success: false,
        message: 'Token refresh failed',
        errors: [error.message],
      })
    }
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async forgotPassword({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)

    const user = await User.findBy('email', email)
    if (!user) {
      // Ne pas révéler si l'email existe ou pas
      return response.json({
        success: true,
        message: 'If the email exists, a reset link has been sent.',
      })
    }

    // Générer et envoyer le token de réinitialisation
    const resetToken = await user.generatePasswordResetToken()
    await user.sendPasswordResetNotification(resetToken)

    return response.json({
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    })
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)
    const ipAddress = request.ip()

    try {
      const user = await User.findByPasswordResetToken(token)
      if (!user || !user.isPasswordResetTokenValid(token)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        })
      }

      // Réinitialiser le mot de passe
      user.passwordHash = password
      user.clearPasswordResetToken()
      await user.save()

      // Log de l'audit
      await AuditLog.logPasswordReset(user, ipAddress)

      return response.json({
        success: true,
        message: 'Password reset successful',
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Password reset failed',
        errors: [error.message],
      })
    }
  }

  /**
   * Profil utilisateur actuel
   */
  async me({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      return response.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          mfaEnabled: user.mfaEnabled,
          mustEnableMFA: user.mustEnableMFA(),
          emailVerifiedAt: user.emailVerifiedAt?.toISO(),
          lastLoginAt: user.lastLoginAt?.toISO(),
          createdAt: user.createdAt.toISO(),
        },
      })
    } catch (error) {
      return response.status(401).json({
        success: false,
        message: 'Unauthorized access',
        errors: [error.message],
      })
    }
  }

  /**
   * Mise à jour du profil
   */
  async updateProfile({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(updateProfileValidator)

    user.merge(data)
    await user.save()

    return response.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        fullName: user.fullName,
      },
    })
  }

  /**
   * Changement de mot de passe
   */
  async changePassword({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { currentPassword, newPassword } = await request.validateUsing(changePasswordValidator)

    // Vérifier le mot de passe actuel
    const isValidPassword = await Hash.verify(user.passwordHash, currentPassword)
    if (!isValidPassword) {
      return response.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      })
    }

    // Mettre à jour le mot de passe
    user.passwordHash = newPassword
    await user.save()

    return response.json({
      success: true,
      message: 'Password changed successfully',
    })
  }

  // ===== MFA ENDPOINTS =====

  /**
   * Initialiser le MFA (générer QR code et codes de récupération)
   */
  async initializeMFA({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    try {
      const mfaData = await this.authService.initializeMFA(user)

      return response.json({
        success: true,
        message: 'MFA initialization successful',
        data: {
          secret: mfaData.secret,
          manualEntryKey: mfaData.manualEntryKey,
          recoveryCodes: mfaData.recoveryCodes,
          instructions: 'Enter the manual key in your authenticator app and verify with a code',
        },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  /**
   * Activer le MFA après vérification du premier code
   */
  async enableMFA({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { code } = await request.validateUsing(enableMFAValidator)

    try {
      const success = await this.authService.enableMFA(user, code)

      if (!success) {
        return response.status(400).json({
          success: false,
          message: 'Invalid verification code',
        })
      }

      return response.json({
        success: true,
        message: 'MFA enabled successfully',
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  /**
   * Désactiver le MFA
   */
  async disableMFA({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { code } = await request.validateUsing(verifyMFAValidator)

    // Vérifier le code MFA avant de désactiver
    const isValidCode = await this.authService.verifyMFACode(user, code)
    if (!isValidCode) {
      return response.status(400).json({
        success: false,
        message: 'Invalid MFA code',
      })
    }

    // Ne pas permettre de désactiver MFA pour les admins
    if (user.mustEnableMFA()) {
      return response.status(403).json({
        success: false,
        message: 'MFA cannot be disabled for admin accounts',
      })
    }

    await this.authService.disableMFA(user)

    return response.json({
      success: true,
      message: 'MFA disabled successfully',
    })
  }

  /**
   * Régénérer les codes de récupération MFA
   */
  async regenerateRecoveryCodes({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    try {
      const codes = await this.authService.regenerateRecoveryCodes(user)

      return response.json({
        success: true,
        message: 'Recovery codes regenerated successfully',
        data: {
          recoveryCodes: codes,
          warning: 'Store these codes securely. Your old recovery codes are now invalid.',
        },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  /**
   * Vérifier l'état MFA d'un utilisateur
   */
  async mfaStatus({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    return response.json({
      success: true,
      data: {
        mfaEnabled: user.mfaEnabled,
        mfaRequired: user.requiresMFA(),
        mustEnableMFA: user.mustEnableMFA(),
      },
    })
  }
}
