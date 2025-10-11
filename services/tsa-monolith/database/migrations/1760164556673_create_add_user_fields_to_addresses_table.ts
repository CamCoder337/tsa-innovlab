import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add user_id for e-commerce user addresses (nullable for backward compatibility with logistics addresses)
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').nullable()

      // Add type to distinguish between address types (shipping, billing, logistics)
      table.string('type', 50).nullable() // 'shipping', 'billing', 'logistics', etc.

      // Add updated_at timestamp
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      table.index(['user_id'])
      table.index(['type'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['user_id'])
      table.dropIndex(['type'])
      table.dropColumn('user_id')
      table.dropColumn('type')
      table.dropColumn('updated_at')
    })
  }
}