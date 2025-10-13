import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cart_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('cart_id').references('id').inTable('carts').onDelete('CASCADE').notNullable()
      table
        .uuid('product_id')
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
        .notNullable()
      table.integer('quantity').unsigned().notNullable().defaultTo(1)
      table.decimal('unit_price', 12, 2).notNullable()

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      table.unique(['cart_id', 'product_id']) // Un produit unique par panier
      table.index(['cart_id'])
      table.index(['product_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
