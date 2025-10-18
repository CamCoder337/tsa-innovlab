import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('preferred_vehicle_type', ['truck', 'van', 'motorcycle', 'car'])
        .nullable()
        .comment('Type de véhicule recommandé pour la livraison')

      // Index pour optimiser les filtres de recherche
      table.index('preferred_vehicle_type')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('preferred_vehicle_type')
    })
  }
}
