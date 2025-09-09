import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'
import User from '#models/user'

export default class StockMovement extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare productId: string

  @column()
  declare type: 'in' | 'out' | 'adjustment'

  @column()
  declare quantity: number

  @column()
  declare quantityBefore: number

  @column()
  declare quantityAfter: number

  @column()
  declare reason: string | null

  @column()
  declare referenceType: string | null

  @column()
  declare referenceId: string | null

  @column()
  declare createdBy: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => User)
  declare creator: BelongsTo<typeof User>
}
