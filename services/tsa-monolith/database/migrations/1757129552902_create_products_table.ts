import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Products extends BaseSchema {
  protected tableName = 'products'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL')
      table.string('name', 255).notNullable()
      table.text('description')
      table.string('reference', 100).unique()
      table.decimal('price', 12, 2).notNullable().checkPositive()
      table.integer('stock').defaultTo(0).checkPositive()
      table.integer('stock_alert').defaultTo(5)
      table.string('unit', 20).defaultTo('piece')
      table.text('image_url')
      table.jsonb('images').defaultTo('[]')
      table.jsonb('specifications').defaultTo('{}')
      table.boolean('is_active').defaultTo(true)
      table.uuid('created_by').references('id').inTable('users')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
