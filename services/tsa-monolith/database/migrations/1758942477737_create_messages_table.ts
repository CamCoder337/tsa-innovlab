import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Relations - avec contraintes FK
      table
        .integer('conversation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE')
        .index()

      table
        .uuid('sender_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()

      table
        .uuid('mission_id')
        .nullable()
        .references('id')
        .inTable('missions')
        .onDelete('CASCADE')
        .index()

      // Contenu du message
      table.text('content').notNullable()
      table.enum('type', ['text', 'system']).defaultTo('text').notNullable()

      // Statut de lecture
      table.timestamp('read_at').nullable()

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Index composites pour performance
      table.index(['conversation_id', 'created_at'])
      table.index(['sender_id', 'created_at'])
      table.index(['mission_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
