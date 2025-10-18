import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vehicles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .enum('type', ['truck', 'van', 'motorcycle', 'car'])
        .notNullable()
        .comment('Type de véhicule')
      table.string('registration', 50).notNullable().unique().comment('Immatriculation')
      table.text('description').nullable().comment('Description du véhicule')
      table
        .enum('status', ['available', 'in_mission', 'maintenance', 'inactive'])
        .notNullable()
        .defaultTo('available')
        .comment('Statut de disponibilité')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Index pour accélérer les recherches
      table.index('user_id')
      table.index('status')
      table.index(['user_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
