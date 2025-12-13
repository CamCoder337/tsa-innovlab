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

    // Formater les données pour correspondre au format attendu par le frontend
    // location.timestamp est un DateTime de Luxon, utiliser .toISO() directement
    // Gérer le cas où timestamp pourrait être null, undefined, ou déjà une string
    let timestamp: string
    if (location.timestamp) {
      // Si c'est un DateTime de Luxon, utiliser toISO()
      if (typeof location.timestamp.toISO === 'function') {
        timestamp = location.timestamp.toISO() || new Date().toISOString()
      } else if (typeof location.timestamp === 'string') {
        // Si c'est déjà une string, l'utiliser directement
        timestamp = location.timestamp
      } else {
        // Sinon, convertir DateTime en Date puis en string ISO
        timestamp = location.timestamp.toJSDate().toISOString()
      }
    } else {
      timestamp = new Date().toISOString()
    }

    const locationData = {
      missionId: missionId,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed ?? undefined,
      heading: location.heading ?? undefined,
      accuracy: location.accuracy ?? undefined,
      timestamp: timestamp,
      driverId: location.driverId ?? undefined,
    }

    console.log(`📤 Location data formatted:`, {
      missionId: locationData.missionId,
      coordinates: `${locationData.latitude}, ${locationData.longitude}`,
      hasSpeed: !!locationData.speed,
      hasHeading: !!locationData.heading,
    })

    // Diffuser la mise à jour de localisation à tous les utilisateurs concernés par cette mission
    await websocketService.broadcastToMission(missionId, {
      type: WebSocketEventType.LOCATION_UPDATE,
      data: locationData,
      timestamp: new Date().toISOString(),
    })

    console.log(`✅ Location update broadcasted for mission ${missionId}`)
  }
}
