import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Vehicle from '#models/vehicle'
import { KycStatus } from '#models/user_verification_status'

export default class VehicleVerificationStatus extends BaseModel {
  static table = 'vehicle_verification_status'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'vehicle_id' })
  declare vehicleId: string

  @column({ columnName: 'verification_status' })
  declare verificationStatus: KycStatus

  @column.dateTime({ columnName: 'verified_at' })
  declare verifiedAt: DateTime | null

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

  @column.date({ columnName: 'next_expiration_date' })
  declare nextExpirationDate: DateTime | null

  @column({ columnName: 'verification_notes' })
  declare verificationNotes: string | null

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Vehicle)
  declare vehicle: BelongsTo<typeof Vehicle>

  /**
   * Vérifie si la vérification du véhicule est complète
   */
  isComplete(): boolean {
    return this.verificationStatus === KycStatus.VALIDATED
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
   * Vérifie si une action est requise
   */
  needsAction(): boolean {
    return (
      this.verificationStatus === KycStatus.ACTION_REQUIRED ||
      this.verificationStatus === KycStatus.REJECTED ||
      this.verificationStatus === KycStatus.EXPIRED
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
   * Retourne le nombre de jours avant la prochaine expiration
   */
  daysUntilNextExpiration(): number | null {
    if (!this.nextExpirationDate) return null
    const diff = this.nextExpirationDate.diff(DateTime.now(), 'days')
    return Math.ceil(diff.days)
  }

  /**
   * Vérifie si un document expire bientôt (dans X jours ou moins)
   */
  hasExpiringDocuments(days: number = 30): boolean {
    const daysLeft = this.daysUntilNextExpiration()
    return daysLeft !== null && daysLeft <= days && daysLeft > 0
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
    return labels[this.verificationStatus] || this.verificationStatus
  }
}
