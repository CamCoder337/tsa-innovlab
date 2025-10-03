import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Type de conversation (simplifié)
      table.enum('type', ['direct', 'mission']).notNullable().index()

      // Participants (seulement 2 utilisateurs) - avec contraintes FK
      table
        .uuid('user1_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()

      table
        .uuid('user2_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()

      // Mission liée (optionnel) - avec contrainte FK
      table
        .uuid('mission_id')
        .nullable()
        .references('id')
        .inTable('missions')
        .onDelete('CASCADE')
        .index()

      // Dernière activité
      table.timestamp('last_activity_at').notNullable()

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Index composites pour performance
      table.index(['user1_id', 'user2_id', 'type'])
      table.index(['mission_id', 'type'])
      table.index(['last_activity_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
