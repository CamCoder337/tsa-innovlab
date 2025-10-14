import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Mission from './mission.js'

export enum NotificationType {
  MISSION_NEW = 'mission_new', // Nouvelle mission disponible
  MISSION_ASSIGNED = 'mission_assigned', // Mission assignée à transporteur
  MISSION_STATUS_CHANGED = 'mission_status_changed', // Changement de statut mission
  MESSAGE_RECEIVED = 'message_received', // Nouveau message chat
  SYSTEM = 'system', // Notification système
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: string

  @column()
  declare type: NotificationType

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare priority: NotificationPriority

  @column()
  declare missionId: string | null

  @column()
  declare data: Record<string, any> | null

  @column()
  declare actionUrl: string | null

  @column.dateTime()
  declare readAt: DateTime | null

  @column()
  declare emailSent: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>

  // Helpers
  public get isRead(): boolean {
    return !!this.readAt
  }

  public get isUrgent(): boolean {
    return this.priority === NotificationPriority.URGENT
  }

  // Factory methods
  public static async createMissionNotification(
    userId: string,
    missionId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.NORMAL
  ): Promise<Notification> {
    return await Notification.create({
      userId,
      missionId,
      type,
      title,
      message,
      priority,
      emailSent: false,
    })
  }

  public static async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.NORMAL
  ): Promise<Notification> {
    return await Notification.create({
      userId,
      type: NotificationType.SYSTEM,
      title,
      message,
      priority,
      emailSent: false,
    })
  }

  public markAsRead(): void {
    this.readAt = DateTime.now()
  }

  // Serializer pour l'API
  public serialize() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      priority: this.priority,
      missionId: this.missionId,
      data: this.data,
      actionUrl: this.actionUrl,
      isRead: this.isRead,
      emailSent: this.emailSent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
