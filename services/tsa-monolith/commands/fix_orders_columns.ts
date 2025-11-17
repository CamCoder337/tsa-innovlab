import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'

/**
 * Commande d'urgence pour ajouter les colonnes manquantes à la table orders
 * en production.
 *
 * Usage: node ace fix:orders-columns
 */
export default class FixOrdersColumns extends BaseCommand {
  static commandName = 'fix:orders-columns'
  static description = 'Ajoute les colonnes manquantes à la table orders (customer_email, etc.)'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🔧 Correction de la table orders en cours...')

    try {
      // Tableau des colonnes à ajouter
      const columnsToAdd = [
        {
          name: 'customer_name',
          sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200) NOT NULL DEFAULT ''",
        },
        {
          name: 'customer_email',
          sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(200) NOT NULL DEFAULT ''",
        },
        {
          name: 'customer_phone',
          sql: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20) NOT NULL DEFAULT ''",
        },
        {
          name: 'subtotal',
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0',
        },
        {
          name: 'shipping_cost',
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(12, 2) DEFAULT 0',
        },
        {
          name: 'tax',
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax DECIMAL(12, 2) DEFAULT 0',
        },
        {
          name: 'payment_reference',
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100) NULL',
        },
        {
          name: 'tracking_number',
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100) NULL',
        },
        {
          name: 'paid_at',
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ NULL',
        },
        {
          name: 'shipped_at',
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ NULL',
        },
        {
          name: 'delivered_at',
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ NULL',
        },
        {
          name: 'cancelled_at',
          sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ NULL',
        },
      ]

      // Vérifier et ajouter chaque colonne
      for (const column of columnsToAdd) {
        try {
          // Vérifier si la colonne existe
          const exists = await db.rawQuery(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = ?`,
            [column.name]
          )

          if (exists.rows.length === 0) {
            // La colonne n'existe pas, on l'ajoute
            await db.rawQuery(column.sql)
            this.logger.success(`✅ Colonne "${column.name}" ajoutée`)
          } else {
            this.logger.info(`ℹ️  Colonne "${column.name}" existe déjà`)
          }
        } catch (error) {
          this.logger.error(`❌ Erreur lors de l'ajout de "${column.name}": ${error.message}`)
        }
      }

      // Vérifier la structure finale
      this.logger.info('\n📋 Structure finale de la table orders:')
      const columns = await db.rawQuery(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'orders'
        ORDER BY ordinal_position
      `)

      console.table(columns.rows)

      this.logger.success('\n✅ Correction terminée!')
    } catch (error) {
      this.logger.error(`❌ Erreur fatale: ${error.message}`)
      this.exitCode = 1
    }
  }
}
