import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_validation_history'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table
        .uuid('document_id')
        .notNullable()
        .references('id')
        .inTable('documents')
        .onDelete('CASCADE')

      table
        .specificType('action', 'document_validation_action')
        .notNullable()
        .comment('Action effectuée')

      table
        .specificType('previous_status', 'document_status')
        .nullable()
        .comment('Statut précédent')

      table.specificType('new_status', 'document_status').notNullable().comment('Nouveau statut')

      table
        .uuid('performed_by_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.text('reason').nullable().comment("Raison de l'action (validation/rejet)")
      table.jsonb('metadata').nullable().comment('Métadonnées contextuelles')

      table.specificType('ip_address', 'inet').nullable().comment('Adresse IP')
      table.text('user_agent').nullable().comment('User agent')

      table.timestamp('created_at', { useTz: true }).notNullable()

      // Indexes
      table.index(['document_id', 'created_at'])
      table.index('performed_by_id')
      table.index('created_at')
      table.index('action')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
