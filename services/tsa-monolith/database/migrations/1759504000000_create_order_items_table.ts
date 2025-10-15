import { BaseSchema } from '@adonisjs/lucid/schema'

export default class OrderItems extends BaseSchema {
  protected tableName = 'order_items'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('RESTRICT')
      table.string('product_name', 255).notNullable() // Snapshot du nom
      table.integer('quantity').notNullable().unsigned().checkPositive()
      table.decimal('unit_price', 12, 2).notNullable().checkPositive()
      table.decimal('total_price', 12, 2).notNullable().checkPositive()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      // Index pour recherches
      table.index(['order_id'])
      table.index(['product_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
