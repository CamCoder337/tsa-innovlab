import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Mission from '#models/mission'
import User from '#models/user'
import Conversation from '#models/conversation'

export enum IssueType {
  BREAKDOWN = 'breakdown',
  DELAY = 'delay',
  ACCIDENT = 'accident',
  TRAFFIC = 'traffic',
  MEDICAL = 'medical',
  SECURITY = 'security',
  OTHER = 'other',
}

export enum IssueStatus {
  REPORTED = 'reported',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

export enum IssuePriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
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

  // Champs SOS/Urgence
  @column()
  declare isEmergency: boolean

  @column()
  declare emergencyConversationId: number | null

  @column()
  declare priority: IssuePriority

  @column.dateTime()
  declare firstResponseAt: DateTime | null

  @column()
  declare handledById: string | null

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

  @belongsTo(() => Conversation, { foreignKey: 'emergencyConversationId' })
  declare emergencyConversation: BelongsTo<typeof Conversation>

  @belongsTo(() => User, { foreignKey: 'handledById' })
  declare handledBy: BelongsTo<typeof User>

  // Helper pour déterminer si c'est une urgence critique
  get isCritical(): boolean {
    return this.isEmergency && [IssueType.ACCIDENT, IssueType.MEDICAL, IssueType.SECURITY].includes(this.type)
  }
}
