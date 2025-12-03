import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Mission from '#models/mission'
import { MissionStatus } from '#models/mission'

export default class RegenerateTrackingCredentials extends BaseCommand {
  static commandName = 'regenerate:tracking-credentials'
  static description = 'Regenerate missing tracking credentials for assigned missions'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🔍 Searching for missions with missing tracking credentials...')

    // Trouver toutes les missions assignées (ASSIGNED, IN_PROGRESS, etc.) sans credentials
    const missions = await Mission.query()
      .whereIn('status', [
        MissionStatus.ASSIGNED,
        MissionStatus.READY_TO_START,
        MissionStatus.IN_PROGRESS,
        MissionStatus.DELIVERED,
      ])
      .whereNotNull('transporteur_id')
      .whereNotNull('vehicle_id')
      .where((query) => {
        query
          .whereNull('tracking_link_token')
          .orWhereNull('tracking_pin')
          .orWhereNull('qr_code_token')
      })

    if (missions.length === 0) {
      this.logger.success('✅ All missions already have tracking credentials!')
      return
    }

    this.logger.info(`📝 Found ${missions.length} mission(s) missing credentials`)

    let regeneratedCount = 0

    for (const mission of missions) {
      try {
        // Générer les credentials
        const trackingToken = `trk_${Buffer.from(`${Date.now()}-${mission.transporteurId}-${mission.vehicleId}`).toString('base64').slice(0, 32)}`
        const trackingPin = Math.floor(100000 + Math.random() * 900000).toString()
        const qrCodeToken = `qrc_${Buffer.from(`${Date.now()}-${mission.id}-${mission.transporteurId}`).toString('base64').slice(0, 16)}`

        mission.trackingLinkToken = trackingToken
        mission.trackingPin = trackingPin
        mission.qrCodeToken = qrCodeToken

        await mission.save()

        this.logger.success(
          `✅ Mission ${mission.id.slice(0, 8)}... - Token: ${trackingToken.slice(0, 15)}..., PIN: ${trackingPin}`
        )

        regeneratedCount++

        // Petit délai pour éviter les collisions de timestamp
        await new Promise((resolve) => setTimeout(resolve, 10))
      } catch (error) {
        this.logger.error(
          `❌ Failed to regenerate credentials for mission ${mission.id}: ${error.message}`
        )
      }
    }

    this.logger.success(
      `\n🎉 Successfully regenerated credentials for ${regeneratedCount}/${missions.length} missions!`
    )
  }
}
