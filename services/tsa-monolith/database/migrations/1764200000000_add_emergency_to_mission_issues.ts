import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_issues'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Flag pour identifier les urgences SOS
      table.boolean('is_emergency').defaultTo(false).notNullable()
      
      // ID de la conversation d'urgence créée automatiquement
      table.integer('emergency_conversation_id').unsigned().nullable()
        .references('id').inTable('conversations').onDelete('SET NULL')
      
      // Priorité de l'urgence (1 = critique, 2 = haute, 3 = normale)
      table.integer('priority').defaultTo(3).notNullable()
      
      // Timestamp de la première réponse admin
      table.timestamp('first_response_at').nullable()
      
      // ID de l'admin qui a pris en charge
      table.uuid('handled_by_id').nullable()
        .references('id').inTable('users').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_emergency')
      table.dropColumn('emergency_conversation_id')
      table.dropColumn('priority')
      table.dropColumn('first_response_at')
      table.dropColumn('handled_by_id')
    })
  }
}
