import { BaseSchema } from '@adonisjs/lucid/schema'

export default class StockMovements extends BaseSchema {
  protected tableName = 'stock_movements'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE')
      table.enu('type', ['in', 'out', 'adjustment']).notNullable()
      table.integer('quantity').notNullable()
      table.integer('quantity_before').notNullable()
      table.integer('quantity_after').notNullable()
      table.string('reason', 255)
      table.string('reference_type', 50)
      table.uuid('reference_id')
      table.uuid('created_by').references('id').inTable('users')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
