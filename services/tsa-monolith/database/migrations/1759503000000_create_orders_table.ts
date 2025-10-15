import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Orders extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('order_number', 50).notNullable().unique()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .enum('status', ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'], {
          useNative: true,
          enumName: 'order_status',
        })
        .defaultTo('pending')
      table.decimal('total_amount', 12, 2).notNullable().checkPositive()
      table
        .uuid('shipping_address_id')
        .notNullable()
        .references('id')
        .inTable('addresses')
        .onDelete('RESTRICT')
      table
        .uuid('billing_address_id')
        .notNullable()
        .references('id')
        .inTable('addresses')
        .onDelete('RESTRICT')
      table.string('payment_method', 50).notNullable()
      table
        .enum('payment_status', ['pending', 'completed', 'failed', 'refunded'], {
          useNative: true,
          enumName: 'payment_status',
        })
        .defaultTo('pending')
      table.text('notes')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      // Index pour recherches fréquentes
      table.index(['user_id', 'status'])
      table.index(['order_number'])
      table.index(['payment_status'])
      table.index(['created_at'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
