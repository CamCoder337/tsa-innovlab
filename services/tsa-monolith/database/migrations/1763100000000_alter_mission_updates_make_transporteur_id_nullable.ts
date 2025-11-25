import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_updates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('transporteur_id').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('transporteur_id').notNullable().alter()
    })
  }
}
