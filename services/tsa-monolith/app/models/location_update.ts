import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Mission from '#models/mission'
import User from '#models/user'

export default class LocationUpdate extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare missionId: string

  @column()
  declare driverId: string | null

  @column()
  declare latitude: number

  @column()
  declare longitude: number

  @column()
  declare speed: number | null

  @column()
  declare heading: number | null

  @column()
  declare accuracy: number | null

  @column.dateTime({ autoCreate: true })
  declare timestamp: DateTime

  // Relations
  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>

  @belongsTo(() => User, { foreignKey: 'driverId' })
  declare driver: BelongsTo<typeof User>
}
