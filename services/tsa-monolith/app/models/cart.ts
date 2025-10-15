import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import CartItem from '#models/cart_item'

export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  CONVERTED = 'converted',
}

export default class Cart extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare status: CartStatus

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => CartItem)
  declare items: HasMany<typeof CartItem>

  /**
   * Vérifie si le panier a expiré
   */
  isExpired(): boolean {
    return this.expiresAt < DateTime.now()
  }

  /**
   * Calcule le total du panier
   */
  async getTotal(): Promise<number> {
    const cart = await Cart.query().where('id', this.id).preload('items').firstOrFail()

    return cart.items.reduce((total, item) => total + item.priceAtAdd * item.quantity, 0)
  }

  /**
   * Nombre total d'articles dans le panier
   */
  async getItemCount(): Promise<number> {
    const cart = await Cart.query().where('id', this.id).preload('items').firstOrFail()

    return cart.items.reduce((count, item) => count + item.quantity, 0)
  }
}
