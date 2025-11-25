import QRCode from 'qrcode'
import Mission from '#models/mission'
import env from '#start/env'

export class QrCodeService {
  /**
   * Génère un QR code pour la preuve de livraison
   * Le QR code contient une URL vers l'endpoint de validation de livraison
   */
  async generateDeliveryQrCode(mission: Mission): Promise<string> {
    if (!mission.qrCodeToken) {
      throw new Error('Mission does not have a QR code token')
    }

    const frontendUrl = env.get('FRONTEND_URL')
    const deliveryProofUrl = `${frontendUrl}/delivery-proof?token=${mission.qrCodeToken}&mission_id=${mission.id}`

    // Générer le QR code en base64
    const qrCodeDataUrl = await QRCode.toDataURL(deliveryProofUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return qrCodeDataUrl
  }

  /**
   * Génère un QR code au format SVG
   */
  async generateDeliveryQrCodeSvg(mission: Mission): Promise<string> {
    if (!mission.qrCodeToken) {
      throw new Error('Mission does not have a QR code token')
    }

    const frontendUrl = env.get('FRONTEND_URL')
    const deliveryProofUrl = `${frontendUrl}/delivery-proof?token=${mission.qrCodeToken}&mission_id=${mission.id}`

    // Générer le QR code en SVG
    const qrCodeSvg = await QRCode.toString(deliveryProofUrl, {
      errorCorrectionLevel: 'H',
      type: 'svg',
      margin: 1,
      width: 300,
    })

    return qrCodeSvg
  }

  /**
   * Vérifie si un token de QR code est valide pour une mission
   */
  async verifyQrCodeToken(missionId: string, token: string): Promise<Mission | null> {
    const mission = await Mission.query()
      .where('id', missionId)
      .where('qr_code_token', token)
      .preload('affreteur')
      .preload('transporteur')
      .preload('adresseDepart')
      .preload('adresseArrivee')
      .first()

    return mission
  }

  /**
   * Régénère le QR code d'une mission (en cas de perte ou suspicion de fuite)
   */
  async regenerateQrCodeToken(mission: Mission): Promise<void> {
    const { randomBytes } = await import('node:crypto')
    mission.qrCodeToken = randomBytes(32).toString('hex')
    await mission.save()
  }
}

export default new QrCodeService()
