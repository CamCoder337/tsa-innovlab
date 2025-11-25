import Mission, { MissionStatus } from '#models/mission'
import LocationUpdate from '#models/location_update'
import { randomBytes, randomInt } from 'node:crypto'
import { DateTime } from 'luxon'

export class MissionTrackingService {
  /**
   * Génère un token unique pour le tracking d'une mission
   */
  generateTrackingToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Génère un PIN à 6 chiffres
   */
  generateTrackingPin(): string {
    return randomInt(100000, 999999).toString()
  }

  /**
   * Génère un token unique pour le QR code de livraison
   */
  generateQrCodeToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Initialise les credentials de tracking pour une mission
   * Appelé automatiquement quand une mission passe au statut ASSIGNED ou READY_TO_START
   */
  async initializeTracking(mission: Mission): Promise<void> {
    if (!mission.trackingLinkToken) {
      mission.trackingLinkToken = this.generateTrackingToken()
    }
    if (!mission.trackingPin) {
      mission.trackingPin = this.generateTrackingPin()
    }
    if (!mission.qrCodeToken) {
      mission.qrCodeToken = this.generateQrCodeToken()
    }
    await mission.save()
  }

  /**
   * Vérifie les credentials de tracking (token + PIN)
   */
  async verifyTrackingCredentials(token: string, pin: string): Promise<Mission | null> {
    const mission = await Mission.query()
      .where('tracking_link_token', token)
      .where('tracking_pin', pin)
      .preload('affreteur')
      .preload('transporteur')
      .preload('adresseDepart')
      .preload('adresseArrivee')
      .first()

    return mission
  }

  /**
   * Enregistre une mise à jour de position GPS
   */
  async recordLocationUpdate(
    mission: Mission,
    latitude: number,
    longitude: number,
    speed?: number,
    heading?: number,
    accuracy?: number,
    driverId?: string
  ): Promise<LocationUpdate> {
    const locationUpdate = await LocationUpdate.create({
      missionId: mission.id,
      driverId: driverId || mission.transporteurId,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
    })

    // Si c'est la première mise à jour de position, démarrer la mission
    if (
      mission.status === MissionStatus.ASSIGNED ||
      mission.status === MissionStatus.READY_TO_START ||
      (mission.status === MissionStatus.PUBLISHED && !mission.startedAt)
    ) {
      mission.status = MissionStatus.IN_PROGRESS
      mission.startedAt = DateTime.now()
      await mission.save()
    }

    return locationUpdate
  }

  /**
   * Récupère les dernières positions pour une mission
   */
  async getRecentLocations(missionId: string, limit: number = 50): Promise<LocationUpdate[]> {
    return await LocationUpdate.query()
      .where('mission_id', missionId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
  }

  /**
   * Récupère la dernière position connue d'une mission
   */
  async getLastLocation(missionId: string): Promise<LocationUpdate | null> {
    return await LocationUpdate.query()
      .where('mission_id', missionId)
      .orderBy('timestamp', 'desc')
      .first()
  }

  /**
   * Vérifie si un chauffeur est proche du point de livraison
   * @param latitude Latitude du chauffeur
   * @param longitude Longitude du chauffeur
   * @param destinationLat Latitude de destination
   * @param destinationLng Longitude de destination
   * @param radiusMeters Rayon de proximité en mètres (par défaut 200m)
   */
  isNearDestination(
    latitude: number,
    longitude: number,
    destinationLat: number,
    destinationLng: number,
    radiusMeters: number = 200
  ): boolean {
    const R = 6371e3 // Rayon de la Terre en mètres
    const φ1 = (latitude * Math.PI) / 180
    const φ2 = (destinationLat * Math.PI) / 180
    const Δφ = ((destinationLat - latitude) * Math.PI) / 180
    const Δλ = ((destinationLng - longitude) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance <= radiusMeters
  }

  /**
   * Nettoie les anciennes positions (garde les 7 derniers jours)
   */
  async cleanupOldLocations(): Promise<number> {
    const sevenDaysAgo = DateTime.now().minus({ days: 7 })

    const deleted = await LocationUpdate.query()
      .where('timestamp', '<', sevenDaysAgo.toSQL())
      .delete()

    return deleted.length
  }
}

export default new MissionTrackingService()
