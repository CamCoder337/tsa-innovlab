import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Address extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string | null

  @column()
  declare label: string | null

  @column()
  declare street: string

  // Alias for street to support e-commerce tests
  get addressLine1(): string {
    return this.street
  }

  set addressLine1(value: string) {
    this.street = value
  }

  @column()
  declare city: string

  @column()
  declare region: string | null

  @column()
  declare country: string

  @column()
  declare postalCode: string | null

  @column()
  declare type: string | null // 'shipping', 'billing', 'logistics'

  @column()
  declare latitude: number | null

  @column()
  declare longitude: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
