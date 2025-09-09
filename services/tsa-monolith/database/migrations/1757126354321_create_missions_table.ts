import { BaseSchema } from '@adonisjs/lucid/schema'

export default class MissionsSchema extends BaseSchema {
  protected tableName = 'missions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('affreteur_id').notNullable().references('users.id')
      table.string('titre', 255).notNullable()
      table.text('description')
      table.string('type_marchandise', 100)
      table.decimal('poids', 10, 2)
      table.decimal('volume', 10, 2)
      table.timestamp('date_depart_estime', { useTz: true })
      table.timestamp('date_arrivee_prevue', { useTz: true })
      table.uuid('adresse_depart_id').references('addresses.id')
      table.uuid('adresse_arrivee_id').references('addresses.id')
      table.decimal('budget_min', 12, 2)
      table.decimal('budget_max', 12, 2)
      table
        .enum('status', ['draft', 'published', 'assigned', 'completed', 'cancelled'], {
          useNative: true,
          enumName: 'mission_status',
        })
        .defaultTo('draft')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      table.index(['affreteur_id', 'status'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    await this.raw('DROP TYPE IF EXISTS mission_status')
  }
}
