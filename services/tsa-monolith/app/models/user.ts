import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import AccessToken from '#models/access_token'
import RefreshToken from '#models/refresh_token'
import Mission from '#models/mission'
import Proposition from '#models/proposition'
import AuditLog from '#models/audit_log'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import string from '@adonisjs/core/helpers/string'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'passwordHash',
})

export enum UserRole {
  ADMIN = 'admin',
  TRANSPORTEUR = 'transporteur',
  AFFRETEUR = 'affreteur',
  CLIENT = 'client',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export default class User extends compose(BaseModel, AuthFinder) {
  // Provider AdonisJS pour nos tables existantes
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    table: 'access_tokens',
  })
  @column({ isPrimary: true })
  declare id: string
  @column()
  declare email: string
  @column({ serializeAs: null, columnName: 'password_hash' })
  declare passwordHash: string
  @column({ columnName: 'first_name' })
  declare firstName: string | null

  @column({ columnName: 'last_name' })
  declare lastName: string | null

  @column()
  declare phone: string | null

  @column()
  declare role: UserRole

  @column()
  declare status: UserStatus

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column()
  declare mfaEnabled: boolean

  @column({ serializeAs: null })
  declare mfaSecret: string | null

  @column.dateTime()
  declare lastLoginAt: DateTime | null

  @column()
  declare failedLoginAttempts: number

  @column.dateTime()
  declare lockedUntil: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => AccessToken)
  declare accessTokens: HasMany<typeof AccessToken>
  @hasMany(() => RefreshToken)
  declare refreshTokens: HasMany<typeof RefreshToken>
  @hasMany(() => Mission, { foreignKey: 'affreteurId' })
  declare missions: HasMany<typeof Mission>
  @hasMany(() => Proposition, { foreignKey: 'transporteurId' })
  declare propositions: HasMany<typeof Proposition>
  @hasMany(() => AuditLog)
  declare auditLogs: HasMany<typeof AuditLog>

  get fullName(): string {
    return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim()
  }

  /**
   * Trouve un utilisateur par token de reset password
   */
  static async findByPasswordResetToken(token: string): Promise<User | null> {
    const { default: CacheService } = await import('#services/cache_service')
    const cacheService = new CacheService()

    // Chercher tous les tokens de reset actifs
    const keys = await cacheService.getKeys('password_reset:*')

    for (const key of keys) {
      const storedToken = await cacheService.get(key)
      if (storedToken === token) {
        const userId = key.replace('password_reset:', '')
        return await User.find(userId)
      }
    }

    return null
  }

  requiresMFA(): boolean {
    // MFA obligatoire pour les administrateurs
    const rolesRequiringMFA = [UserRole.ADMIN]
    return this.mfaEnabled || rolesRequiringMFA.includes(this.role)
  }

  /**
   * Génère un access token pour l'utilisateur avec les abilities appropriées
   * Utilise le provider AdonisJS avec notre table access_tokens (abilities en JSONB)
   */
  async generateAccessToken(name = 'access_token'): Promise<string> {
    const abilities = this.getAbilities()

    // Utiliser le provider AdonisJS avec nos tables
    const token = await User.accessTokens.create(this, abilities, {
      name,
      expiresIn: '15 minutes',
    })

    return token.value!.release()
  }

  /**
   * Méthode attendue par AdonisJS Auth pour les notifications de reset password
   */
  async sendPasswordResetNotification(token: string): Promise<void> {
    // Cette méthode sera appelée par le système d'auth d'AdonisJS
    // On utilise notre EmailService via l'IoC container
    const { default: EmailService } = await import('#services/email_service')
    const { default: ResendService } = await import('#services/resend_service')
    const resendService = new ResendService()
    const emailService = new EmailService(resendService)

    await emailService.sendPasswordResetEmail(this, token)
  }

  /**
   * Vérifie si l'utilisateur peut effectuer une action donnée
   */
  can(ability: string): boolean {
    const abilities = this.getAbilities()
    return abilities.includes('*') || abilities.includes(ability)
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: UserRole): boolean {
    return this.role === role
  }

  /**
   * Méthode utilitaire pour forcer l'activation MFA (admins)
   */
  mustEnableMFA(): boolean {
    return this.role === UserRole.ADMIN && !this.mfaEnabled
  }

  /**
   * Génère un token de réinitialisation de mot de passe
   */
  async generatePasswordResetToken(): Promise<string> {
    const token = string.generateRandom(32)
    // Dans une vraie app, stocker ce token avec expiration en DB
    // Pour l'instant on utilise le cache
    const { default: CacheService } = await import('#services/cache_service')
    const cacheService = new CacheService()

    await cacheService.set(`password_reset:${this.id}`, token, 3600) // 1 heure
    return token
  }

  /**
   * Vérifie si le token de reset password est valide
   */
  async isPasswordResetTokenValid(token: string): Promise<boolean> {
    const { default: CacheService } = await import('#services/cache_service')
    const cacheService = new CacheService()

    const storedToken = await cacheService.get(`password_reset:${this.id}`)
    return storedToken === token
  }

  /**
   * Supprime le token de reset password
   */
  async clearPasswordResetToken(): Promise<void> {
    const { default: CacheService } = await import('#services/cache_service')
    const cacheService = new CacheService()

    await cacheService.delete(`password_reset:${this.id}`)
  }

  async incrementFailedAttempts(maxAttempts: number = 5, lockDurationMinutes: number = 30) {
    this.failedLoginAttempts += 1

    if (this.failedLoginAttempts >= maxAttempts) {
      const now = DateTime.now()
      this.lockedUntil = now.plus({ minutes: lockDurationMinutes })
    }

    await this.save()
  }

  async resetFailedAttempts() {
    this.failedLoginAttempts = 0
    this.lockedUntil = null
    await this.save()
  }

  isLocked(): boolean {
    return !!this.lockedUntil && this.lockedUntil > DateTime.now()
  }

  isActive(): boolean {
    return (
      this.status === UserStatus.ACTIVE && (!this.lockedUntil || this.lockedUntil <= DateTime.now())
    )
  }

  getAbilities(): string[] {
    const roleAbilities = {
      admin: ['manage_users', 'view_reports', 'edit_settings'],
      transporteur: [
        'view_missions',
        'update_status',
        'shop',
        'manage_cart',
        'place_orders',
        'view_orders',
      ],
      affreteur: [
        'create_mission',
        'view_status',
        'shop',
        'manage_cart',
        'place_orders',
        'view_orders',
      ],
      client: ['shop', 'manage_cart', 'place_orders', 'view_orders'],
    }

    return roleAbilities[this.role] || []
  }
}
