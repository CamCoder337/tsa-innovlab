import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mission_issues'

  async up() {
    // Créer l'enum pour les types de problèmes
    await this.raw(`
      CREATE TYPE issue_type AS ENUM (
        'breakdown',
        'delay',
        'accident',
        'traffic',
        'other'
      );
    `)

    // Créer l'enum pour les statuts des problèmes
    await this.raw(`
      CREATE TYPE issue_status AS ENUM (
        'reported',
        'acknowledged',
        'resolved'
      );
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('mission_id').notNullable().references('missions.id').onDelete('CASCADE')
      table.uuid('reported_by_id').notNullable().references('users.id').onDelete('RESTRICT')

      table.specificType('type', 'issue_type').notNullable()
      table.text('description').notNullable()
      table.json('photos').nullable() // Array de URLs de photos

      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()

      table.specificType('status', 'issue_status').notNullable().defaultTo('reported')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('resolved_at', { useTz: true }).nullable()

      // Index pour améliorer les performances de recherche
      table.index(['mission_id', 'status'])
      table.index(['reported_by_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    await this.raw('DROP TYPE IF EXISTS issue_status')
    await this.raw('DROP TYPE IF EXISTS issue_type')
  }
}
