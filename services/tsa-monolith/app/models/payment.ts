import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'

export enum PaymentMethod {
  MTN_MOBILE_MONEY = 'mtn_mobile_money',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare amount: number

  @column()
  declare method: PaymentMethod

  @column()
  declare status: PaymentStatus

  @column()
  declare transactionId: string | null

  @column()
  declare phoneNumber: string

  @column()
  declare metadata: any

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  /**
   * Vérifie si le paiement est complété
   */
  isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED
  }

  /**
   * Vérifie si le paiement est en attente
   */
  isPending(): boolean {
    return this.status === PaymentStatus.PENDING
  }

  /**
   * Vérifie si le paiement a échoué
   */
  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED
  }
}
