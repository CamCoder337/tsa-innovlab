import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class AuditLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string | null

  @column()
  declare action: string

  @column()
  declare entityType: string | null

  @column()
  declare entityId: string | null

  @column()
  declare oldValues: Record<string, any> | null

  @column()
  declare newValues: Record<string, any> | null

  @column()
  declare ipAddress: string | null

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  static async logLogin(user: User, ipAddress: string, userAgent?: string) {
    await this.create({
      userId: user.id,
      action: 'auth.login_success',
      ipAddress,
      userAgent: userAgent || null,
      newValues: {
        email: user.email,
        role: user.role,
        timestamp: DateTime.now().toISO(),
      },
    })
  }

  static async logFailedLogin(
    email: string,
    ipAddress: string,
    userAgent?: string,
    reason?: string
  ) {
    await this.create({
      action: 'auth.login_failed',
      ipAddress,
      userAgent: userAgent || null,
      newValues: {
        email,
        reason: reason || 'Invalid credentials',
        timestamp: DateTime.now().toISO(),
      },
    })
  }

  static async logLogout(user: User) {
    await this.create({
      userId: user.id,
      action: 'auth.logout',
      newValues: {
        email: user.email,
        timestamp: DateTime.now().toISO(),
      },
    })
  }

  static async logUserRegistration(user: User, ipAddress: string, options?: any) {
    await this.create({
      userId: user.id,
      action: 'auth.register',
      entityType: 'users',
      entityId: user.id,
      ipAddress,
      newValues: {
        email: user.email,
        role: user.role,
        status: user.status,
      },
    }, options)
  }

  static async logPasswordReset(user: User, ipAddress: string) {
    await this.create({
      userId: user.id,
      action: 'auth.password_reset',
      entityType: 'users',
      entityId: user.id,
      ipAddress,
      newValues: {
        email: user.email,
        timestamp: DateTime.now().toISO(),
      },
    })
  }

  static async logEmailVerification(user: User) {
    await this.create({
      userId: user.id,
      action: 'auth.email_verified',
      entityType: 'users',
      entityId: user.id,
      newValues: {
        email: user.email,
        verifiedAt: DateTime.now().toISO(),
      },
    })
  }

  static async logMFAInitialization(user: User) {
    await this.create({
      userId: user.id,
      action: 'mfa.initialized',
      entityType: 'users',
      entityId: user.id,
      newValues: {
        email: user.email,
        timestamp: DateTime.now().toISO(),
      },
    })
  }

  static async logMFAEnabled(user: User) {
    await this.create({
      userId: user.id,
      action: 'mfa.enabled',
      entityType: 'users',
      entityId: user.id,
      newValues: {
        email: user.email,
        timestamp: DateTime.now().toISO(),
      },
    })
  }

  static async logMFADisabled(user: User) {
    await this.create({
      userId: user.id,
      action: 'mfa.disabled',
      entityType: 'users',
      entityId: user.id,
      newValues: {
        email: user.email,
        timestamp: DateTime.now().toISO(),
      },
    })
  }

  static async logMFARecoveryCodesRegenerated(user: User) {
    await this.create({
      userId: user.id,
      action: 'mfa.recovery_codes_regenerated',
      entityType: 'users',
      entityId: user.id,
      newValues: {
        email: user.email,
        timestamp: DateTime.now().toISO(),
      },
    })
  }

  static async logAccountLocked(user: User, reason: string) {
    await this.create({
      userId: user.id,
      action: 'auth.account_locked',
      entityType: 'users',
      entityId: user.id,
      newValues: {
        email: user.email,
        reason,
        lockedUntil: user.lockedUntil?.toISO(),
        timestamp: DateTime.now().toISO(),
      },
    })
  }

  static async logAccountUnlocked(user: User) {
    await this.create({
      userId: user.id,
      action: 'auth.account_unlocked',
      entityType: 'users',
      entityId: user.id,
      newValues: {
        email: user.email,
        timestamp: DateTime.now().toISO(),
      },
    })
  }
}
