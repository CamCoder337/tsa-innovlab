import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Payments extends BaseSchema {
  protected tableName = 'payments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table
        .uuid('order_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
      table.decimal('amount', 12, 2).notNullable().checkPositive()
      table.string('method', 50).notNullable()
      table
        .enum('status', ['pending', 'completed', 'failed', 'refunded'], {
          useNative: true,
          enumName: 'payment_status_enum',
        })
        .defaultTo('pending')
      table.string('transaction_id', 255)
      table.string('phone_number', 20).notNullable()
      table.jsonb('metadata').defaultTo('{}')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      // Index pour recherches
      table.index(['order_id'])
      table.index(['transaction_id'])
      table.index(['status'])
      table.index(['phone_number'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
