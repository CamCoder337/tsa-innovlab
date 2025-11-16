import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration de correction pour ajouter les colonnes manquantes à la table 'orders'
 *
 * Contexte : La migration initiale déployée en production (commit 4ca46e6) était minimale.
 * Le code a été mis à jour pour utiliser des colonnes supplémentaires qui n'existent pas
 * en production (customer_email, customer_name, customer_phone, etc.).
 * Cette migration ajoute toutes les colonnes manquantes.
 *
 * Colonnes ajoutées :
 * - customer_name, customer_email, customer_phone (informations client)
 * - subtotal, shipping_cost, tax (détails financiers)
 * - payment_reference, tracking_number (références)
 * - paid_at, shipped_at, delivered_at, cancelled_at (timestamps)
 */
export default class AddMissingColumnsToOrders extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    // Vérifier si la colonne customer_email existe déjà (idempotence)
    const hasCustomerEmail = await this.schema.hasColumn(this.tableName, 'customer_email')

    if (!hasCustomerEmail) {
      // Les colonnes n'existent pas encore, on les ajoute
      this.schema.alterTable(this.tableName, (table) => {
        // Colonnes d'information client
        table.string('customer_name', 200).notNullable().defaultTo('')
        table.string('customer_email', 200).notNullable().defaultTo('')
        table.string('customer_phone', 20).notNullable().defaultTo('')

        // Détails financiers
        table.decimal('subtotal', 12, 2).notNullable().defaultTo(0).checkPositive()
        table.decimal('shipping_cost', 12, 2).defaultTo(0)
        table.decimal('tax', 12, 2).defaultTo(0)

        // Références
        table.string('payment_reference', 100).nullable()
        table.string('tracking_number', 100).nullable()

        // Timestamps de statut
        table.timestamp('paid_at', { useTz: true }).nullable()
        table.timestamp('shipped_at', { useTz: true }).nullable()
        table.timestamp('delivered_at', { useTz: true }).nullable()
        table.timestamp('cancelled_at', { useTz: true }).nullable()
      })
    }
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Rollback : supprimer toutes les colonnes ajoutées
      table.dropColumn('customer_name')
      table.dropColumn('customer_email')
      table.dropColumn('customer_phone')
      table.dropColumn('subtotal')
      table.dropColumn('shipping_cost')
      table.dropColumn('tax')
      table.dropColumn('payment_reference')
      table.dropColumn('tracking_number')
      table.dropColumn('paid_at')
      table.dropColumn('shipped_at')
      table.dropColumn('delivered_at')
      table.dropColumn('cancelled_at')
    })
  }
}
