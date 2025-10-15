import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Carts extends BaseSchema {
  protected tableName = 'carts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .enum('status', ['active', 'abandoned', 'converted'], {
          useNative: true,
          enumName: 'cart_status',
        })
        .defaultTo('active')
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      // Index pour recherche rapide par utilisateur et statut
      table.index(['user_id', 'status'])
      table.index(['expires_at'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
