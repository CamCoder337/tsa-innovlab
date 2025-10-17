import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Mission from '#models/mission'
import User from '#models/user'

/**
 * @deprecated Ce modèle est déprécié et ne doit plus être utilisé.
 * Le nouveau workflow utilise une assignation directe du transporteur à la mission.
 * Conservé uniquement pour la compatibilité avec les données historiques.
 * Utilisez le système de Feedback pour noter les transporteurs après la complétion des missions.
 */

export enum PropositionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

/**
 * @deprecated Utilisez l'assignation directe via Mission.transporteurId au lieu de Proposition
 */
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
