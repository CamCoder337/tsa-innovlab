import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'location_updates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('mission_id').notNullable().references('missions.id').onDelete('CASCADE')
      table.uuid('driver_id').nullable().references('users.id').onDelete('SET NULL')

      table.decimal('latitude', 10, 8).notNullable()
      table.decimal('longitude', 11, 8).notNullable()
      table.decimal('speed', 8, 2).nullable() // en m/s
      table.decimal('heading', 5, 2).nullable() // direction en degrés (0-360)
      table.decimal('accuracy', 8, 2).nullable() // précision en mètres

      table.timestamp('timestamp', { useTz: true }).notNullable().defaultTo(this.now())

      // Index pour améliorer les performances de recherche
      table.index(['mission_id', 'timestamp'])
      table.index(['driver_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
