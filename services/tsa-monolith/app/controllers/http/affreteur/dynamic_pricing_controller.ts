import type { HttpContext } from '@adonisjs/core/http'
import AIService from '#services/ai_service'

export default class DynamicPricingController {
  private aiService: AIService

  constructor() {
    this.aiService = new AIService()
  }

  async calculate({ request, response }: HttpContext) {
    try {
      const requestData = request.only([
        'origin',
        'destination',
        'distance_km',
        'weight_tons',
        'cargo_type',
        'urgency',
      ])

      const distanceKm = requestData.distance_km
      const weightTons = requestData.weight_tons
      const cargoType = requestData.cargo_type

      if (!requestData.origin || !requestData.destination || !distanceKm || !weightTons) {
        return response.status(422).json({
          success: false,
          message: 'Missing required fields',
          errors: ['origin, destination, distance_km, and weight_tons are required'],
        })
      }

      const pricingResult = await this.aiService.calculateDynamicPricing({
        origin: requestData.origin,
        destination: requestData.destination,
        distance_km: Number(distanceKm),
        weight_tons: Number(weightTons),
        cargo_type: cargoType || 'general',
        urgency: requestData.urgency || 'standard',
      })

      if (!pricingResult) {
        return response.status(500).json({
          success: false,
          message: 'Failed to calculate pricing',
          errors: ['AI service unavailable or returned an error'],
        })
      }

      return response.json({
        success: true,
        message: 'Dynamic pricing calculated successfully',
        data: pricingResult,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to calculate dynamic pricing',
        errors: [error.message],
      })
    }
  }

  async getConfig({ response }: HttpContext) {
    try {
      const config = await this.aiService.getPricingConfig()

      if (!config) {
        return response.status(500).json({
          success: false,
          message: 'Failed to retrieve pricing configuration',
        })
      }

      return response.json({
        success: true,
        message: 'Pricing configuration retrieved successfully',
        data: config,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve pricing configuration',
        errors: [error.message],
      })
    }
  }
}
