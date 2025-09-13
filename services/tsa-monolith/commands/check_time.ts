import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class CheckTime extends BaseCommand {
  static commandName = 'check:time'
  static description = 'Check server time vs system time'

  static options: CommandOptions = {
    startApp: false,
  }

  async run() {
    const serverTime = new Date()
    this.logger.info(`🕐 Heure serveur: ${serverTime.toISOString()}`)
    this.logger.info(
      `🕐 Heure serveur (locale): ${serverTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`
    )
    this.logger.info(
      `🌍 Timezone serveur: ${serverTime.getTimezoneOffset()} minutes de décalage UTC`
    )

    // Timestamp Unix (utilisé par TOTP)
    const unixTime = Math.floor(Date.now() / 1000)
    this.logger.info(`⏱️  Unix timestamp: ${unixTime}`)
    this.logger.info(`⏱️  Fenêtre TOTP actuelle: ${Math.floor(unixTime / 30)}`)
  }
}
