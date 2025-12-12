import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import crypto from 'node:crypto'
import Mission from '#models/mission'

interface MissionAccessPayload {
  missionId: string
  vehicleId: string | null
  pin: string
  issuedAt: number
  expiresAt: number
}

/**
 * Service pour gérer les tokens d'accès mission-scoped
 * Ces tokens donnent accès à UNE mission spécifique via le PIN
 * Ne nécessitent pas de compte utilisateur
 */
export class MissionAccessService {
  /**
   * Génère un token d'accès pour une mission spécifique
   * @param missionId ID de la mission
   * @param vehicleId ID du véhicule assigné
   * @param pin PIN de la mission
   * @param expiresInSeconds Durée de validité en secondes (par défaut 8h)
   */
  async generateMissionAccessToken(
    missionId: string,
    vehicleId: string | null,
    pin: string,
    expiresInSeconds: number = 28800 // 8 heures
  ): Promise<string> {
    const now = DateTime.now()
    const expiresAt = now.plus({ seconds: expiresInSeconds })

    const payload: MissionAccessPayload = {
      missionId,
      vehicleId,
      pin: pin.toUpperCase(),
      issuedAt: now.toUnixInteger(),
      expiresAt: expiresAt.toUnixInteger(),
    }

    // Encoder le payload en base64 avec signature HMAC
    const token = this.encodeToken(payload)

    return token
  }

  /**
   * Vérifie et décode un token d'accès mission
   * @param token Token à vérifier
   * @returns Payload décodé
   * @throws Exception si le token est invalide ou expiré
   */
  async verifyMissionAccessToken(token: string): Promise<MissionAccessPayload> {
    try {
      const payload = this.decodeToken(token)

      // Vérifier l'expiration
      const now = DateTime.now().toUnixInteger()
      if (payload.expiresAt < now) {
        throw new Exception('Mission access token has expired', { status: 401 })
      }

      // Vérifier que la mission existe et est toujours active
      const mission = await Mission.query()
        .where('id', payload.missionId)
        .whereIn('status', ['assigned', 'ready_to_start', 'in_progress'])
        .first()

      if (!mission) {
        throw new Exception('Mission not found or no longer active', { status: 404 })
      }

      // Vérifier que le PIN correspond toujours
      if (mission.trackingPin !== payload.pin) {
        throw new Exception('Mission PIN has been changed', { status: 401 })
      }

      return payload
    } catch (error) {
      if (error instanceof Exception) {
        throw error
      }
      throw new Exception('Invalid mission access token', { status: 401 })
    }
  }

  /**
   * Encode un payload en token signé
   * Format: base64(payload).signature
   */
  private encodeToken(payload: MissionAccessPayload): string {
    const payloadString = JSON.stringify(payload)
    const payloadBase64 = Buffer.from(payloadString).toString('base64url')

    // Générer signature HMAC-SHA256
    const signature = this.generateSignature(payloadBase64)

    return `${payloadBase64}.${signature}`
  }

  /**
   * Décode et vérifie un token signé
   */
  private decodeToken(token: string): MissionAccessPayload {
    const parts = token.split('.')
    if (parts.length !== 2) {
      throw new Exception('Invalid token format', { status: 401 })
    }

    const [payloadBase64, signature] = parts

    // Vérifier la signature
    const expectedSignature = this.generateSignature(payloadBase64)
    if (signature !== expectedSignature) {
      throw new Exception('Invalid token signature', { status: 401 })
    }

    // Décoder le payload
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    const payload = JSON.parse(payloadString) as MissionAccessPayload

    return payload
  }

  /**
   * Génère une signature HMAC-SHA256 pour le payload
   */
  private generateSignature(data: string): string {
    const secret = process.env.APP_KEY || 'fallback-secret-key'

    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(data)
    return hmac.digest('base64url')
  }

  /**
   * Révoque l'accès à une mission en changeant son PIN
   * Tous les tokens existants deviennent invalides
   */
  async revokeMissionAccess(mission: Mission): Promise<string> {
    const string = await import('@adonisjs/core/helpers/string')
    const newPin = string.default.generateRandom(6).toUpperCase()

    mission.trackingPin = newPin
    await mission.save()

    return newPin
  }
}

export default new MissionAccessService()
