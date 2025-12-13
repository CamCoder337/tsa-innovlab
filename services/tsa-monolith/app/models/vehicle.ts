import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Mission from '#models/mission'
import Document from '#models/document'
import VehicleVerificationStatus from '#models/vehicle_verification_status'

export enum VehicleType {
  TRUCK = 'truck', // Camion (poids lourd)
  VAN = 'van', // Camionnette/Fourgon
  MOTORCYCLE = 'motorcycle', // Moto/Scooter
  CAR = 'car', // Voiture
}

export enum VehicleStatus {
  AVAILABLE = 'available', // Disponible pour missions
  IN_MISSION = 'in_mission', // Actuellement en mission
  MAINTENANCE = 'maintenance', // En maintenance
  INACTIVE = 'inactive', // Inactif (retiré temporairement)
}

export default class Vehicle extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'user_id' })
  declare userId: string

  @column()
  declare type: VehicleType

  @column()
  declare registration: string

  @column()
  declare description: string | null

  @column()
  declare status: VehicleStatus

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Mission, { foreignKey: 'vehicleId' })
  declare missions: HasMany<typeof Mission>

  @hasMany(() => Document, { foreignKey: 'vehicleId' })
  declare documents: HasMany<typeof Document>

  @hasMany(() => VehicleVerificationStatus, { foreignKey: 'vehicleId' })
  declare verificationStatuses: HasMany<typeof VehicleVerificationStatus>

  /**
   * Vérifie si le véhicule est disponible pour une nouvelle mission
   */
  isAvailable(): boolean {
    return this.status === VehicleStatus.AVAILABLE
  }

  /**
   * Passe le véhicule en mission
   */
  async setInMission(): Promise<void> {
    this.status = VehicleStatus.IN_MISSION
    await this.save()
  }

  /**
   * Libère le véhicule (mission terminée)
   */
  async setAvailable(): Promise<void> {
    this.status = VehicleStatus.AVAILABLE
    await this.save()
  }

  /**
   * Retourne une représentation lisible du type de véhicule
   */
  get typeLabel(): string {
    const labels = {
      [VehicleType.TRUCK]: 'Camion',
      [VehicleType.VAN]: 'Camionnette',
      [VehicleType.MOTORCYCLE]: 'Moto',
      [VehicleType.CAR]: 'Voiture',
    }
    return labels[this.type] || this.type
  }

  /**
   * Retourne une représentation lisible du statut
   */
  get statusLabel(): string {
    const labels = {
      [VehicleStatus.AVAILABLE]: 'Disponible',
      [VehicleStatus.IN_MISSION]: 'En mission',
      [VehicleStatus.MAINTENANCE]: 'En maintenance',
      [VehicleStatus.INACTIVE]: 'Inactif',
    }
    return labels[this.status] || this.status
  }
}
