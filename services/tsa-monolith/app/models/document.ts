import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import DocumentType from '#models/document_type'
import User from '#models/user'
import Vehicle from '#models/vehicle'
import DocumentValidationHistory from '#models/document_validation_history'

export enum DocumentStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  REPLACED = 'replaced',
}

export default class Document extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  /**
   * Hook exécuté avant la création d'un document
   * Initialise la version à 1 si elle n'est pas définie
   */
  @beforeCreate()
  static assignVersion(document: Document) {
    if (!document.version) {
      document.version = 1
    }
  }

  @column({ columnName: 'document_type_id' })
  declare documentTypeId: string

  @column({ columnName: 'user_id' })
  declare userId: string

  @column({ columnName: 'vehicle_id' })
  declare vehicleId: string | null

  @column({ columnName: 'file_url' })
  declare fileUrl: string

  @column({ columnName: 'file_name' })
  declare fileName: string

  @column({ columnName: 'file_size_bytes' })
  declare fileSizeBytes: number

  @column({ columnName: 'mime_type' })
  declare mimeType: string

  @column()
  declare status: DocumentStatus

  @column({ columnName: 'rejection_reason' })
  declare rejectionReason: string | null

  @column({ columnName: 'validated_by_id' })
  declare validatedById: string | null

  @column.dateTime({ columnName: 'validated_at' })
  declare validatedAt: DateTime | null

  @column.date({ columnName: 'issue_date' })
  declare issueDate: DateTime | null

  @column.date({ columnName: 'expiration_date' })
  declare expirationDate: DateTime | null

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime | null

  @column.dateTime({ columnName: 'expiration_notified_at' })
  declare expirationNotifiedAt: DateTime | null

  @column()
  declare metadata: Record<string, any> | null

  @column()
  declare version: number

  @column({ columnName: 'replaced_by_id' })
  declare replacedById: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => DocumentType)
  declare documentType: BelongsTo<typeof DocumentType>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Vehicle)
  declare vehicle: BelongsTo<typeof Vehicle>

  @belongsTo(() => User, { foreignKey: 'validatedById' })
  declare validatedBy: BelongsTo<typeof User>

  @belongsTo(() => Document, { foreignKey: 'replacedById' })
  declare replacedBy: BelongsTo<typeof Document>

  @hasMany(() => DocumentValidationHistory)
  declare validationHistory: HasMany<typeof DocumentValidationHistory>

  /**
   * Vérifie si le document est en attente de validation
   */
  isPending(): boolean {
    return this.status === DocumentStatus.PENDING
  }

  /**
   * Vérifie si le document est validé
   */
  isValidated(): boolean {
    return this.status === DocumentStatus.VALIDATED
  }

  /**
   * Vérifie si le document est rejeté
   */
  isRejected(): boolean {
    return this.status === DocumentStatus.REJECTED
  }

  /**
   * Vérifie si le document est expiré
   */
  isExpired(): boolean {
    if (this.status === DocumentStatus.EXPIRED) return true
    if (!this.expirationDate) return false
    return this.expirationDate < DateTime.now()
  }

  /**
   * Vérifie si le document peut être validé
   */
  canBeValidated(): boolean {
    return this.status === DocumentStatus.PENDING
  }

  /**
   * Vérifie si le document peut être rejeté
   */
  canBeRejected(): boolean {
    return this.status === DocumentStatus.PENDING
  }

  /**
   * Retourne le nombre de jours avant expiration
   * Retourne null si le document n'a pas de date d'expiration
   */
  daysUntilExpiration(): number | null {
    if (!this.expirationDate) return null
    const diff = this.expirationDate.diff(DateTime.now(), 'days')
    return Math.ceil(diff.days)
  }

  /**
   * Vérifie si le document expire dans X jours ou moins
   */
  isExpiringWithinDays(days: number): boolean {
    const daysLeft = this.daysUntilExpiration()
    return daysLeft !== null && daysLeft <= days && daysLeft > 0
  }

  /**
   * Retourne une représentation lisible du statut
   */
  get statusLabel(): string {
    const labels = {
      [DocumentStatus.PENDING]: 'En attente',
      [DocumentStatus.VALIDATED]: 'Validé',
      [DocumentStatus.REJECTED]: 'Rejeté',
      [DocumentStatus.EXPIRED]: 'Expiré',
      [DocumentStatus.REPLACED]: 'Remplacé',
    }
    return labels[this.status] || this.status
  }

  /**
   * Retourne la taille du fichier en format lisible
   */
  get fileSizeFormatted(): string {
    const bytes = this.fileSizeBytes
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}
