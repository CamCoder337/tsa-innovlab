import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import DocumentVerificationService from '#services/document_verification_service'

export default class SendExpirationReminders extends BaseCommand {
  static commandName = 'documents:send-expiration-reminders'
  static description = "Envoie les rappels d'expiration de documents"

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info("📧 Envoi des rappels d'expiration...")

    try {
      const verificationService = new DocumentVerificationService()
      await verificationService.sendExpirationNotifications()

      this.logger.success("✅ Rappels d'expiration envoyés avec succès")
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'envoi des rappels")
      this.logger.error(error.message)
      this.exitCode = 1
    }
  }
}
