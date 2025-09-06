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

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'passwordHash',
})

export enum UserRole {
  ADMIN = 'admin',
  TRANSPORTEUR = 'transporteur',
  AFFRETEUR = 'affreteur',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare passwordHash: string

  @column()
  declare firstName: string | null

  @column()
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
}
