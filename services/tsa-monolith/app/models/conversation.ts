import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Message from './message.js'
import User from './user.js'
import Mission from './mission.js'

export enum ConversationType {
  DIRECT = 'direct', // Chat privé entre 2 utilisateurs
  MISSION = 'mission', // Chat lié à une mission spécifique
}

export default class Conversation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: ConversationType

  @column({ columnName: 'user1_id' })
  declare user1Id: string // Premier participant

  @column({ columnName: 'user2_id' })
  declare user2Id: string // Deuxième participant

  @column({ columnName: 'mission_id' })
  declare missionId: string | null // Mission liée (optionnel)

  @column.dateTime({ columnName: 'last_activity_at' })
  declare lastActivityAt: DateTime

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @belongsTo(() => User, {
    foreignKey: 'user1Id',
  })
  declare user1: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'user2Id',
  })
  declare user2: BelongsTo<typeof User>

  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>

  // Factory methods
  public static async findOrCreateDirectConversation(
    user1Id: string,
    user2Id: string
  ): Promise<Conversation> {
    // Chercher conversation existante (dans les deux sens)
    let conversation = await Conversation.query()
      .where('type', ConversationType.DIRECT)
      .where((query) => {
        query
          .where((subQuery) => {
            subQuery.where('user1_id', user1Id).where('user2_id', user2Id)
          })
          .orWhere((subQuery) => {
            subQuery.where('user1_id', user2Id).where('user2_id', user1Id)
          })
      })
      .first()

    if (!conversation) {
      conversation = await Conversation.create({
        type: ConversationType.DIRECT,
        user1Id,
        user2Id,
        lastActivityAt: DateTime.now(),
      })
    }

    return conversation
  }

  public static async findOrCreateMissionConversation(
    missionId: string,
    user1Id: string,
    user2Id: string
  ): Promise<Conversation> {
    let conversation = await Conversation.query()
      .where('type', ConversationType.MISSION)
      .where('mission_id', missionId)
      .first()

    if (!conversation) {
      conversation = await Conversation.create({
        type: ConversationType.MISSION,
        user1Id,
        user2Id,
        missionId,
        lastActivityAt: DateTime.now(),
      })
    }

    return conversation
  }

  // Helpers
  public updateLastActivity(): void {
    this.lastActivityAt = DateTime.now()
  }

  public isParticipant(userId: string): boolean {
    return this.user1Id === userId || this.user2Id === userId
  }

  public getOtherParticipant(userId: string): string {
    return this.user1Id === userId ? this.user2Id : this.user1Id
  }

  public getParticipantIds(): string[] {
    return [this.user1Id, this.user2Id]
  }

  // Serializer pour l'API
  public serialize() {
    return {
      id: this.id,
      type: this.type,
      user1Id: this.user1Id,
      user2Id: this.user2Id,
      missionId: this.missionId,
      lastActivityAt: this.lastActivityAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
