import { DateTime } from 'luxon'
import { BaseModel, beforeUpdate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import User from '#models/user'
import AuditLog from '#models/audit_log'
import { VehicleType } from '#models/vehicle'
import NotificationService from '#services/notification_service'
import logger from '@adonisjs/core/services/logger'

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

  @column()
  declare preferredVehicleType: VehicleType | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Category, {
    foreignKey: 'categoryId',
  })
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare creator: BelongsTo<typeof User>

  @beforeUpdate()
  public static async checkStockAlert(product: Product) {
    const oldStock = product.$original.stock

    // Trigger alert if stock is below or equal to alert threshold
    // Alert sent on every update when stock is low (no deduplication)
    if (product.stock <= product.stockAlert) {
      // Create audit log only when crossing the threshold for the first time
      if (oldStock > product.stockAlert) {
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

      // Notify all active administrators on every update when stock is low
      try {
        const admins = await User.query().where('role', 'admin').where('status', 'active')

        if (admins.length > 0) {
          const notificationService = new NotificationService()

          for (const admin of admins) {
            await notificationService.notify(admin, 'low_stock_alert', {
              productName: product.name,
              stockCurrent: product.stock,
              stockAlertThreshold: product.stockAlert,
              productId: product.id,
            })
          }

          logger.info(
            `Low stock alert sent to ${admins.length} admin(s) for product: ${product.name} (stock: ${product.stock}/${product.stockAlert})`
          )
        }
      } catch (error) {
        logger.error('Failed to send low stock notifications:', error)
      }
    }
  }
}
