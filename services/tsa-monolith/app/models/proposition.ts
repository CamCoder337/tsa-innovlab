import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Mission from '#models/mission'
import User from '#models/user'

export enum PropositionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export default class Proposition extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare missionId: string

  @column()
  declare transporteurId: string

  @column()
  declare prixPropose: number

  @column()
  declare delaiPropose: number

  @column()
  declare commentaire: string | null

  @column()
  declare status: PropositionStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>

  @belongsTo(() => User, { foreignKey: 'transporteurId' })
  declare transporteur: BelongsTo<typeof User>
}
