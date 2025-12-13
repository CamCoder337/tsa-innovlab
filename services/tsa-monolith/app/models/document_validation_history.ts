import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Document, { DocumentStatus } from '#models/document'
import User from '#models/user'

export enum DocumentValidationAction {
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  REPLACED = 'replaced',
  RESUBMITTED = 'resubmitted',
  AUTO_EXPIRED = 'auto_expired',
}

export default class DocumentValidationHistory extends BaseModel {
  static table = 'document_validation_history'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'document_id' })
  declare documentId: string

  @column()
  declare action: DocumentValidationAction

  @column({ columnName: 'previous_status' })
  declare previousStatus: DocumentStatus | null

  @column({ columnName: 'new_status' })
  declare newStatus: DocumentStatus

  @column({ columnName: 'performed_by_id' })
  declare performedById: string | null

  @column()
  declare reason: string | null

  @column()
  declare metadata: Record<string, any> | null

  @column({ columnName: 'ip_address' })
  declare ipAddress: string | null

  @column({ columnName: 'user_agent' })
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => Document)
  declare document: BelongsTo<typeof Document>

  @belongsTo(() => User, { foreignKey: 'performedById' })
  declare performedBy: BelongsTo<typeof User>

  /**
   * Vérifie si l'action a été effectuée par le système (automatique)
   */
  isSystemAction(): boolean {
    return this.performedById === null
  }

  /**
   * Retourne une représentation lisible de l'action
   */
  get actionLabel(): string {
    const labels = {
      [DocumentValidationAction.VALIDATED]: 'Validé',
      [DocumentValidationAction.REJECTED]: 'Rejeté',
      [DocumentValidationAction.EXPIRED]: 'Expiré',
      [DocumentValidationAction.REPLACED]: 'Remplacé',
      [DocumentValidationAction.RESUBMITTED]: 'Resoumis',
      [DocumentValidationAction.AUTO_EXPIRED]: 'Expiré automatiquement',
    }
    return labels[this.action] || this.action
  }
}
