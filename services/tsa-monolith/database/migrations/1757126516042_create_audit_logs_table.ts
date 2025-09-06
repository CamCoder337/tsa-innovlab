import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AuditLogsSchema extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('user_id').references('users.id')
      table.string('action', 100).notNullable()
      table.string('entity_type', 100)
      table.uuid('entity_id')
      table.jsonb('old_values')
      table.jsonb('new_values')
      table.specificType('ip_address', 'inet') // PostgreSQL inet
      table.text('user_agent')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())

      table.index(['user_id', 'action', 'created_at'])
      table.index(['entity_type', 'entity_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
