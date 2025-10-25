import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Mission from '#models/mission'
import User from '#models/user'

/**
 * Modèle Feedback pour les notations des transporteurs par les affreteurs
 * après la complétion d'une mission
 */
export default class Feedback extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare missionId: string

  @column()
  declare affreteurId: string

  @column()
  declare transporteurId: string

  @column()
  declare rating: number

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>

  @belongsTo(() => User, { foreignKey: 'affreteurId' })
  declare affreteur: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'transporteurId' })
  declare transporteur: BelongsTo<typeof User>

  /**
   * Retourne l'évaluation en étoiles
   */
  getStars(): string {
    return '⭐'.repeat(this.rating)
  }

  /**
   * Vérifie si le feedback est positif (>= 4 étoiles)
   */
  isPositive(): boolean {
    return this.rating >= 4
  }
}
