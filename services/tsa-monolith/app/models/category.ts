import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare parentId: string | null

  @column()
  declare slug: string

  @column()
  declare imageUrl: string | null

  @column()
  declare isActive: boolean

  @column()
  declare displayOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  @beforeSave()
  public static async generateSlug(category: Category) {
    if (!category.slug || category.slug.trim() === '') {
      // Replace non-alphanumeric characters with dashes, lowercase
      let baseSlug = category.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .toLowerCase()
        .replace(/^-+|-+$/g, '')

      let slug = baseSlug
      let counter = 1

      // Ensure uniqueness in the database
      const existing = await Category.query().where('slug', slug).first()
      while (existing) {
        slug = `${baseSlug}-${counter}`
        counter++
      }

      category.slug = slug
    }
  }
}
