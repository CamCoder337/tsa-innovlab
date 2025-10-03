import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_updates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Relations - avec contraintes FK
      table
        .uuid('mission_id')
        .notNullable()
        .references('id')
        .inTable('missions')
        .onDelete('CASCADE')
        .index()

      table
        .uuid('transporteur_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()

      // Type de mise à jour
      table
        .enum('type', ['status_change', 'location_update', 'proof_upload', 'note', 'issue'])
        .notNullable()
        .index()

      // Contenu
      table.string('title', 255).notNullable()
      table.text('description').notNullable()

      // Changement de statut
      table.string('old_status', 50).nullable()
      table.string('new_status', 50).nullable()

      // Géolocalisation
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.string('address', 500).nullable()

      // Pièces jointes (URLs des fichiers)
      table.json('attachments').nullable()

      // Visibilité
      table.boolean('is_public').defaultTo(true)

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Index composites pour performance
      table.index(['mission_id', 'created_at'])
      table.index(['transporteur_id', 'created_at'])
      table.index(['mission_id', 'type'])
      table.index(['latitude', 'longitude'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
