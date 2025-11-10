import type { HttpContext } from '@adonisjs/core/http'
import AIService from '#services/ai_service'
import logger from '@adonisjs/core/services/logger'

export default class KYCController {
  private aiService: AIService

  constructor() {
    this.aiService = new AIService()
  }

  /**
   * Extract KYC document information
   * 
   * @swagger
   * /api/kyc/extract:
   *   post:
   *     tags:
   *       - KYC
   *     summary: Extract information from KYC documents (CNI, Permis)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - document_type
   *               - recto
   *             properties:
   *               document_type:
   *                 type: string
   *                 enum: [CNI_ANCIEN, CNI_NOUVEAU, PERMIS_CONDUIRE]
   *                 description: Type de document à extraire
   *               recto:
   *                 type: string
   *                 format: binary
   *                 description: Image du recto du document
   *               verso:
   *                 type: string
   *                 format: binary
   *                 description: Image du verso du document (optionnel)
   *     responses:
   *       200:
   *         description: Extraction réussie
   *       400:
   *         description: Requête invalide
   *       401:
   *         description: Non authentifié
   *       503:
   *         description: Service AI indisponible
   */
  async extract({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      
      // Validate request
      const documentType = request.input('document_type')
      if (!['CNI_ANCIEN', 'CNI_NOUVEAU', 'PERMIS_CONDUIRE'].includes(documentType)) {
        return response.badRequest({
          success: false,
          message: 'Type de document invalide',
        })
      }

      // Get uploaded files
      const rectoFile = request.file('recto', {
        size: '10mb',
        extnames: ['jpg', 'jpeg', 'png', 'pdf'],
      })

      const versoFile = request.file('verso', {
        size: '10mb',
        extnames: ['jpg', 'jpeg', 'png', 'pdf'],
      })

      if (!rectoFile) {
        return response.badRequest({
          success: false,
          message: 'Le fichier recto est requis',
        })
      }

      // Validate files
      if (!rectoFile.isValid) {
        return response.badRequest({
          success: false,
          message: 'Fichier recto invalide',
          errors: rectoFile.errors,
        })
      }

      if (versoFile && !versoFile.isValid) {
        return response.badRequest({
          success: false,
          message: 'Fichier verso invalide',
          errors: versoFile.errors,
        })
      }

      logger.info('KYC extraction request', {
        userId: user.id,
        documentType,
        hasVerso: !!versoFile,
      })

      // Read file buffers using fs
      const fs = await import('node:fs/promises')
      const rectoBuffer = await fs.readFile(rectoFile.tmpPath!)
      const versoBuffer = versoFile ? await fs.readFile(versoFile.tmpPath!) : undefined

      // Call AI service
      const aiResponse = await this.aiService.extractKYCDocument(
        {
          document_type: documentType as 'CNI_ANCIEN' | 'CNI_NOUVEAU' | 'PERMIS_CONDUIRE',
        },
        rectoBuffer,
        versoBuffer
      )

      if (!aiResponse) {
        return response.serviceUnavailable({
          success: false,
          message: 'Service KYC temporairement indisponible',
        })
      }

      // Log extraction result
      logger.info('KYC extraction completed', {
        userId: user.id,
        status: aiResponse.status,
        confidence: aiResponse.confidence_score,
        method: aiResponse.extraction_method,
        cost: aiResponse.extraction_cost_usd,
      })

      return response.ok(aiResponse)
    } catch (error) {
      logger.error('KYC extraction error', { error })
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de l\'extraction du document',
      })
    }
  }

  /**
   * Get KYC service statistics
   * 
   * @swagger
   * /api/kyc/stats:
   *   get:
   *     tags:
   *       - KYC
   *     summary: Get KYC service statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistiques récupérées
   *       401:
   *         description: Non authentifié
   *       403:
   *         description: Non autorisé (admin uniquement)
   */
  async stats({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      
      // Only admins can view stats
      if (user.role !== 'admin') {
        return response.forbidden({
          success: false,
          message: 'Accès réservé aux administrateurs',
        })
      }

      const stats = await this.aiService.getKYCStats()

      if (!stats) {
        return response.serviceUnavailable({
          success: false,
          message: 'Service KYC temporairement indisponible',
        })
      }

      return response.ok({
        success: true,
        ...stats,
      })
    } catch (error) {
      logger.error('KYC stats error', { error })
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      })
    }
  }

  /**
   * Check KYC service health
   * 
   * @swagger
   * /api/kyc/health:
   *   get:
   *     tags:
   *       - KYC
   *     summary: Check KYC service health
   *     responses:
   *       200:
   *         description: Service disponible
   *       503:
   *         description: Service indisponible
   */
  async health({ response }: HttpContext) {
    try {
      const isHealthy = await this.aiService.checkKYCHealth()

      if (!isHealthy) {
        return response.serviceUnavailable({
          success: false,
          message: 'Service KYC indisponible',
        })
      }

      return response.ok({
        success: true,
        message: 'Service KYC disponible',
      })
    } catch (error) {
      logger.error('KYC health check error', { error })
      return response.serviceUnavailable({
        success: false,
        message: 'Service KYC indisponible',
      })
    }
  }
}
