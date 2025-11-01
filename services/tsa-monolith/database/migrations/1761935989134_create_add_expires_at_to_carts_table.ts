import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'carts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('expires_at', { useTz: true }).notNullable().defaultTo(this.raw("NOW() + INTERVAL '7 days'"))
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('expires_at')
    })
  }
}