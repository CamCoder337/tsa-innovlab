import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chatbot_pending_actions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Conversation ID
      table.string('conversation_id', 255).notNullable().index()

      // Confirmation ID (unique)
      table.string('confirmation_id', 100).notNullable().unique()

      // Type d'action
      table.string('action_type', 100).notNullable()

      // Paramètres de l'action (JSON)
      table.json('params').notNullable()

      // Description pour l'utilisateur
      table.text('description').nullable()

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('expires_at').notNullable().index()

      // Index composites
      table.index(['conversation_id', 'expires_at'])
      table.index(['confirmation_id', 'expires_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
