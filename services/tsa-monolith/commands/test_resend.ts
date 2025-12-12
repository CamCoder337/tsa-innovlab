import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ResendService from '#services/resend_service'
import env from '#start/env'

export default class TestResend extends BaseCommand {
  static commandName = 'test:resend'
  static description = 'Test email sending via Resend API'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🧪 Test Resend API...')

    const resendService = new ResendService()

    // Vérifier la configuration
    if (!resendService.isConfigured()) {
      this.logger.error('❌ Resend pas configuré - Variable RESEND_API_KEY manquante')
      return
    }

    this.logger.info('✅ Resend configuré')

    // Test d'envoi avec domaine vérifié - pas de limitation
    this.logger.info('🌐 Domaine onboarding.cam-coder.com vérifié - Envoi libre')
    const testEmail = await this.prompt.ask('Email de test (ou ENTER pour camcoder337@gmail.com):')
    const emailTo = testEmail || 'camcoder337@gmail.com'

    try {
      await resendService.send({
        to: emailTo,
        subject: 'Bienvenue sur TSA Logistics - Vérification de votre compte',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenue sur TSA Logistics</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
              <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
                TSA Logistics
              </h1>

              <p>Bonjour,</p>

              <p>Nous vous remercions d'avoir créé votre compte sur TSA Logistics, la plateforme leader pour la gestion logistique au Cameroun.</p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
                <p style="margin: 0;"><strong>Votre compte a été créé avec succès.</strong></p>
                <p style="margin: 5px 0 0 0; color: #666;">Date: ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>

              <p>Notre plateforme vous permet de :</p>
              <ul>
                <li>Gérer vos missions de transport</li>
                <li>Optimiser vos itinéraires</li>
                <li>Suivre vos expéditions en temps réel</li>
                <li>Accéder à des analyses détaillées</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${env.get('FRONTEND_URL')}/app"
                   style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Accéder à mon tableau de bord
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #666; font-size: 14px;">
                Si vous avez des questions, notre équipe support est disponible à
                <a href="mailto:support@cam-coder.com">support@cam-coder.com</a>
              </p>

              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
                © ${new Date().getFullYear()} TSA Logistics - Tous droits réservés<br>
                Cameroun - Solutions logistiques innovantes
              </p>
            </div>
          </body>
          </html>
        `,
        // Utiliser le domaine configuré via variable d'environnement
        from: `TSA Logistics <contact@${env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'}>`,
      })

      this.logger.success(`✅ Email Resend envoyé avec succès vers ${emailTo}`)

      // Afficher plus d'infos de debug
      this.logger.info('📋 Vérifiez :')
      this.logger.info('   1. Boîte de réception Gmail')
      this.logger.info('   2. Dossier SPAM/Indésirables')
      this.logger.info('   3. Dashboard Resend pour le statut de livraison')
      this.logger.info('   4. Logs Resend sur https://resend.com/emails')
    } catch (error) {
      this.logger.error('❌ Erreur Resend:')
      this.logger.error(`Message: ${error.message}`)
      this.logger.error(`Type: ${error.constructor.name}`)
      console.error('Erreur complète:', error)
    }
  }
}
