import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chatbot_metrics'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // User ID - avec contrainte FK
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()

      // User role
      table.string('user_role', 50).nullable()

      // Message length
      table.integer('message_length').nullable()

      // Intent détecté
      table.string('intent_name', 100).nullable().index()

      // Confidence score
      table.float('confidence').nullable()

      // Fonction appelée
      table.string('function_called', 100).nullable().index()

      // Temps de réponse (ms)
      table.float('response_time_ms').nullable()

      // Success
      table.boolean('success').defaultTo(true).index()

      // Requires human
      table.boolean('requires_human').defaultTo(false).index()

      // Error message
      table.text('error_message').nullable()

      // Timestamps
      table.timestamp('created_at').notNullable()

      // Index composites pour analytics
      table.index(['user_id', 'created_at'])
      table.index(['intent_name', 'success'])
      table.index(['function_called', 'success'])
      table.index(['created_at', 'success'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
