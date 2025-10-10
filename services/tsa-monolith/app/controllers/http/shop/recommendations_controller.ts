import type { HttpContext } from '@adonisjs/core/http'
import AIService from '#services/ai_service'
import Product from '#models/product'

export default class RecommendationsController {
  private aiService: AIService

  constructor() {
    this.aiService = new AIService()
  }

  /**
   * Get personalized recommendations for the authenticated user
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { limit = 10, context = 'homepage' } = request.qs()

      // Get recommendations from AI service
      const aiResponse = await this.aiService.getPersonalizedRecommendations({
        userId: user.id,
        limit: Number(limit),
        context,
      })

      // If AI service failed or returned no recommendations, fallback to popular products
      if (!aiResponse.success || aiResponse.recommendations.length === 0) {
        const popularProducts = await Product.query()
          .where('isActive', true)
          .where('stock', '>', 0)
          .orderBy('createdAt', 'desc')
          .limit(Number(limit))
          .preload('category')

        return response.json({
          success: true,
          message: 'Recommendations retrieved (fallback to recent products)',
          data: {
            products: popularProducts.map((p) => p.serialize()),
            strategy: 'fallback_recent',
          },
        })
      }

      // Extract product IDs from AI response
      const productIds = aiResponse.recommendations.map((r) => r.product_id)

      // Fetch full product details
      const products = await Product.query()
        .whereIn('id', productIds)
        .where('isActive', true)
        .preload('category')

      // Sort products according to AI scores
      const sortedProducts = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p) => p !== undefined)

      // Enrich with AI scores and reasons
      const enrichedProducts = sortedProducts.map((product) => {
        const aiRec = aiResponse.recommendations.find((r) => r.product_id === product!.id)
        return {
          ...product!.serialize(),
          recommendation_score: aiRec?.score || 0,
          recommendation_reason: aiRec?.reason || 'Recommandé pour vous',
        }
      })

      return response.json({
        success: true,
        message: 'Personalized recommendations retrieved successfully',
        data: {
          products: enrichedProducts,
          strategy: aiResponse.strategy_used,
          total: enrichedProducts.length,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve recommendations',
        errors: [error.message],
      })
    }
  }

  /**
   * Get similar products based on a specific product
   */
  async similar({ params, request, response }: HttpContext) {
    try {
      const { limit = 10 } = request.qs()
      const productId = params.id

      // Verify product exists
      const baseProduct = await Product.query()
        .where('id', productId)
        .where('isActive', true)
        .firstOrFail()

      // Get similar products from AI service
      const aiResponse = await this.aiService.getSimilarProducts({
        productId,
        limit: Number(limit),
      })

      // Fallback: if AI fails, get products from same category
      if (!aiResponse.success || aiResponse.recommendations.length === 0) {
        const similarProducts = await Product.query()
          .where('categoryId', baseProduct.categoryId)
          .where('isActive', true)
          .where('stock', '>', 0)
          .whereNot('id', productId)
          .limit(Number(limit))
          .preload('category')

        return response.json({
          success: true,
          message: 'Similar products retrieved (same category)',
          data: {
            base_product: baseProduct.serialize(),
            products: similarProducts.map((p) => p.serialize()),
            strategy: 'fallback_same_category',
          },
        })
      }

      // Extract product IDs and fetch details
      const productIds = aiResponse.recommendations.map((r) => r.product_id)
      const products = await Product.query()
        .whereIn('id', productIds)
        .where('isActive', true)
        .preload('category')

      // Sort and enrich with AI data
      const sortedProducts = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p) => p !== undefined)

      const enrichedProducts = sortedProducts.map((product) => {
        const aiRec = aiResponse.recommendations.find((r) => r.product_id === product!.id)
        return {
          ...product!.serialize(),
          similarity_score: aiRec?.score || 0,
          similarity_reason: aiRec?.reason || 'Produit similaire',
        }
      })

      return response.json({
        success: true,
        message: 'Similar products retrieved successfully',
        data: {
          base_product: baseProduct.serialize(),
          products: enrichedProducts,
          strategy: aiResponse.strategy_used,
          total: enrichedProducts.length,
        },
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        message: 'Product not found or failed to retrieve similar products',
        errors: [error.message],
      })
    }
  }

  /**
   * Get popular/trending products
   */
  async popular({ request, response }: HttpContext) {
    try {
      const { limit = 10 } = request.qs()

      // Get popular products from AI service
      const aiResponse = await this.aiService.getPopularProducts(Number(limit))

      // Fallback: if AI fails, get most recent products
      if (!aiResponse.success || aiResponse.recommendations.length === 0) {
        const recentProducts = await Product.query()
          .where('isActive', true)
          .where('stock', '>', 0)
          .orderBy('createdAt', 'desc')
          .limit(Number(limit))
          .preload('category')

        return response.json({
          success: true,
          message: 'Popular products retrieved (recent products)',
          data: {
            products: recentProducts.map((p) => p.serialize()),
            strategy: 'fallback_recent',
          },
        })
      }

      // Extract product IDs and fetch details
      const productIds = aiResponse.recommendations.map((r) => r.product_id)
      const products = await Product.query()
        .whereIn('id', productIds)
        .where('isActive', true)
        .preload('category')

      // Sort and enrich with AI data
      const sortedProducts = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p) => p !== undefined)

      const enrichedProducts = sortedProducts.map((product) => {
        const aiRec = aiResponse.recommendations.find((r) => r.product_id === product!.id)
        return {
          ...product!.serialize(),
          popularity_score: aiRec?.score || 0,
          popularity_reason: aiRec?.reason || 'Produit populaire',
        }
      })

      return response.json({
        success: true,
        message: 'Popular products retrieved successfully',
        data: {
          products: enrichedProducts,
          strategy: aiResponse.strategy_used,
          total: enrichedProducts.length,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve popular products',
        errors: [error.message],
      })
    }
  }
}
