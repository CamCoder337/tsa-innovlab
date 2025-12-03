import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'missions'

  async up() {
    // Ajouter les nouveaux statuts à l'enum mission_status
    await this.raw(`
      ALTER TYPE mission_status ADD VALUE IF NOT EXISTS 'ready_to_start';
      ALTER TYPE mission_status ADD VALUE IF NOT EXISTS 'delivered';
      ALTER TYPE mission_status ADD VALUE IF NOT EXISTS 'paid';
    `)

    // Ajouter les nouveaux champs de tracking
    this.schema.alterTable(this.tableName, (table) => {
      table.string('tracking_link_token', 255).nullable().unique()
      table.string('tracking_pin', 6).nullable()
      table.string('qr_code_token', 255).nullable().unique()
      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('delivered_at', { useTz: true }).nullable()
      table.timestamp('paid_at', { useTz: true }).nullable()

      // Index pour améliorer les performances de recherche
      table.index(['tracking_link_token'])
      table.index(['qr_code_token'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['tracking_link_token'])
      table.dropIndex(['qr_code_token'])
      table.dropColumn('tracking_link_token')
      table.dropColumn('tracking_pin')
      table.dropColumn('qr_code_token')
      table.dropColumn('started_at')
      table.dropColumn('delivered_at')
      table.dropColumn('paid_at')
    })

    // Note: Il n'est pas possible de supprimer les valeurs d'un enum PostgreSQL facilement
    // Il faudrait recréer l'enum entièrement, ce qui pourrait causer des problèmes
  }
}
