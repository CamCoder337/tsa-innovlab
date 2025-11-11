import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import OrderItem from '#models/order_item'
import Address from '#models/address'
import Payment from '#models/payment'

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderNumber: string

  @column()
  declare userId: string

  @column()
  declare status: OrderStatus

  @column()
  declare subtotal: number

  @column()
  declare shippingCost: number

  @column()
  declare tax: number

  @column()
  declare total: number

  @column()
  declare shippingAddressId: string

  @column()
  declare billingAddressId: string

  @column()
  declare paymentMethod: string

  @column()
  declare paymentStatus: PaymentStatus

  @column()
  declare paymentReference: string | null

  @column()
  declare customerName: string

  @column()
  declare customerEmail: string

  @column()
  declare customerPhone: string

  @column()
  declare trackingNumber: string | null

  @column()
  declare notes: string | null

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare shippedAt: DateTime | null

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @column.dateTime()
  declare cancelledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  @belongsTo(() => Address, {
    foreignKey: 'shippingAddressId',
  })
  declare shippingAddress: BelongsTo<typeof Address>

  @belongsTo(() => Address, {
    foreignKey: 'billingAddressId',
  })
  declare billingAddress: BelongsTo<typeof Address>

  @hasOne(() => Payment)
  declare payment: HasOne<typeof Payment>

  /**
   * Génère un numéro de commande unique avant création
   */
  @beforeCreate()
  static async generateOrderNumber(order: Order) {
    const now = DateTime.now()
    const year = now.year
    const month = String(now.month).padStart(2, '0')

    // Compter les commandes du mois en cours
    const result = await Order.query()
      .where('order_number', 'like', `ORD-${year}${month}%`)
      .count('* as total')

    // Extraire le count de manière sûre
    const total = result[0]?.$extras?.total || result[0]?.total || 0
    const sequence = String(Number(total) + 1).padStart(4, '0')
    order.orderNumber = `ORD-${year}${month}-${sequence}`
  }

  /**
   * Vérifie si la commande peut être annulée
   */
  canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.PAID].includes(this.status)
  }

  /**
   * Vérifie si la commande est payée
   */
  isPaid(): boolean {
    return this.paymentStatus === PaymentStatus.COMPLETED
  }
}
