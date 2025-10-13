import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import CartItem from '#models/cart_item'

export default class Cart extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare status: 'active' | 'abandoned' | 'converted'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => CartItem)
  declare items: HasMany<typeof CartItem>

  /**
   * Calculer le total du panier
   */
  async calculateTotal(): Promise<number> {
    // @ts-expect-error - Lucid ORM type inference issue with load method
    await this.load('items')

    return this.items.reduce((total, item) => {
      return total + item.quantity * Number.parseFloat(item.unitPrice)
    }, 0)
  }

  /**
   * Nombre total d'items dans le panier
   */
  async getTotalItems(): Promise<number> {
    // @ts-expect-error - Lucid ORM type inference issue with load method
    await this.load('items')
    return this.items.reduce((total, item) => total + item.quantity, 0)
  }
}
