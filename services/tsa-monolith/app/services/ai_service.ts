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

export interface MissionRecommendationRequest {
  transporterProfile: {
    transporter_id: string
    vehicles?: Array<{
      type: string
      capacite: number
    }>
    // Champs optionnels - seront inférés côté Python si absents
    max_weight?: number
    max_distance?: number
    min_budget?: number
    experience_years?: number
    reputation_score?: number
    preferred_merchandise_types?: string[]
    known_cities?: string[]
    preferred_delay_days?: number
    vehicle_type?: string
  }
  availableMissions: Array<{
    mission_id: string
    weight: number
    budget: number
    delay_days: number
    depart_city: string
    arrival_city: string
    merchandise_type: string
    description: string
    urgency_level: number
  }>
  method?: 'rule_based' | 'ml_based' | 'both'
  maxRecommendations?: number
}

export interface MissionRecommendationResponse {
  transporter_id: string
  recommendations: Array<{
    mission_id: string
    affinity_score: number
    confidence: number
    method: string
    mission_details: any
    reasons: string[]
    estimated_profit?: number
    estimated_cost?: number
    profit_margin?: number
  }>
  processing_time_ms: number
  timestamp: string
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

      const url = `${this.baseUrl}/api/ai/pricing/calculate`
      console.log('[PRICING] Calling:', url)
      console.log('[PRICING] Request:', JSON.stringify(request, null, 2))

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      })

      console.log('[PRICING] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('[PRICING] Error response:', errorText)
        throw new Error(`AI Service responded with status ${response.status}: ${errorText}`)
      }

      const data = (await response.json()) as DynamicPricingResponse
      console.log('[PRICING] Success! Price:', data.calculated_price)
      return data
    } catch (error) {
      console.error('[PRICING] Exception:', error)
      logger.error('Failed to calculate dynamic pricing from AI service', {
        error: error.message,
        stack: error.stack,
        url: `${this.baseUrl}/api/ai/pricing/calculate`
      })
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
   * Get mission recommendations for a transporter
   */
  async getMissionRecommendations(
    request: MissionRecommendationRequest
  ): Promise<MissionRecommendationResponse> {
    try {
      logger.info('Requesting mission recommendations', {
        transporterId: request.transporterProfile.transporter_id,
        missionsCount: request.availableMissions.length,
        vehiclesCount: request.transporterProfile.vehicles?.length || 0,
      })

      // Convert camelCase to snake_case for Python API
      const pythonRequest = {
        transporter_profile: request.transporterProfile,
        available_missions: request.availableMissions,
        method: request.method || 'rule_based',
        max_recommendations: request.maxRecommendations || 10,
      }

      // Log détaillé pour debug
      console.log('[MISSION_REC] Calling:', `${this.baseUrl}/api/ai/missions/recommend`)
      console.log('[MISSION_REC] Profile:', JSON.stringify(pythonRequest.transporter_profile, null, 2))
      console.log('[MISSION_REC] Missions count:', pythonRequest.available_missions.length)

      const response = await fetch(`${this.baseUrl}/api/ai/missions/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pythonRequest),
        signal: AbortSignal.timeout(this.timeout),
      })

      console.log('[MISSION_REC] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('[MISSION_REC] Error response:', errorText)
        throw new Error(`AI Service responded with status ${response.status}: ${errorText}`)
      }

      const data = (await response.json()) as MissionRecommendationResponse
      console.log('[MISSION_REC] Success! Recommendations:', data.recommendations?.length || 0)
      return data
    } catch (error) {
      console.error('[MISSION_REC] Exception:', error)
      logger.error('Failed to get mission recommendations from AI service', {
        error: error.message,
        stack: error.stack,
        url: `${this.baseUrl}/api/ai/missions/recommend`
      })

      return {
        transporter_id: request.transporterProfile.transporter_id,
        recommendations: [],
        processing_time_ms: 0,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Score a piece/product quality
   */
  async scorePiece(request: {
    pieceInfo: {
      piece_id: string
      piece_name: string
      piece_age_months: number
      estimated_lifetime_months: number
      supplier_rating: number
      supplier_years_experience: number
      average_customer_rating: number
      number_of_reviews: number
      physical_condition_score: number
      price: number
      category_code: number
      brand_reputation_score: number
    }
    method?: 'rule_based' | 'ml_based' | 'both'
  }): Promise<{
    piece_id: string
    score_result: {
      final_score: number
      category: string
      details?: any
      method: string
    }
    processing_time_ms: number
    timestamp: string
  }> {
    try {
      logger.info('Requesting piece scoring', { pieceId: request.pieceInfo.piece_id })

      // Convert to Python API format (snake_case)
      const pythonRequest = {
        piece_info: request.pieceInfo,
        method: request.method || 'rule_based',
      }

      // 🔍 DEBUG: Log de la requête envoyée au service Python
      console.log('[AI SERVICE DEBUG] Requête envoyée au service Python:')
      console.log(JSON.stringify(pythonRequest, null, 2))

      const response = await fetch(`${this.baseUrl}/api/ai/scoring/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pythonRequest),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        // 🔍 DEBUG: Log de la réponse d'erreur
        const errorText = await response.text()
        console.log('[AI SERVICE DEBUG] Erreur du service Python:')
        console.log(`Status: ${response.status}`)
        console.log(`Response: ${errorText}`)
        throw new Error(`AI Service responded with status ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      // 🔍 DEBUG: Log de la réponse réussie
      console.log('[AI SERVICE DEBUG] Réponse du service Python:')
      console.log(JSON.stringify(data, null, 2))

      return data as any
    } catch (error) {
      logger.error('Failed to score piece from AI service', {
        error: error.message,
        pieceId: request.pieceInfo.piece_id,
        stack: error.stack
      })

      // Return null to indicate failure, let controller handle it
      throw error
    }
  }

  /**
   * Score multiple pieces in batch
   */
  async scorePieceBatch(request: {
    pieces: Array<{
      piece_id: string
      piece_name: string
      piece_age_months: number
      estimated_lifetime_months: number
      supplier_rating: number
      supplier_years_experience: number
      average_customer_rating: number
      number_of_reviews: number
      physical_condition_score: number
      price: number
      category_code: number
      brand_reputation_score: number
    }>
    method?: 'rule_based' | 'ml_based' | 'both'
  }): Promise<{
    success: boolean
    results: any[]
    total_pieces: number
    processing_time_ms: number
  }> {
    try {
      logger.info('Requesting batch piece scoring', { count: request.pieces.length })

      const response = await fetch(`${this.baseUrl}/api/ai/scoring/score/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout * 2), // Double timeout for batch
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = await response.json()
      return data as any
    } catch (error) {
      logger.error('Failed to score pieces batch from AI service', { error })

      return {
        success: false,
        results: [],
        total_pieces: 0,
        processing_time_ms: 0,
      }
    }
  }

  /**
   * Get piece scoring categories
   */
  async getPieceScoringCategories(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/scoring/categories`, {
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
      logger.error('Failed to get scoring categories from AI service', { error })
      return {
        categories: {},
        weights: {},
      }
    }
  }

  /**
   * Get piece scoring methods
   */
  async getPieceScoringMethods(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/scoring/methods`, {
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
      logger.error('Failed to get scoring methods from AI service', { error })
      return {
        methods: {},
      }
    }
  }
}
