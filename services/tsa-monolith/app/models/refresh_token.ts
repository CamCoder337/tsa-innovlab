import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import string from '@adonisjs/core/helpers/string'
import Hash from '@adonisjs/core/services/hash'

export default class RefreshToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare tokenHash: string

  @column()
  declare deviceInfo: Record<string, any> | null

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare revokedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  public static async generateFor(
    user: User,
    deviceInfo?: object
  ): Promise<{ token: string; refreshToken: RefreshToken }> {
    const plainToken = string.generateRandom(64)
    const tokenHash = await Hash.make(plainToken)

    const refreshToken = await RefreshToken.create({
      userId: user.id,
      tokenHash,
      deviceInfo,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    return {
      token: plainToken,
      refreshToken,
    }
  }

  // Clean up expired/revoked tokens
  public static async cleanup(): Promise<number> {
    const result = await this.query()
      .where((query) => {
        query.where('expires_at', '<=', DateTime.now().toSQL()).orWhereNotNull('revoked_at')
      })
      .delete()

    return result[0]
  }

  // Business Methods
  public isExpired(): boolean {
    return this.expiresAt <= DateTime.now()
  }

  public isRevoked(): boolean {
    return this.revokedAt !== null
  }

  public isValid(): boolean {
    return !this.isExpired() && !this.isRevoked()
  }

  public async verify(plainToken: string): Promise<boolean> {
    return Hash.verify(this.tokenHash, plainToken)
  }

  public async revoke(): Promise<void> {
    this.revokedAt = DateTime.now()
    await this.save()
  }

  public async rotate(): Promise<{ token: string; refreshToken: RefreshToken }> {
    // Revoke current token
    await this.revoke()

    // Generate new token
    const plainToken = string.generateRandom(64)
    const tokenHash = await Hash.make(plainToken)

    // Create new refresh token with same device info
    const newRefreshToken = await RefreshToken.create({
      userId: this.userId,
      tokenHash,
      deviceInfo: this.deviceInfo,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    return {
      token: plainToken,
      refreshToken: newRefreshToken,
    }
  }
}
