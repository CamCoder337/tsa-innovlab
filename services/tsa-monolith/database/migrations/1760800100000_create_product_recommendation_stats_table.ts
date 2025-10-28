import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ProductRecommendationStatsSchema extends BaseSchema {
  protected tableName = 'product_recommendation_stats'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Stratégie de recommandation
      table
        .enum('strategy', [
          'collaborative_filtering',
          'content_based',
          'popularity',
          'content_similarity',
        ])
        .notNullable()

      // Période statistique (daily, weekly, monthly)
      table.enum('period_type', ['hourly', 'daily', 'weekly', 'monthly']).notNullable()
      table.date('period_date').notNullable()

      // Métriques de performance
      table.integer('total_recommendations').defaultTo(0)
      table.integer('total_users').defaultTo(0)
      table.integer('total_views').defaultTo(0)
      table.integer('total_clicks').defaultTo(0)
      table.integer('total_add_to_cart').defaultTo(0)
      table.integer('total_purchases').defaultTo(0)

      // Taux calculés (en pourcentage * 100 pour éviter les float)
      table.integer('ctr_bps').defaultTo(0) // Click-through rate en basis points (1 bps = 0.01%)
      table.integer('conversion_rate_bps').defaultTo(0) // Conversion rate en basis points
      table.integer('add_to_cart_rate_bps').defaultTo(0)

      // Métriques de qualité
      table.decimal('avg_score', 5, 3).nullable()
      table.decimal('avg_processing_time_ms', 10, 2).nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      // Index pour performance
      table.index(['strategy'])
      table.index(['period_type', 'period_date'])
      table.index(['created_at'])

      // Contrainte unique : une seule entrée par stratégie/période/date
      table.unique(['strategy', 'period_type', 'period_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
