import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL')
      table.string('order_number', 50).unique().notNullable()

      table
        .enum(
          'status',
          ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
          {
            useNative: true,
            enumName: 'order_status',
          }
        )
        .defaultTo('pending')

      table
        .enum(
          'payment_method',
          ['orange_money', 'mtn_momo', 'wave', 'bank_transfer', 'cash_on_delivery'],
          {
            useNative: true,
            enumName: 'payment_method',
          }
        )
        .nullable()

      table
        .enum('payment_status', ['pending', 'completed', 'failed', 'refunded'], {
          useNative: true,
          enumName: 'payment_status',
        })
        .defaultTo('pending')

      table.string('payment_reference', 100).nullable()

      table.decimal('subtotal', 12, 2).notNullable()
      table.decimal('shipping_cost', 12, 2).defaultTo(0)
      table.decimal('tax', 12, 2).defaultTo(0)
      table.decimal('total', 12, 2).notNullable()

      table.uuid('shipping_address_id').references('id').inTable('addresses').nullable()
      table.uuid('billing_address_id').references('id').inTable('addresses').nullable()

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

      table.index(['user_id'])
      table.index(['order_number'])
      table.index(['status'])
      table.index(['payment_status'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
