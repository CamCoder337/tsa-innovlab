import { BaseSchema } from '@adonisjs/lucid/schema'

export default class MfaRecoveryCodesSchema extends BaseSchema {
  protected tableName = 'mfa_recovery_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE')
      table.string('code_hash', 255).notNullable()
      table.timestamp('used_at', { useTz: true })
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())

      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
