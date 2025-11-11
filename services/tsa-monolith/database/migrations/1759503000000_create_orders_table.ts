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
      table.enum(
        'payment_method',
        [
          'orange_money',
          'mtn_mobile_money',
          'moov_money',
          'wave',
          'bank_transfer',
          'cash_on_delivery',
        ],
        {
          useNative: true,
          enumName: 'payment_method',
        }
      )
      table
        .enum('payment_status', ['pending', 'completed', 'failed', 'refunded'], {
          useNative: true,
          enumName: 'payment_status',
        })
        .defaultTo('pending')
      table.string('payment_reference', 100).nullable()
      table.decimal('subtotal', 12, 2).notNullable().checkPositive()
      table.decimal('shipping_cost', 12, 2).defaultTo(0)
      table.decimal('tax', 12, 2).defaultTo(0)
      table.decimal('total', 12, 2).notNullable().checkPositive()
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
      table.string('customer_name', 200).notNullable()
      table.string('customer_email', 200).notNullable()
      table.string('customer_phone', 20).notNullable()
      table.text('notes').nullable()
      table.string('tracking_number', 100).nullable()
      table.timestamp('paid_at', { useTz: true }).nullable()
      table.timestamp('shipped_at', { useTz: true }).nullable()
      table.timestamp('delivered_at', { useTz: true }).nullable()
      table.timestamp('cancelled_at', { useTz: true }).nullable()
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
