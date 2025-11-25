import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import WebSocketService from '#services/websocket_service'

/**
 * Controller pour le tracking GPS public (sans authentification)
 * ATTENTION: Ceci est pour des tests de développement uniquement
 */
export default class TrackingController {
  // Stockage en mémoire des positions (pour test uniquement)
  private static positions: Map<
    string,
    {
      latitude: number
      longitude: number
      timestamp: string
      deviceId: string
      speed?: number
      heading?: number
    }
  > = new Map()

  /**
   * Mettre à jour la position GPS d'un appareil
   * POST /api/tracking/update-location
   */
  async updateLocation({ request, response }: HttpContext) {
    // Validation des données
    const locationSchema = vine.object({
      deviceId: vine.string().minLength(3).maxLength(100),
      latitude: vine.number().min(-90).max(90),
      longitude: vine.number().min(-180).max(180),
      speed: vine.number().optional(),
      heading: vine.number().min(0).max(360).optional(),
    })

    try {
      const data = await vine.validate({
        schema: locationSchema,
        data: request.all(),
      })

      const position = {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date().toISOString(),
        deviceId: data.deviceId,
        speed: data.speed,
        heading: data.heading,
      }

      // Stocker la position en mémoire
      TrackingController.positions.set(data.deviceId, position)

      // Broadcast en temps réel via WebSocket
      try {
        const websocketService = WebSocketService.getInstance()
        await websocketService.broadcastToAll({
          type: 'location_update',
          data: position,
        })
      } catch (error) {
        console.warn('⚠️ WebSocket broadcast failed (probably in test mode):', error.message)
      }

      return response.json({
        success: true,
        message: 'Location updated successfully',
        data: position,
      })
    } catch (error) {
      if (error.messages) {
        return response.status(422).json({
          success: false,
          message: 'Validation error',
          errors: error.messages,
        })
      }

      return response.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer toutes les positions actives
   * GET /api/tracking/locations
   */
  async getLocations({ response }: HttpContext) {
    const now = new Date()
    // Considérer les positions de moins de 30 secondes comme actives
    // (puisque l'app envoie toutes les 5 secondes)
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000)

    // Filtrer les positions de moins de 30 secondes
    const activePositions = Array.from(TrackingController.positions.values()).filter(
      (position) => {
        const positionTime = new Date(position.timestamp)
        return positionTime > thirtySecondsAgo
      }
    )

    return response.json({
      success: true,
      message: 'Active locations retrieved',
      data: {
        count: activePositions.length,
        positions: activePositions,
      },
    })
  }

  /**
   * Récupérer la position d'un appareil spécifique
   * GET /api/tracking/locations/:deviceId
   */
  async getDeviceLocation({ params, response }: HttpContext) {
    const position = TrackingController.positions.get(params.deviceId)

    if (!position) {
      return response.status(404).json({
        success: false,
        message: 'Device not found or position too old',
      })
    }

    // Vérifier que la position a moins de 30 secondes
    const now = new Date()
    const positionTime = new Date(position.timestamp)
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000)

    if (positionTime < thirtySecondsAgo) {
      return response.status(404).json({
        success: false,
        message: 'Position too old (>30 seconds)',
      })
    }

    return response.json({
      success: true,
      message: 'Device location retrieved',
      data: position,
    })
  }

  /**
   * Nettoyer les anciennes positions
   * DELETE /api/tracking/cleanup
   */
  async cleanup({ response }: HttpContext) {
    const now = new Date()
    // Supprimer les positions de plus d'1 minute
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    let removedCount = 0

    // Supprimer les positions de plus d'1 minute
    for (const [deviceId, position] of TrackingController.positions.entries()) {
      const positionTime = new Date(position.timestamp)
      if (positionTime < oneMinuteAgo) {
        TrackingController.positions.delete(deviceId)
        removedCount++
      }
    }

    return response.json({
      success: true,
      message: `Cleanup completed, ${removedCount} old positions removed`,
      data: {
        removedCount,
        remainingCount: TrackingController.positions.size,
      },
    })
  }
}
