import { BaseSchema } from '@adonisjs/lucid/schema'

export default class RefreshTokensSchema extends BaseSchema {
  protected tableName = 'refresh_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE')
      table.string('token_hash', 255).notNullable().unique()
      table.jsonb('device_info')
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('revoked_at', { useTz: true })
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())

      table.index(['user_id'])
      table.index(['token_hash'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
