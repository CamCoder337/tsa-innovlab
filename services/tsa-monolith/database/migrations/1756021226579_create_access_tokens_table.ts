import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AccessTokensSchema extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('tokenable_type').notNullable().defaultTo('users')
      table.uuid('tokenable_id').notNullable().references('users.id').onDelete('CASCADE')
      table.string('type').notNullable()
      table.string('name')
      table.string('hash').notNullable().unique()
      table.specificType('abilities', 'text[]').defaultTo('{}')
      table.timestamp('last_used_at', { useTz: true })
      table.timestamp('expires_at', { useTz: true })
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
