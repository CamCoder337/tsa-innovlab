import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cart_items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('unit_price', 'price_at_add')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('price_at_add', 'unit_price')
    })
  }
}