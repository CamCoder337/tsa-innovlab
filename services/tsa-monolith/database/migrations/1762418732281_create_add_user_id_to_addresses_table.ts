import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.index('user_id', 'addresses_user_id_index')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('user_id', 'addresses_user_id_index')
      table.dropColumn('user_id')
    })
  }
}
