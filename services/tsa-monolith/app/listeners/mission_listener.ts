import type { EventsList } from '@adonisjs/core/types'

export default class MissionListener {
  /**
   * Gère la mise à jour de la localisation d'une mission.
   *
   * @param {EventsList['mission:location_update']} data - Les données de l'événement.
   */
  async onLocationUpdate({ missionId, location }: EventsList['mission:location_update']) {
    // Import dynamique pour éviter les dépendances circulaires
    const { default: WebSocketService, WebSocketEventType } = await import(
      '#services/websocket_service'
    )
    const websocketService = WebSocketService.getInstance()

    console.log(`📍 Broadcasting location update for mission ${missionId}`)

    // Diffuser la mise à jour de localisation à tous les utilisateurs concernés par cette mission
    await websocketService.broadcastToMission(missionId, {
      type: WebSocketEventType.LOCATION_UPDATE,
      data: location,
      timestamp: new Date().toISOString(),
    })

    console.log(`✅ Location update broadcasted for mission ${missionId}`)
  }
}
