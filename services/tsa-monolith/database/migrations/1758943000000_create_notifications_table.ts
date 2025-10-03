import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Utilisateur destinataire - avec contrainte FK
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()

      // Type de notification
      table
        .enum('type', [
          'mission_new',
          'mission_assigned',
          'mission_status_changed',
          'message_received',
          'system',
        ])
        .notNullable()
        .index()

      // Contenu
      table.string('title', 255).notNullable()
      table.text('message').notNullable()

      // Priorité
      table
        .enum('priority', ['low', 'normal', 'high', 'urgent'])
        .defaultTo('normal')
        .notNullable()
        .index()

      // Mission liée (optionnel) - avec contrainte FK
      table
        .uuid('mission_id')
        .nullable()
        .references('id')
        .inTable('missions')
        .onDelete('CASCADE')
        .index()

      // Données additionnelles JSON
      table.json('data').nullable()

      // URL d'action (pour redirection)
      table.string('action_url', 500).nullable()

      // Statut de lecture
      table.timestamp('read_at').nullable()

      // Email envoyé
      table.boolean('email_sent').defaultTo(false)

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Index composites pour performance
      table.index(['user_id', 'read_at'])
      table.index(['user_id', 'type'])
      table.index(['user_id', 'priority', 'created_at'])
      table.index(['mission_id', 'type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
