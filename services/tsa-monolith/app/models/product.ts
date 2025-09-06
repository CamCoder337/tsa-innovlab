import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeUpdate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import User from '#models/user'
import AuditLog from '#models/audit_log'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare reference: string | null

  @column()
  declare price: number

  @column()
  declare stock: number

  @column()
  declare stockAlert: number

  @column()
  declare unit: string

  @column()
  declare imageUrl: string | null

  @column()
  declare images: any

  @column()
  declare specifications: any

  @column()
  declare isActive: boolean

  @column()
  declare categoryId: string | null

  @column()
  declare createdBy: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => User)
  declare creator: BelongsTo<typeof User>

  @beforeUpdate()
  public static async checkStockAlert(product: Product) {
    const oldStock = product.$original.stock

    // Trigger alert only if stock crossed the alert threshold
    if (product.stock <= product.stockAlert && oldStock > product.stockAlert) {
      await AuditLog.create({
        action: 'stock.low_alert',
        entityType: 'products',
        entityId: product.id,
        newValues: {
          productName: product.name,
          stockCurrent: product.stock,
          stockAlertThreshold: product.stockAlert,
        },
      })
    }
  }
}
