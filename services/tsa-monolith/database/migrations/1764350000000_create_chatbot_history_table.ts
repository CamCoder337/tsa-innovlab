import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chatbot_history'

  async up() {
    // Vérifier si la table existe déjà (créée manuellement ou par une autre migration)
    const hasTable = await this.schema.hasTable(this.tableName)
    if (hasTable) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().index()
      table.string('role', 20).notNullable() // 'user' or 'assistant'
      table.text('content').notNullable()
      table.jsonb('metadata').nullable() // For function calls, etc.
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      // Index for efficient history retrieval
      table.index(['user_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
