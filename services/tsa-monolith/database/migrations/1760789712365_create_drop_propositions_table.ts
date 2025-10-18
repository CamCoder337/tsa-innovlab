import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'propositions'

  async up() {
    this.schema.dropTableIfExists(this.tableName)
  }

  async down() {
    // Recréer la table si rollback (au cas où)
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('mission_id')
        .notNullable()
        .references('id')
        .inTable('missions')
        .onDelete('CASCADE')
      table
        .uuid('transporter_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.decimal('proposed_budget', 10, 2).notNullable()
      table.text('message').nullable()
      table.enum('status', ['PENDING', 'ACCEPTED', 'REJECTED']).defaultTo('PENDING')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }
}
