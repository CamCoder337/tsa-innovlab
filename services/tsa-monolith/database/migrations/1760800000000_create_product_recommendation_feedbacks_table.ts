import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ProductRecommendationFeedbacksSchema extends BaseSchema {
  protected tableName = 'product_recommendation_feedbacks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Références aux entités
      table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE')
      table.uuid('product_id').notNullable().references('products.id').onDelete('CASCADE')

      // Type d'action feedback
      table
        .enum('action', ['view', 'click', 'add_to_cart', 'purchase', 'ignore', 'remove'])
        .notNullable()

      // Contexte de la recommandation
      table.string('context', 50).nullable() // homepage, product, cart, checkout
      table.string('strategy_used', 50).nullable() // collaborative_filtering, content_based, popularity

      // Score de recommandation au moment du feedback
      table.decimal('recommendation_score', 5, 3).nullable()

      // Métadonnées additionnelles
      table.jsonb('metadata').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      // Index pour performance
      table.index(['user_id'])
      table.index(['product_id'])
      table.index(['action'])
      table.index(['strategy_used'])
      table.index(['created_at'])

      // Index composite pour analyser la performance par stratégie
      table.index(['strategy_used', 'action', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
