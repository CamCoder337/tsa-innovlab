import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vehicle_verification_status'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table
        .uuid('vehicle_id')
        .notNullable()
        .references('id')
        .inTable('vehicles')
        .onDelete('CASCADE')
        .unique()

      table
        .specificType('verification_status', 'kyc_status')
        .notNullable()
        .defaultTo('incomplete')
        .comment('Statut de vérification du véhicule')

      table
        .timestamp('verified_at', { useTz: true })
        .nullable()
        .comment('Date de vérification complète')

      // Compteurs de documents
      table
        .integer('documents_required_count')
        .notNullable()
        .defaultTo(0)
        .comment('Nombre de documents requis')
      table
        .integer('documents_submitted_count')
        .notNullable()
        .defaultTo(0)
        .comment('Nombre de documents soumis')
      table
        .integer('documents_validated_count')
        .notNullable()
        .defaultTo(0)
        .comment('Nombre de documents validés')
      table
        .integer('documents_rejected_count')
        .notNullable()
        .defaultTo(0)
        .comment('Nombre de documents rejetés')
      table
        .integer('documents_expired_count')
        .notNullable()
        .defaultTo(0)
        .comment('Nombre de documents expirés')

      table.timestamp('last_document_submitted_at', { useTz: true }).nullable()
      table.timestamp('last_document_validated_at', { useTz: true }).nullable()

      table
        .date('next_expiration_date')
        .nullable()
        .comment("Prochaine date d'expiration parmi tous les documents")

      table.text('verification_notes').nullable().comment("Notes de l'administrateur")

      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Indexes
      table.index('verification_status')
      table.index('next_expiration_date')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
