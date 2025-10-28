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

export interface DynamicPricingRequest {
  origin: string
  destination: string
  distance_km: number
  weight_tons: number
  cargo_type?: string
  urgency?: string
}

export interface DynamicPricingResponse {
  success: boolean
  calculated_price: number
  negotiation_range: {
    min_price: number
    max_price: number
    margin_percentage: number
    reason: string
  }
  breakdown: {
    base_cost: number
    distance_factor: number
    weight_factor: number
    cargo_type_multiplier: number
    urgency_multiplier: number
  }
}

export interface VisualRecognitionResponse {
  success: boolean
  results: Array<{
    product_id: string
    product_name: string
    confidence: number
    category: string
  }>
  processing_time_ms: number
}

export interface ChatbotQueryRequest {
  message: string
  user_id: string
  user_role?: string
  user_token?: string
  conversation_id?: string
  context?: Record<string, any>
}

export interface ChatbotResponse {
  message: string
  intent: {
    name: string
    confidence: number
    entities: Record<string, any>
  }
  suggestions: string[]
  data?: Record<string, any>
  requires_human: boolean
  timestamp: string
}

export interface RecommendationFeedbackRequest {
  userId: string
  productId: string
  action: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'ignore' | 'remove'
  context?: string
}

export interface RecommendationStatsResponse {
  total_recommendations_served: number
  total_users_recommended: number
  total_views: number
  total_clicks: number
  total_purchases: number
  strategies_performance: Record<string, any>
  last_updated: string
  status: string
}

export interface ThresholdAnalysisResponse {
  current_thresholds: Record<string, number>
  performance_metrics: Record<string, number>
  suggested_adjustments: Record<string, number>
  reasoning: string[]
  recommendation: string
}

export interface ABTestResultsResponse {
  enabled: boolean
  period: string
  groups: Record<string, any>
  winner: string | null
  best_conversion_rate: number
  recommendation: string
}

export default class AIService {
  private readonly baseUrl: string
  private readonly timeout: number = 10000 // 10 seconds

  constructor() {
    this.baseUrl = env.get('FASTAPI_BASE_URL', 'http://localhost:8000')
  }

  /**
   * Get personalized product recommendations for a user
   */
  async getPersonalizedRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    try {
      logger.info('Requesting personalized product recommendations', {
        userId: request.userId,
        context: request.context,
      })

      const response = await fetch(`${this.baseUrl}/api/ai/product-recommendations/personalized`, {
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

      const data = (await response.json()) as RecommendationResponse
      return data
    } catch (error) {
      logger.error('Failed to get personalized product recommendations from AI service', { error })

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

      const response = await fetch(`${this.baseUrl}/api/ai/product-recommendations/similar`, {
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

      const data = (await response.json()) as RecommendationResponse
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
        `${this.baseUrl}/api/ai/product-recommendations/popular?limit=${limit}`,
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

      const data = (await response.json()) as RecommendationResponse
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
   * Calculate dynamic pricing for a shipment
   */
  async calculateDynamicPricing(
    request: DynamicPricingRequest
  ): Promise<DynamicPricingResponse | null> {
    try {
      logger.info('Requesting dynamic pricing calculation', {
        origin: request.origin,
        destination: request.destination,
      })

      const response = await fetch(`${this.baseUrl}/api/ai/pricing/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = (await response.json()) as DynamicPricingResponse
      return data
    } catch (error) {
      logger.error('Failed to calculate dynamic pricing from AI service', { error })
      return null
    }
  }

  /**
   * Get pricing configuration
   */
  async getPricingConfig(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/pricing/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to get pricing config from AI service', { error })
      return null
    }
  }

  /**
   * Search products by image using visual recognition
   */
  async searchProductsByImage(imageFile: File | Buffer): Promise<VisualRecognitionResponse | null> {
    try {
      logger.info('Requesting visual recognition search')

      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch(`${this.baseUrl}/api/ai/visual/search/image`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000), // 30 seconds for image processing
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = (await response.json()) as VisualRecognitionResponse
      return data
    } catch (error) {
      logger.error('Failed to perform visual recognition from AI service', { error })
      return null
    }
  }

  /**
   * Query the chatbot with a user message
   */
  async queryChatbot(request: ChatbotQueryRequest): Promise<ChatbotResponse | null> {
    try {
      logger.info('Querying chatbot', {
        userId: request.user_id,
        messageLength: request.message.length,
      })

      const response = await fetch(`${this.baseUrl}/api/ai/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15 seconds for LLM responses
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = (await response.json()) as ChatbotResponse
      return data
    } catch (error) {
      logger.error('Failed to query chatbot from AI service', { error })
      return null
    }
  }

  /**
   * Get chatbot conversation history
   */
  async getChatbotHistory(conversationId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/chatbot/history/${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to get chatbot history from AI service', { error })
      return null
    }
  }

  /**
   * Check chatbot health
   */
  async checkChatbotHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/chatbot/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      return response.ok
    } catch (error) {
      logger.warn('Chatbot health check failed', { error })
      return false
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

  /**
   * Submit feedback for a product recommendation
   */
  async submitRecommendationFeedback(request: RecommendationFeedbackRequest): Promise<boolean> {
    try {
      logger.info('Submitting recommendation feedback', {
        userId: request.userId,
        productId: request.productId,
        action: request.action,
      })

      const response = await fetch(`${this.baseUrl}/api/ai/product-recommendations/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: request.userId,
          product_id: request.productId,
          action: request.action,
          context: request.context,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      return true
    } catch (error) {
      logger.error('Failed to submit recommendation feedback', { error })
      return false
    }
  }

  /**
   * Get recommendation system statistics
   */
  async getRecommendationStats(): Promise<RecommendationStatsResponse | null> {
    try {
      logger.info('Requesting recommendation statistics')

      const response = await fetch(`${this.baseUrl}/api/ai/product-recommendations/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = (await response.json()) as RecommendationStatsResponse
      return data
    } catch (error) {
      logger.error('Failed to get recommendation stats from AI service', { error })
      return null
    }
  }

  /**
   * Analyze recommendation thresholds and get suggestions
   */
  async analyzeRecommendationThresholds(): Promise<ThresholdAnalysisResponse | null> {
    try {
      logger.info('Requesting threshold analysis')

      const response = await fetch(
        `${this.baseUrl}/api/ai/product-recommendations/analyze-thresholds`,
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

      const data = (await response.json()) as ThresholdAnalysisResponse
      return data
    } catch (error) {
      logger.error('Failed to analyze recommendation thresholds from AI service', { error })
      return null
    }
  }

  /**
   * Get A/B test results for recommendation strategies
   */
  async getABTestResults(): Promise<ABTestResultsResponse | null> {
    try {
      logger.info('Requesting A/B test results')

      const response = await fetch(`${this.baseUrl}/api/ai/product-recommendations/ab-test-results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = (await response.json()) as ABTestResultsResponse
      return data
    } catch (error) {
      logger.error('Failed to get A/B test results from AI service', { error })
      return null
    }
  }
}
