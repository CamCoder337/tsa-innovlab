import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export enum KycStatus {
  INCOMPLETE = 'incomplete',
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  ACTION_REQUIRED = 'action_required',
}

export default class UserVerificationStatus extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'user_id' })
  declare userId: string

  @column({ columnName: 'kyc_status' })
  declare kycStatus: KycStatus

  @column.dateTime({ columnName: 'kyc_completed_at' })
  declare kycCompletedAt: DateTime | null

  @column({ columnName: 'documents_required_count' })
  declare documentsRequiredCount: number

  @column({ columnName: 'documents_submitted_count' })
  declare documentsSubmittedCount: number

  @column({ columnName: 'documents_validated_count' })
  declare documentsValidatedCount: number

  @column({ columnName: 'documents_rejected_count' })
  declare documentsRejectedCount: number

  @column({ columnName: 'documents_expired_count' })
  declare documentsExpiredCount: number

  @column.dateTime({ columnName: 'last_document_submitted_at' })
  declare lastDocumentSubmittedAt: DateTime | null

  @column.dateTime({ columnName: 'last_document_validated_at' })
  declare lastDocumentValidatedAt: DateTime | null

  @column({ columnName: 'verification_notes' })
  declare verificationNotes: string | null

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Vérifie si la vérification KYC est complète
   */
  isComplete(): boolean {
    return this.kycStatus === KycStatus.VALIDATED
  }

  /**
   * Vérifie si des documents sont en attente de validation
   */
  hasPendingDocuments(): boolean {
    return (
      this.documentsSubmittedCount === this.documentsRequiredCount &&
      this.documentsValidatedCount < this.documentsRequiredCount
    )
  }

  /**
   * Calcule le pourcentage de complétion
   */
  getCompletionPercentage(): number {
    if (this.documentsRequiredCount === 0) return 0
    return Math.round((this.documentsValidatedCount / this.documentsRequiredCount) * 100)
  }

  /**
   * Vérifie si une action de l'utilisateur est requise
   */
  needsAction(): boolean {
    return (
      this.kycStatus === KycStatus.ACTION_REQUIRED ||
      this.kycStatus === KycStatus.REJECTED ||
      this.kycStatus === KycStatus.EXPIRED
    )
  }

  /**
   * Vérifie si tous les documents requis ont été soumis
   */
  allDocumentsSubmitted(): boolean {
    return this.documentsSubmittedCount >= this.documentsRequiredCount
  }

  /**
   * Retourne le nombre de documents manquants
   */
  getMissingDocumentsCount(): number {
    return Math.max(0, this.documentsRequiredCount - this.documentsSubmittedCount)
  }

  /**
   * Retourne une représentation lisible du statut
   */
  get statusLabel(): string {
    const labels = {
      [KycStatus.INCOMPLETE]: 'Incomplet',
      [KycStatus.PENDING]: 'En attente',
      [KycStatus.VALIDATED]: 'Validé',
      [KycStatus.REJECTED]: 'Rejeté',
      [KycStatus.EXPIRED]: 'Expiré',
      [KycStatus.ACTION_REQUIRED]: 'Action requise',
    }
    return labels[this.kycStatus] || this.kycStatus
  }
}
