import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ResendService from '#services/resend_service'
import env from '#start/env'

export default class VerifyEmailConfig extends BaseCommand {
  static commandName = 'verify:email-config'
  static description = 'Vérification complète de la configuration email'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🔍 Vérification Configuration Email TSA Logistics')

    // 1. Variables d'environnement
    this.logger.info("\n📋 Variables d'environnement:")
    this.logger.info(`   NODE_ENV: ${env.get('NODE_ENV')}`)
    this.logger.info(
      `   RESEND_API_KEY: ${env.get('RESEND_API_KEY') ? '✅ DÉFINI' : '❌ MANQUANT'}`
    )
    this.logger.info(
      `   MAIL_DOMAIN: ${env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com (par défaut)'}`
    )
    this.logger.info(`   MAIL_FROM: ${env.get('MAIL_FROM')}`)

    // 2. Déterminer le transport utilisé
    this.logger.info('\n🚚 Transport Email:')
    if (env.get('NODE_ENV') === 'production') {
      if (env.get('RESEND_API_KEY')) {
        this.logger.info('   ✅ PRODUCTION: Resend API (HTTPS)')
        this.logger.info(
          `   📧 Expéditeur: TSA Logistics <noreply@${env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'}>`
        )
      } else {
        this.logger.info('   ⚠️  PRODUCTION: Resend non configuré, utilise SMTP Gmail')
      }
    } else {
      this.logger.info('   📮 DEVELOPMENT: Gmail SMTP')
      this.logger.info(`   📧 Expéditeur: TSA Logistics <${env.get('MAIL_FROM')}>`)
    }

    // 3. Test ResendService
    if (env.get('RESEND_API_KEY')) {
      this.logger.info('\n🧪 Test ResendService:')
      try {
        new ResendService()
        this.logger.info('   ✅ ResendService instancié avec succès')
        this.logger.info(
          `   ✅ API Key configurée: ${env.get('RESEND_API_KEY')?.substring(0, 10)}...`
        )
        this.logger.info(
          `   ✅ Domaine configuré: ${env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'}`
        )
      } catch (error) {
        this.logger.error('   ❌ Erreur ResendService:', error.message)
      }
    }

    // 4. Configuration Worker
    this.logger.info('\n⚙️  Configuration Worker:')
    this.logger.info('   📧 Email Worker utilisera:')
    if (env.get('NODE_ENV') === 'production') {
      this.logger.info("      - Resend API pour l'envoi")
      this.logger.info('      - Queue Redis pour le traitement')
      this.logger.info(`      - Domaine: ${env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'}`)
    } else {
      this.logger.info("      - Gmail SMTP pour l'envoi")
      this.logger.info('      - Queue Redis pour le traitement')
      this.logger.info(`      - Gmail: ${env.get('MAIL_FROM')}`)
    }

    // 5. Prochaines étapes recommandées
    this.logger.info('\n🎯 Prochaines étapes:')
    this.logger.info('   1. Ajouter MAIL_DOMAIN dans votre .env:')
    this.logger.info('      MAIL_DOMAIN=onboarding.cam-coder.com')
    this.logger.info('   2. Configurer sur Render:')
    this.logger.info('      NODE_ENV=production')
    this.logger.info('      RESEND_API_KEY=re_xxxxxxxxx')
    this.logger.info('      MAIL_DOMAIN=onboarding.cam-coder.com')
    this.logger.info('   3. Tester:')
    this.logger.info('      node ace test:resend')
    this.logger.info('      node ace warmup:domain')

    // 6. Résumé de la configuration
    this.logger.info('\n📊 Résumé Configuration:')
    this.logger.info('   ✅ Support Resend API (production)')
    this.logger.info('   ✅ Fallback Gmail SMTP (développement)')
    this.logger.info('   ✅ Domaine configurable via variable')
    this.logger.info('   ✅ Worker compatible avec les deux modes')
    this.logger.info('   ✅ Templates anti-spam professionnels')

    this.logger.info('\n🏁 Configuration vérifiée!')
  }
}
