import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import DocumentVerificationService from '#services/document_verification_service'

export default class CheckExpirations extends BaseCommand {
  static commandName = 'documents:check-expirations'
  static description = 'Vérifie et expire automatiquement les documents obsolètes'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🔍 Vérification des documents expirés...')

    try {
      const verificationService = new DocumentVerificationService()
      const count = await verificationService.checkDocumentExpirations()

      if (count > 0) {
        this.logger.success(`✅ ${count} document(s) expiré(s) automatiquement`)
      } else {
        this.logger.info('ℹ️  Aucun document expiré trouvé')
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la vérification des expirations')
      this.logger.error(error.message)
      this.exitCode = 1
    }
  }
}
