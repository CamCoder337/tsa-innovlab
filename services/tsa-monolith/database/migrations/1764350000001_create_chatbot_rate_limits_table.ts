import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chatbot_rate_limits'

  async up() {
    // Vérifier si la table existe déjà
    const hasTable = await this.schema.hasTable(this.tableName)
    if (hasTable) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().index()
      table.timestamp('request_at').notNullable().defaultTo(this.now())

      // Index for efficient cleanup and rate limit checks
      table.index(['user_id', 'request_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
