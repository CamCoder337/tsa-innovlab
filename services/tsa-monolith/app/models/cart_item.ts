import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Cart from '#models/cart'
import Product from '#models/product'

export default class CartItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare cartId: string

  @column()
  declare productId: string

  @column()
  declare quantity: number

  @column()
  declare priceAtAdd: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Cart, {
    foreignKey: 'cartId',
  })
  declare cart: BelongsTo<typeof Cart>

  @belongsTo(() => Product, {
    foreignKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>

  /**
   * Calcule le sous-total de cet article
   */
  getSubtotal(): number {
    return this.priceAtAdd * this.quantity
  }
}
