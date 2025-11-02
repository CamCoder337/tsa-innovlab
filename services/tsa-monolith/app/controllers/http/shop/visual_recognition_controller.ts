import type { HttpContext } from '@adonisjs/core/http'
import AIService from '#services/ai_service'
import Product from '#models/product'
import fs from 'node:fs'

export default class VisualRecognitionController {
  private aiService: AIService

  constructor() {
    this.aiService = new AIService()
  }

  async searchByImage({ request, response }: HttpContext) {
    try {
      const image = request.file('image', {
        size: '10mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })

      if (!image) {
        return response.status(422).json({
          success: false,
          message: 'Image file is required',
          errors: ['Please upload a valid image file (jpg, jpeg, png, webp)'],
        })
      }

      if (!image.isValid) {
        return response.status(422).json({
          success: false,
          message: 'Invalid image file',
          errors: image.errors,
        })
      }

      // Read the uploaded file as a Buffer from its temporary path
      const imageBuffer = fs.readFileSync(image.tmpPath!)

      // Call AI service for visual recognition
      const recognitionResult = await this.aiService.searchProductsByImage(
        imageBuffer,
        image.clientName
      )

      if (!recognitionResult || !recognitionResult.success) {
        return response.status(500).json({
          success: false,
          message: 'Failed to process image',
          errors: ['AI service unavailable or could not recognize products in the image'],
        })
      }

      const productIds = recognitionResult.results.map((r: any) => r.product_id)

      if (productIds.length === 0) {
        return response.json({
          success: true,
          message: 'No products found matching the image',
          data: {
            products: [],
            processing_time_ms: recognitionResult.processing_time_ms,
          },
        })
      }

      const products = await Product.query()
        .whereIn('id', productIds)
        .where('isActive', true)
        .preload('category')

      const enrichedProducts = products.map((product) => {
        const aiResult = recognitionResult.results.find((r: any) => r.product_id === product.id)
        return {
          ...product.serialize(),
          confidence: aiResult?.confidence || 0,
          recognized_category: aiResult?.category || '',
        }
      })

      enrichedProducts.sort((a: any, b: any) => b.confidence - a.confidence)

      return response.json({
        success: true,
        message: 'Products found successfully',
        data: {
          products: enrichedProducts,
          total: enrichedProducts.length,
          processing_time_ms: recognitionResult.processing_time_ms,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to search products by image',
        errors: [error.message],
      })
    }
  }

  async health({ response }: HttpContext) {
    try {
      const isHealthy = await this.aiService.checkHealth()

      return response.json({
        success: true,
        service: 'visual_recognition',
        status: isHealthy ? 'healthy' : 'unhealthy',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Health check failed',
        errors: [error.message],
      })
    }
  }
}
