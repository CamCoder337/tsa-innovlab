import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'
import Product from '#models/product'

export default class OrderItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare productId: string

  @column()
  declare productName: string // Nom du produit au moment de la commande

  @column()
  declare productReference: string | null // Référence du produit

  @column()
  declare quantity: number

  @column()
  declare unitPrice: string // Prix unitaire au moment de la commande

  @column()
  declare subtotal: string // Sous-total (quantity × unitPrice)

  @column()
  declare productImageUrl: string | null // Image du produit au moment de la commande

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Product, {
    foreignKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>
}
