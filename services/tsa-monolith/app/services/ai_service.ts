import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export interface RecommendationRequest {
  userId: string
  limit?: number
  context?: 'homepage' | 'product' | 'cart' | 'checkout'
}

export interface SimilarProductsRequest {
  productId: string
  limit?: number
}

export interface RecommendationResponse {
  success: boolean
  recommendations: Array<{
    product_id: string
    score: number
    reason: string
  }>
  strategy_used: string
}

export default class AIService {
  private readonly baseUrl: string
  private readonly timeout: number = 10000 // 10 seconds

  constructor() {
    this.baseUrl = env.get('FASTAPI_BASE_URL', 'http://localhost:8000')
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    try {
      logger.info('Requesting personalized recommendations', {
        userId: request.userId,
        context: request.context,
      })

      const response = await fetch(`${this.baseUrl}/api/ai/recommendations/personalized`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: request.userId,
          limit: request.limit || 10,
          context: request.context || 'homepage',
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Failed to get personalized recommendations from AI service', { error })

      // Return fallback empty recommendations
      return {
        success: false,
        recommendations: [],
        strategy_used: 'fallback',
      }
    }
  }

  /**
   * Get similar products based on a product ID
   */
  async getSimilarProducts(request: SimilarProductsRequest): Promise<RecommendationResponse> {
    try {
      logger.info('Requesting similar products', { productId: request.productId })

      const response = await fetch(`${this.baseUrl}/api/ai/recommendations/similar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: request.productId,
          limit: request.limit || 10,
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Failed to get similar products from AI service', { error })

      return {
        success: false,
        recommendations: [],
        strategy_used: 'fallback',
      }
    }
  }

  /**
   * Get popular/trending products
   */
  async getPopularProducts(limit: number = 10): Promise<RecommendationResponse> {
    try {
      logger.info('Requesting popular products')

      const response = await fetch(
        `${this.baseUrl}/api/ai/recommendations/popular?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(this.timeout),
        }
      )

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Failed to get popular products from AI service', { error })

      return {
        success: false,
        recommendations: [],
        strategy_used: 'fallback',
      }
    }
  }

  /**
   * Health check for AI service
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      return response.ok
    } catch (error) {
      logger.warn('AI service health check failed', { error })
      return false
    }
  }
}
