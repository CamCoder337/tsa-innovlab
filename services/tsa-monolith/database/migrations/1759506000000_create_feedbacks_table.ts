import { BaseSchema } from '@adonisjs/lucid/schema'

export default class FeedbacksSchema extends BaseSchema {
  protected tableName = 'feedbacks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Références aux entités
      table.uuid('mission_id').notNullable().references('missions.id').onDelete('CASCADE')
      table.uuid('affreteur_id').notNullable().references('users.id').onDelete('CASCADE')
      table.uuid('transporteur_id').notNullable().references('users.id').onDelete('CASCADE')

      // Note et description
      table.integer('rating').notNullable().checkBetween([1, 5])
      table.text('description').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      // Index pour performance
      table.index(['mission_id'])
      table.index(['transporteur_id'])
      table.index(['affreteur_id'])
      table.index(['rating'])

      // Contrainte unique : un seul feedback par mission
      table.unique(['mission_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
