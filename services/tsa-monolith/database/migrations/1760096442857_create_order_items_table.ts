import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('order_id').references('id').inTable('orders').onDelete('CASCADE').notNullable()
      table
        .uuid('product_id')
        .references('id')
        .inTable('products')
        .onDelete('SET NULL')
        .nullable()

      table.string('product_name', 255).notNullable()
      table.string('product_reference', 100).nullable()
      table.integer('quantity').unsigned().notNullable()
      table.decimal('unit_price', 12, 2).notNullable()
      table.decimal('subtotal', 12, 2).notNullable()
      table.text('product_image_url').nullable()

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      table.index(['order_id'])
      table.index(['product_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
