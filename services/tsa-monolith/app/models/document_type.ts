import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Document from '#models/document'

export enum DocumentApplicableTo {
  USER = 'user',
  VEHICLE = 'vehicle',
}

export default class DocumentType extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column({ columnName: 'label_fr' })
  declare labelFr: string

  @column({ columnName: 'label_en' })
  declare labelEn: string

  @column()
  declare description: string | null

  @column({ columnName: 'applicable_to' })
  declare applicableTo: DocumentApplicableTo

  @column({ columnName: 'required_for_roles' })
  declare requiredForRoles: string[] | null

  @column({ columnName: 'required_for_vehicle_types' })
  declare requiredForVehicleTypes: string[] | null

  @column({ columnName: 'has_expiration' })
  declare hasExpiration: boolean

  @column({ columnName: 'default_validity_days' })
  declare defaultValidityDays: number | null

  @column({ columnName: 'file_format_restrictions' })
  declare fileFormatRestrictions: Record<string, any> | null

  @column({ columnName: 'validation_rules' })
  declare validationRules: Record<string, any> | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'display_order' })
  declare displayOrder: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => Document)
  declare documents: HasMany<typeof Document>

  /**
   * Vérifie si ce type de document est requis pour un rôle donné
   */
  isRequiredForRole(role: string): boolean {
    return this.requiredForRoles?.includes(role) ?? false
  }

  /**
   * Vérifie si ce type de document est requis pour un type de véhicule donné
   */
  isRequiredForVehicleType(vehicleType: string): boolean {
    return this.requiredForVehicleTypes?.includes(vehicleType) ?? false
  }

  /**
   * Retourne les formats de fichiers autorisés
   */
  getAllowedFormats(): string[] {
    return (this.fileFormatRestrictions?.allowed as string[]) ?? []
  }

  /**
   * Retourne la taille maximale de fichier en MB
   */
  getMaxFileSizeMB(): number {
    return (this.fileFormatRestrictions?.max_size_mb as number) ?? 5
  }

  /**
   * Retourne le libellé dans la langue spécifiée
   */
  getLabel(lang: 'fr' | 'en' = 'fr'): string {
    return lang === 'fr' ? this.labelFr : this.labelEn
  }
}
