import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CartItems extends BaseSchema {
  protected tableName = 'cart_items'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('cart_id').notNullable().references('id').inTable('carts').onDelete('CASCADE')
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.integer('quantity').notNullable().unsigned().checkPositive()
      table.decimal('price_at_add', 12, 2).notNullable().checkPositive()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      // Un produit ne peut être qu'une seule fois dans un panier
      table.unique(['cart_id', 'product_id'])
      table.index(['cart_id'])
      table.index(['product_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
