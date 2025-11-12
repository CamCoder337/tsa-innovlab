import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chatbot_conversations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Conversation ID (pour grouper les messages)
      table.string('conversation_id', 255).notNullable().index()

      // User ID - avec contrainte FK
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()

      // Role (user ou bot)
      table.enum('role', ['user', 'bot']).notNullable()

      // Contenu du message
      table.text('content').notNullable()

      // Intent détecté (pour les messages bot)
      table.string('intent_name', 100).nullable().index()

      // Entités extraites (JSON)
      table.json('entities').nullable()

      // Actions de navigation (JSON)
      table.json('actions').nullable()

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Index composites pour performance
      table.index(['conversation_id', 'created_at'])
      table.index(['user_id', 'created_at'])
      table.index(['intent_name', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
