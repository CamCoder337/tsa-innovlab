import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import FormDataNode from 'form-data'
import axios from 'axios'

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
  user_email?: string
  user_token?: string
  conversation_id?: string
  context?: Record<string, any>
}

export interface NavigationInfo {
  path: string
  description: string
  filters?: Record<string, any>
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
  navigation?: NavigationInfo // V3: Frontend navigation info
  requires_human: boolean
  timestamp: string
}

export interface KYCExtractionRequest {
  document_type: 'CNI_ANCIEN' | 'CNI_NOUVEAU' | 'PERMIS_CONDUIRE'
}

export interface KYCExtractionResponse {
  success: boolean
  status: 'success' | 'partial' | 'failed'
  document_type: string
  data: {
    nom?: string | null
    prenoms?: string | null
    date_naissance?: string | null
    lieu_naissance?: string | null
    sexe?: string | null
    taille?: string | null
    profession?: string | null
    pere?: string | null
    mere?: string | null
    numero?: string | null
    date_delivrance?: string | null
    date_expiration?: string | null
    confidence_score: number
    extraction_method?: string
  }
  raw_text_recto?: string
  raw_text_verso?: string
  extraction_time_ms: number
  confidence_score: number
  warnings: string[]
  errors: string[]
  extraction_method: string
  extraction_cost_usd: number
  requires_manual_validation: boolean
  validation_notes?: string
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
  async searchProductsByImage(
    imageBuffer: Buffer,
    filename: string = 'image.jpg'
  ): Promise<VisualRecognitionResponse | null> {
    try {
      logger.info('Requesting visual recognition search')

      // Create a proper Blob from Buffer for Node.js
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('image', blob, filename)

      const response = await fetch(`${this.baseUrl}/api/ai/visual/search/image`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000), // 30 seconds for image processing
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('AI Service error response', { status: response.status, body: errorText })
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
   * Query the chatbot with a user message (V5 - Function Calling)
   *
   * Uses pure function calling with:
   * - 15 critical functions
   * - Conversation memory
   * - Error recovery & retry
   * - Intelligent navigation hints
   * - Contextual suggestions
   */
  async queryChatbot(request: ChatbotQueryRequest): Promise<ChatbotResponse | null> {
    try {
      logger.info('Querying chatbot V5 (Function Calling)', {
        userId: request.user_id,
        messageLength: request.message.length,
        conversationId: request.conversation_id,
      })

      // Call function calling endpoint
      const response = await fetch(`${this.baseUrl}/api/ai/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': request.user_id,
          'X-User-Role': request.user_role || 'client',
          'X-User-Email': request.user_email || '',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15s timeout
      })

      if (response.ok) {
        const data = (await response.json()) as ChatbotResponse
        logger.info('Chatbot response received', {
          userId: request.user_id,
          hasNavigation: !!data.navigation,
          suggestionsCount: data.suggestions?.length || 0,
          processingTime: data.timestamp,
        })
        return data
      }

      // Log error and return null
      logger.error('Chatbot service error', {
        status: response.status,
        userId: request.user_id,
      })
      return null
    } catch (error) {
      logger.error('Failed to query chatbot from AI service', { error })
      return null
    }
  }

  /**
   * Query the chatbot with streaming (SSE)
   *
   * Returns an async generator that yields chunks as they arrive
   *
   * Usage:
   * ```typescript
   * for await (const chunk of aiService.queryChatbotStream(request)) {
   *   if (chunk.type === 'chunk') {
   *     console.log(chunk.content);
   *   }
   * }
   * ```
   */
  async *queryChatbotStream(request: ChatbotQueryRequest): AsyncGenerator<any> {
    try {
      logger.info('Querying chatbot V5 (Streaming)', {
        userId: request.user_id,
        messageLength: request.message.length,
      })

      const response = await fetch(`${this.baseUrl}/api/ai/chatbot/query/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': request.user_id,
          'X-User-Role': request.user_role || 'client',
          'X-User-Email': request.user_email || '',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000), // 30s timeout for streaming
      })

      if (!response.ok) {
        logger.error('Chatbot streaming error', {
          status: response.status,
          userId: request.user_id,
        })
        yield {
          type: 'error',
          message: 'Erreur lors de la communication avec le chatbot',
        }
        return
      }

      // Parse SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        yield {
          type: 'error',
          message: 'Impossible de lire le stream',
        }
        return
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const chunk = JSON.parse(data)
              yield chunk
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to stream chatbot response', { error })
      yield {
        type: 'error',
        message: 'Erreur lors du streaming',
      }
    }
  }

  /**
   * Get chatbot analytics and metrics
   *
   * Returns:
   * - Total queries processed
   * - Success rate
   * - Average response time
   * - Most used functions
   * - Error rate
   */
  async getChatbotMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/chatbot/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`AI Service responded with status ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Failed to get chatbot metrics', { error })
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
   * Extract KYC document information (CNI, Permis de conduire)
   */
  async extractKYCDocument(
    request: KYCExtractionRequest,
    rectoFile: Buffer,
    versoFile?: Buffer
  ): Promise<KYCExtractionResponse | null> {
    try {
      logger.info('Requesting KYC document extraction', {
        documentType: request.document_type,
      })

      // Créer FormData avec les fichiers
      const formData = new FormDataNode()
      formData.append('document_type', request.document_type)

      // Détecter le type de fichier depuis le buffer (magic bytes)
      const getContentType = (buffer: Buffer): string => {
        const header = buffer.toString('hex', 0, 4)
        if (header.startsWith('ffd8ff')) return 'image/jpeg'
        if (header.startsWith('89504e47')) return 'image/png'
        if (header.startsWith('25504446')) return 'application/pdf'
        return 'application/octet-stream'
      }

      const rectoContentType = getContentType(rectoFile)
      const rectoExt = rectoContentType === 'application/pdf' ? 'pdf' : 'jpg'

      // Ajouter les fichiers avec les bonnes options
      formData.append('recto', rectoFile, {
        filename: `recto.${rectoExt}`,
        contentType: rectoContentType,
        knownLength: rectoFile.length,
      })

      if (versoFile) {
        const versoContentType = getContentType(versoFile)
        const versoExt = versoContentType === 'application/pdf' ? 'pdf' : 'jpg'

        formData.append('verso', versoFile, {
          filename: `verso.${versoExt}`,
          contentType: versoContentType,
          knownLength: versoFile.length,
        })
      }

      logger.info('Envoi requête KYC', {
        url: `${this.baseUrl}/api/ai/kyc/extract`,
        rectoSize: rectoFile.length,
        versoSize: versoFile?.length,
      })

      // Utiliser axios avec les bons headers
      const response = await axios.post(`${this.baseUrl}/api/ai/kyc/extract`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 180000, // 3 minutes pour laisser le temps à EasyOCR
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      })

      const data = response.data as KYCExtractionResponse
      logger.info('KYC extraction completed', {
        status: data.status,
        confidence: data.confidence_score,
        method: data.extraction_method,
        cost: data.extraction_cost_usd,
      })

      return data
    } catch (error: any) {
      if (error.response) {
        logger.error('KYC extraction error response', {
          status: error.response.status,
          body: error.response.data,
        })
      } else {
        logger.error('Failed to extract KYC document from AI service', { error: error.message })
      }
      return null
    }
  }

  /**
   * Get KYC service statistics
   */
  async getKYCStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/kyc/stats`, {
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
      logger.error('Failed to get KYC stats from AI service', { error })
      return null
    }
  }

  /**
   * Check KYC service health
   */
  async checkKYCHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/kyc/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      return response.ok
    } catch (error) {
      logger.warn('KYC health check failed', { error })
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
}
