import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'missions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Référence au véhicule assigné à la mission
      table
        .uuid('vehicle_id')
        .nullable()
        .references('id')
        .inTable('vehicles')
        .onDelete('SET NULL')
        .comment('Véhicule assigné à la mission')

      // Type de véhicule requis/recommandé (optionnel)
      table
        .enum('required_vehicle_type', ['truck', 'van', 'motorcycle', 'car'])
        .nullable()
        .comment('Type de véhicule requis ou recommandé')

      // Index pour améliorer les performances de recherche
      table.index('vehicle_id')
      table.index('required_vehicle_type')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('vehicle_id')
      table.dropColumn('required_vehicle_type')
    })
  }
}
