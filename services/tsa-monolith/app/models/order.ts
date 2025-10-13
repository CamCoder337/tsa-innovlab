import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Address from '#models/address'
import OrderItem from '#models/order_item'
import AuditLog from '#models/audit_log'

export enum OrderStatus {
  PENDING = 'pending', // En attente de paiement
  PAID = 'paid', // Payée
  PROCESSING = 'processing', // En cours de traitement
  SHIPPED = 'shipped', // Expédiée
  DELIVERED = 'delivered', // Livrée
  CANCELLED = 'cancelled', // Annulée
  REFUNDED = 'refunded', // Remboursée
}

export enum PaymentMethod {
  ORANGE_MONEY = 'orange_money',
  MTN_MOMO = 'mtn_momo',
  WAVE = 'wave',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
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
  declare userId: string

  @column()
  declare orderNumber: string // Numéro de commande unique (ex: ORD-20250101-0001)

  @column()
  declare status: OrderStatus

  @column()
  declare paymentMethod: PaymentMethod | null

  @column()
  declare paymentStatus: PaymentStatus

  @column()
  declare paymentReference: string | null // Référence de paiement externe

  @column()
  declare subtotal: string // Sous-total (produits uniquement)

  @column()
  declare shippingCost: string // Frais de livraison

  @column()
  declare tax: string // Taxes

  @column()
  declare total: string // Total final

  @column()
  declare shippingAddressId: string | null

  @column()
  declare billingAddressId: string | null

  @column()
  declare customerName: string

  @column()
  declare customerEmail: string

  @column()
  declare customerPhone: string

  @column()
  declare notes: string | null // Notes de la commande

  @column()
  declare trackingNumber: string | null // Numéro de suivi de livraison

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

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Address, {
    foreignKey: 'shippingAddressId',
  })
  declare shippingAddress: BelongsTo<typeof Address>

  @belongsTo(() => Address, {
    foreignKey: 'billingAddressId',
  })
  declare billingAddress: BelongsTo<typeof Address>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  /**
   * Générer un numéro de commande unique
   */
  static async generateOrderNumber(): Promise<string> {
    const now = DateTime.now()
    const dateStr = now.toFormat('yyyyMMdd')

    // Utiliser l'heure + millisecondes pour garantir l'unicité même lors d'appels rapides
    const timeStr = now.toFormat('HHmmssSSS') // HH:mm:ss.SSS
    const randomSuffix = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0')

    return `ORD-${dateStr}-${timeStr}${randomSuffix}`
  }

  /**
   * Mettre à jour le statut de la commande avec audit log
   */
  async updateStatus(newStatus: OrderStatus, userId: string): Promise<void> {
    const oldStatus = this.status

    this.status = newStatus

    // Mettre à jour les timestamps selon le statut
    switch (newStatus) {
      case OrderStatus.PAID:
        this.paidAt = DateTime.now()
        this.paymentStatus = PaymentStatus.COMPLETED
        break
      case OrderStatus.SHIPPED:
        this.shippedAt = DateTime.now()
        break
      case OrderStatus.DELIVERED:
        this.deliveredAt = DateTime.now()
        break
      case OrderStatus.CANCELLED:
        this.cancelledAt = DateTime.now()
        break
    }

    await this.save()

    // Audit log
    await AuditLog.create({
      action: 'order.status_update',
      entityType: 'orders',
      entityId: this.id,
      userId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
    })
  }
}
