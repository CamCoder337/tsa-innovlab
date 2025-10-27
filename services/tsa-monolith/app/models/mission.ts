import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Address from '#models/address'
import Vehicle from '#models/vehicle'
import Feedback from '#models/feedback'
import MissionUpdate from '#models/mission_update'
import { VehicleType } from '#models/vehicle'

export enum MissionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export default class Mission extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare affreteurId: string

  @column()
  declare transporteurId: string | null

  @column()
  declare vehicleId: string | null

  @column()
  declare requiredVehicleType: VehicleType | null

  @column({ columnName: 'titre' })
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare typeMarchandise: string | null

  @column()
  declare poids: number | null

  @column()
  declare volume: number | null

  @column.dateTime()
  declare dateDepartEstime: DateTime | null

  @column.dateTime()
  declare dateArriveePrevue: DateTime | null

  @column()
  declare adresseDepartId: string | null

  @column()
  declare adresseArriveeId: string | null

  @column()
  declare budgetMin: number | null

  @column()
  declare budgetMax: number | null

  @column()
  declare status: MissionStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, { foreignKey: 'affreteurId' })
  declare affreteur: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'transporteurId' })
  declare transporteur: BelongsTo<typeof User>

  @belongsTo(() => Address, { foreignKey: 'adresseDepartId' })
  declare adresseDepart: BelongsTo<typeof Address>

  @belongsTo(() => Address, { foreignKey: 'adresseArriveeId' })
  declare adresseArrivee: BelongsTo<typeof Address>

  @belongsTo(() => Vehicle, { foreignKey: 'vehicleId' })
  declare vehicle: BelongsTo<typeof Vehicle>

  @hasOne(() => Feedback)
  declare feedback: HasOne<typeof Feedback>

  @hasMany(() => MissionUpdate)
  declare updates: HasMany<typeof MissionUpdate>

  public getBudgetRange(): string {
    if (this.budgetMin && this.budgetMax) {
      return `${this.budgetMin.toLocaleString('fr-FR')} - ${this.budgetMax.toLocaleString('fr-FR')} FCFA`
    } else if (this.budgetMin) {
      return `${this.budgetMin.toLocaleString('fr-FR')} FCFA`
    } else if (this.budgetMax) {
      return `Jusqu'à ${this.budgetMax.toLocaleString('fr-FR')} FCFA`
    } else {
      return 'Non spécifié'
    }
  }
}
