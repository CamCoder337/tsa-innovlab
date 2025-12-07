import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Mission from '#models/mission'
import User from '#models/user'

export enum IssueType {
  BREAKDOWN = 'breakdown',
  DELAY = 'delay',
  ACCIDENT = 'accident',
  TRAFFIC = 'traffic',
  OTHER = 'other',
}

export enum IssueStatus {
  REPORTED = 'reported',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

export default class MissionIssue extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare missionId: string

  @column()
  declare reportedById: string

  @column()
  declare type: IssueType

  @column()
  declare description: string

  @column()
  declare photos: string[] | null

  @column()
  declare latitude: number | null

  @column()
  declare longitude: number | null

  @column()
  declare status: IssueStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare resolvedAt: DateTime | null

  // Relations
  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>

  @belongsTo(() => User, { foreignKey: 'reportedById' })
  declare reportedBy: BelongsTo<typeof User>
}
