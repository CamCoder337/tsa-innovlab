import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_types'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table.string('code', 100).notNullable().unique().comment('Code unique du type de document')
      table.string('label_fr', 255).notNullable().comment('Libellé français')
      table.string('label_en', 255).notNullable().comment('Libellé anglais')
      table.text('description').nullable().comment('Description détaillée')

      table
        .specificType('applicable_to', 'document_applicable_to')
        .notNullable()
        .comment('Applicable à utilisateur ou véhicule')

      table
        .specificType('required_for_roles', 'text[]')
        .nullable()
        .comment('Rôles pour lesquels ce document est requis')

      table
        .specificType('required_for_vehicle_types', 'text[]')
        .nullable()
        .comment('Types de véhicules pour lesquels ce document est requis')

      table
        .boolean('has_expiration')
        .notNullable()
        .defaultTo(false)
        .comment("Le document a une date d'expiration")
      table
        .integer('default_validity_days')
        .nullable()
        .comment('Durée de validité par défaut en jours')

      table
        .jsonb('file_format_restrictions')
        .nullable()
        .comment('Restrictions sur les formats de fichiers')
      table.jsonb('validation_rules').nullable().comment('Règles de validation métier')

      table
        .boolean('is_active')
        .notNullable()
        .defaultTo(true)
        .comment('Le type de document est actif')
      table.integer('display_order').notNullable().defaultTo(0).comment("Ordre d'affichage")

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Indexes
      table.index('code')
      table.index('applicable_to')
      table.index('is_active')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
