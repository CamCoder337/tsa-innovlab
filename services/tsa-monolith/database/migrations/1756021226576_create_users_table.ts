import { BaseSchema } from '@adonisjs/lucid/schema'

export default class UsersSchema extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table.string('email', 255).notNullable().unique()
      table.string('password_hash', 255).notNullable()
      table.string('first_name', 100)
      table.string('last_name', 100)
      table.string('phone', 20)

      table
        .enum('role', ['admin', 'transporteur', 'affreteur'], {
          useNative: true,
          enumName: 'user_role',
        })
        .notNullable()
      table
        .enum('status', ['pending', 'active', 'suspended'], {
          useNative: true,
          enumName: 'user_status',
        })
        .defaultTo('pending')

      table.timestamp('email_verified_at', { useTz: true })
      table.boolean('mfa_enabled').defaultTo(false)
      table.string('mfa_secret', 255)
      table.timestamp('last_login_at', { useTz: true })
      table.integer('failed_login_attempts').defaultTo(0)
      table.timestamp('locked_until', { useTz: true })

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      table.index(['email'])
      table.index(['role', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
