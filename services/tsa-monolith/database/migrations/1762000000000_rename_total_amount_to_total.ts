import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration de correction pour renommer la colonne 'total_amount' en 'total'
 * dans la table 'orders'
 *
 * Contexte : La migration initiale utilisait 'total_amount' mais le code
 * a été mis à jour pour utiliser 'total'. Cette migration corrige la BDD.
 */
export default class RenameTotalAmountToTotal extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    // Vérifier si la colonne total_amount existe encore (idempotence)
    const hasTotalAmount = await this.schema.hasColumn(this.tableName, 'total_amount')

    if (hasTotalAmount) {
      // La colonne existe encore, on peut la renommer
      this.schema.alterTable(this.tableName, (table) => {
        // Renommer la colonne total_amount en total
        table.renameColumn('total_amount', 'total')
      })
    }
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Rollback : renommer total en total_amount
      table.renameColumn('total', 'total_amount')
    })
  }
}
