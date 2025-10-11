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
  declare unitPrice: string // Prix unitaire au moment de l'ajout au panier

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Cart, {
    foreignKey: 'cartId',
  })
  declare cart: BelongsTo<typeof Cart>

  @belongsTo(() => Product, {
    foreignKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>

  /**
   * Calculer le total de cet item (quantité × prix unitaire)
   */
  get total(): number {
    return this.quantity * Number.parseFloat(this.unitPrice)
  }
}
