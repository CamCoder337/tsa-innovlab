import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ResendService from '#services/resend_service'
import env from '#start/env'

export default class WarmupDomain extends BaseCommand {
  static commandName = 'warmup:domain'
  static description = 'Réchauffe le domaine avec des emails progressifs'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🔥 Réchauffement du domaine onboarding.cam-coder.com')

    const resendService = new ResendService()
    const targetEmail = 'camcoder337@gmail.com' // Votre email principal

    this.logger.info("📧 Envoi d'emails de réchauffement...")

    try {
      // Email 1: Simple et court
      await this.sendWarmupEmail(resendService, targetEmail, 1)
      await this.delay(5000) // 5 secondes d'attente

      // Email 2: Plus de contenu
      await this.sendWarmupEmail(resendService, targetEmail, 2)
      await this.delay(5000)

      // Email 3: Email professionnel complet
      await this.sendWarmupEmail(resendService, targetEmail, 3)

      this.logger.success('✅ Réchauffement terminé!')
      this.logger.info('\n📋 Actions recommandées:')
      this.logger.info('1. Vérifiez votre Gmail et marquez TOUS les emails comme "Non spam"')
      this.logger.info('2. Répondez à au moins un email')
      this.logger.info('3. Ajoutez noreply@onboarding.cam-coder.com à vos contacts')
      this.logger.info('4. Créez un filtre Gmail pour ce domaine')
      this.logger.info('5. Répétez cette opération dans 24h')
    } catch (error) {
      this.logger.error('❌ Erreur réchauffement:', error.message)
    }
  }

  private async sendWarmupEmail(resendService: ResendService, email: string, step: number) {
    const subjects = [
      'Test simple TSA Logistics',
      'Notification importante - TSA Logistics',
      "Bienvenue dans l'écosystème TSA Logistics",
    ]

    const htmlContents = [
      // Email 1: Simple
      `<p>Bonjour,</p><p>Ceci est un test simple de notre système de messagerie.</p><p>Cordialement,<br>TSA Logistics</p>`,

      // Email 2: Moyen
      `<div style="font-family: Arial, sans-serif;">
        <h2>TSA Logistics</h2>
        <p>Bonjour,</p>
        <p>Nous testons notre système d'emails transactionnels.</p>
        <p>Notre plateforme offre:</p>
        <ul>
          <li>Gestion logistique</li>
          <li>Suivi en temps réel</li>
          <li>Optimisation des routes</li>
        </ul>
        <p>Merci de votre attention.</p>
        <p>L'équipe TSA Logistics</p>
      </div>`,

      // Email 3: Complet et professionnel
      `<!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>TSA Logistics</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h1 style="color: #2c3e50; text-align: center;">TSA Logistics</h1>
          <p>Cher partenaire,</p>
          <p>Nous sommes ravis de vous présenter notre plateforme de gestion logistique innovante au Cameroun.</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Nos Services:</h3>
            <ul>
              <li>🚛 Gestion de flotte</li>
              <li>📦 Suivi des expéditions</li>
              <li>📊 Analytics avancés</li>
              <li>🌍 Couverture nationale</li>
            </ul>
          </div>
          <p>Pour plus d'informations: <a href="${env.get('FRONTEND_URL')}">tsa-logistics.com</a></p>
          <hr style="border: none; border-top: 1px solid #eee;">
          <p style="color: #666; text-align: center;">
            © ${new Date().getFullYear()} TSA Logistics - Cameroun<br>
            Solutions logistiques de nouvelle génération
          </p>
        </div>
      </body>
      </html>`,
    ]

    await resendService.send({
      to: email,
      subject: subjects[step - 1],
      html: htmlContents[step - 1],
      from: `TSA Logistics <contact@${env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'}>`,
    })

    this.logger.info(`✅ Email ${step}/3 envoyé: ${subjects[step - 1]}`)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
