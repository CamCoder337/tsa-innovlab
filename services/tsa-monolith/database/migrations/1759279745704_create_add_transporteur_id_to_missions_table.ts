import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'missions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('transporteur_id')
        .nullable()
        .references('users.id')
        .onDelete('SET NULL')
        .after('affreteur_id')

      table.index(['transporteur_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['transporteur_id'])
      table.dropColumn('transporteur_id')
    })
  }
}
