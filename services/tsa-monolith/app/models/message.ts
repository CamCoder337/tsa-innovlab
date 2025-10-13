import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Conversation from './conversation.js'
import Mission from './mission.js'

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
}

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare conversationId: number

  @column()
  declare senderId: string

  @column()
  declare missionId: string | null

  @column()
  declare content: string

  @column()
  declare type: MessageType

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Conversation)
  declare conversation: BelongsTo<typeof Conversation>

  @belongsTo(() => User, {
    foreignKey: 'senderId',
  })
  declare sender: BelongsTo<typeof User>

  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>

  // Helpers
  public get isRead(): boolean {
    return !!this.readAt
  }

  public markAsRead(): void {
    this.readAt = DateTime.now()
  }

  // Serializer pour l'API
  public serialize() {
    return {
      id: this.id,
      conversationId: this.conversationId,
      senderId: this.senderId,
      missionId: this.missionId,
      content: this.content,
      type: this.type,
      isRead: this.isRead,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Relations sérialisées conditionnellement
      sender: this.sender
        ? {
            id: this.sender.id,
            firstName: this.sender.firstName,
            lastName: this.sender.lastName,
            email: this.sender.email,
            role: this.sender.role,
          }
        : undefined,
    }
  }
}
