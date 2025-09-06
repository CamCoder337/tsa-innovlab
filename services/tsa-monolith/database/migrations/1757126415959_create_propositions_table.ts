import { BaseSchema } from '@adonisjs/lucid/schema'

export default class PropositionsSchema extends BaseSchema {
  protected tableName = 'propositions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('mission_id').notNullable().references('missions.id').onDelete('CASCADE')
      table.uuid('transporteur_id').notNullable().references('users.id')
      table.decimal('prix_propose', 12, 2).notNullable()
      table.integer('delai_propose').notNullable()
      table.text('commentaire')
      table.enum('status', ['pending', 'accepted', 'rejected']).defaultTo('pending')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.unique(['mission_id', 'transporteur_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
