import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddressesSchema extends BaseSchema {
  protected tableName = 'addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('label', 255)
      table.text('street').notNullable()
      table.string('city', 100).notNullable()
      table.string('region', 100)
      table.string('country', 100).defaultTo('Cameroun')
      table.string('postal_code', 20)
      table.decimal('latitude', 10, 8)
      table.decimal('longitude', 11, 8)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())

      table.index(['city', 'country'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
