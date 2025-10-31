import type { HttpContext } from '@adonisjs/core/http'
import AIService from '#services/ai_service'
import logger from '@adonisjs/core/services/logger'

export default class ChatbotController {
  private aiService: AIService

  constructor() {
    this.aiService = new AIService()
  }

  /**
   * Query the chatbot
   * POST /api/common/chatbot/query
   */
  async query({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { message, conversationId, context } = request.only([
        'message',
        'conversationId',
        'context',
      ])

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return response.badRequest({
          success: false,
          message: 'Message is required',
        })
      }

      // 🔍 DEBUG: Log user info
      logger.info(`🔍 USER: id=${user.id} role=${user.role} email=${user.email}`)

      logger.info('Chatbot query received', {
        userId: user.id,
        userRole: user.role,
        userEmail: user.email,
        messageLength: message.length,
      })

      // Get authorization token to pass to chatbot
      const authToken = request.header('Authorization') || ''

      const chatbotPayload = {
        message: message.trim(),
        user_id: user.id.toString(),
        user_role: user.role,
        user_token: authToken || undefined, // Pass token for API calls (undefined if empty)
        conversation_id: conversationId || user.id.toString(),
        context: context || {},
      }

      // 🔍 DEBUG: Log payload sent to AI service
      logger.info(`🔍 PAYLOAD: user_id=${chatbotPayload.user_id} user_role=${chatbotPayload.user_role}`)

      const chatbotResponse = await this.aiService.queryChatbot(chatbotPayload)

      if (!chatbotResponse) {
        return response.status(503).json({
          success: false,
          message: 'Chatbot service is temporarily unavailable',
          fallback_message:
            'Désolé, je ne suis pas disponible pour le moment. Veuillez contacter le support.',
        })
      }

      return response.ok({
        success: true,
        ...chatbotResponse,
      })
    } catch (error) {
      logger.error('Error in chatbot query', { error })

      return response.status(500).json({
        success: false,
        message: 'An error occurred while processing your message',
      })
    }
  }

  /**
   * Get conversation history
   * GET /api/common/chatbot/history/:conversationId
   */
  async history({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { conversationId } = params

      // Ensure user can only access their own conversation
      // In production, add proper authorization check
      if (conversationId !== user.id.toString()) {
        logger.warn('User attempted to access another conversation', {
          userId: user.id,
          requestedConversationId: conversationId,
        })
      }

      const history = await this.aiService.getChatbotHistory(conversationId)

      if (!history) {
        return response.status(503).json({
          success: false,
          message: 'Unable to retrieve conversation history',
        })
      }

      return response.ok({
        success: true,
        ...history,
      })
    } catch (error) {
      logger.error('Error retrieving chatbot history', { error })

      return response.status(500).json({
        success: false,
        message: 'An error occurred while retrieving conversation history',
      })
    }
  }

  /**
   * Health check for chatbot
   * GET /api/common/chatbot/health
   */
  async health({ response }: HttpContext) {
    try {
      const isHealthy = await this.aiService.checkChatbotHealth()

      if (isHealthy) {
        return response.ok({
          success: true,
          status: 'healthy',
          message: 'Chatbot service is operational',
        })
      } else {
        return response.status(503).json({
          success: false,
          status: 'unhealthy',
          message: 'Chatbot service is not responding',
        })
      }
    } catch (error) {
      logger.error('Error checking chatbot health', { error })

      return response.status(500).json({
        success: false,
        status: 'error',
        message: 'Unable to check chatbot health',
      })
    }
  }
}
