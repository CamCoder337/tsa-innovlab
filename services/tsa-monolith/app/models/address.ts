import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Address extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare label: string | null

  @column()
  declare street: string

  @column()
  declare city: string

  @column()
  declare region: string | null

  @column()
  declare country: string

  @column()
  declare postalCode: string | null

  @column()
  declare latitude: number | null

  @column()
  declare longitude: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
