import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Categories extends BaseSchema {
  protected tableName = 'categories'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('name', 100).notNullable().unique()
      table.text('description')
      table.uuid('parent_id').references('id').inTable('categories').onDelete('CASCADE')
      table.string('slug', 100).notNullable().unique()
      table.text('image_url')
      table.boolean('is_active').defaultTo(true)
      table.integer('display_order').defaultTo(0)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
