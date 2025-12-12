import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'missions'

  async up() {
    // 1. Modifier la taille de la colonne tracking_pin : 6 → 8 caractères
    this.schema.alterTable(this.tableName, (table) => {
      table.string('tracking_pin', 8).nullable().alter()
    })

    // 2. Ajouter index UNIQUE partiel (seulement missions avec PIN non NULL)
    await this.raw(`
      CREATE UNIQUE INDEX missions_tracking_pin_unique
      ON ${this.tableName} (tracking_pin)
      WHERE tracking_pin IS NOT NULL
    `)
  }

  async down() {
    // Supprimer l'index UNIQUE
    await this.raw(`DROP INDEX IF EXISTS missions_tracking_pin_unique`)

    // Restaurer taille originale : 8 → 6 caractères
    this.schema.alterTable(this.tableName, (table) => {
      table.string('tracking_pin', 6).nullable().alter()
    })
  }
}
