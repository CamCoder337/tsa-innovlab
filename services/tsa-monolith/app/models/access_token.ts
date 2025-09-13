import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Hash from '@adonisjs/core/services/hash'

export default class AccessToken extends BaseModel {
  public static active = scope((query) => {
    query.where((builder) => {
      builder.whereNull('expires_at').orWhere('expires_at', '>', DateTime.now().toSQL())
    })
  })
  public static expired = scope((query) => {
    query.where('expires_at', '<=', DateTime.now().toSQL())
  })
  @column({ isPrimary: true })
  declare id: string
  @column()
  declare tokenableType: string
  @column()
  declare tokenableId: string
  @column()
  declare type: string
  @column()
  declare name: string | null
  @column()
  declare hash: string
  @column()
  declare abilities: string[]
  @column.dateTime()
  declare lastUsedAt: DateTime | null
  @column.dateTime()
  declare expiresAt: DateTime | null
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  @belongsTo(() => User, { foreignKey: 'tokenableId' })
  declare user: BelongsTo<typeof User>

  // Clean up expired tokens
  public static async cleanup(): Promise<number> {
    const result = await this.query().where('expires_at', '<=', DateTime.now().toSQL()).delete()

    return result[0]
  }

  public isExpired(): boolean {
    if (!this.expiresAt) return false
    return this.expiresAt <= DateTime.utc()
  }

  public isValid(): boolean {
    return !this.isExpired()
  }

  public async verify(plainToken: string): Promise<boolean> {
    return Hash.verify(this.hash, plainToken)
  }

  public hasAbility(ability: string): boolean {
    return this.abilities.includes('*') || this.abilities.includes(ability)
  }

  public async touch(): Promise<void> {
    this.lastUsedAt = DateTime.now()
    await this.save()
  }

  public async revoke(): Promise<void> {
    this.expiresAt = DateTime.now()
    await this.save()
  }
}
