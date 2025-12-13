import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Foreign Keys
      table
        .uuid('document_type_id')
        .notNullable()
        .references('id')
        .inTable('document_types')
        .onDelete('RESTRICT')
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('vehicle_id').nullable().references('id').inTable('vehicles').onDelete('CASCADE')

      // Informations fichier (stocké dans Supabase)
      table.text('file_url').notNullable().comment('URL du fichier dans Supabase')
      table.string('file_name', 500).notNullable().comment('Nom original du fichier')
      table.bigInteger('file_size_bytes').notNullable().comment('Taille du fichier en octets')
      table.string('mime_type', 100).notNullable().comment('Type MIME du fichier')

      // Statut et validation
      table
        .specificType('status', 'document_status')
        .notNullable()
        .defaultTo('pending')
        .comment('Statut du document')

      table.text('rejection_reason').nullable().comment('Raison du rejet (si applicable)')
      table
        .uuid('validated_by_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('validated_at', { useTz: true }).nullable().comment('Date de validation')

      // Dates d'émission et expiration
      table.date('issue_date').nullable().comment("Date d'émission du document")
      table.date('expiration_date').nullable().comment("Date d'expiration du document")
      table.timestamp('expires_at', { useTz: true }).nullable().comment("Date/heure d'expiration")
      table
        .timestamp('expiration_notified_at', { useTz: true })
        .nullable()
        .comment("Date de notification d'expiration")

      // Métadonnées et versioning
      table.jsonb('metadata').nullable().comment('Métadonnées additionnelles')
      table.integer('version').notNullable().defaultTo(1).comment('Version du document')
      table
        .uuid('replaced_by_id')
        .nullable()
        .references('id')
        .inTable('documents')
        .onDelete('SET NULL')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Indexes pour performance
      table.index(['user_id', 'status'])
      table.index(['vehicle_id', 'status'])
      table.index('document_type_id')
      table.index('status')
      table.index('expiration_date')
      table.index('validated_by_id')
      table.index('created_at')
    })

    // Contrainte UNIQUE partielle: un seul document actif par type/user/vehicle
    // Utilise COALESCE pour gérer les NULL dans vehicle_id
    this.schema.raw(`
      CREATE UNIQUE INDEX documents_unique_active
      ON documents(user_id, document_type_id, COALESCE(vehicle_id, '00000000-0000-0000-0000-000000000000'::uuid))
      WHERE status IN ('pending', 'validated')
    `)
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS documents_unique_active')
    this.schema.dropTable(this.tableName)
  }
}
