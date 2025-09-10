import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column, hasMany } from '@adonisjs/lucid/orm'
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
    // Only generate slug if it's empty or null
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

      // Ensure uniqueness in the database, excluding current category if updating
      try {
        let query = Category.query().where('slug', slug)
        if (category.id) {
          query = query.whereNot('id', category.id)
        }

        while (await query.first()) {
          slug = `${baseSlug}-${counter}`
          counter++
          query = Category.query().where('slug', slug)
          if (category.id) {
            query = query.whereNot('id', category.id)
          }
        }

        category.slug = slug
      } catch (error) {
        // If database query fails, use the base slug with timestamp as fallback
        category.slug = `${baseSlug}-${Date.now()}`
      }
    }
  }
}
