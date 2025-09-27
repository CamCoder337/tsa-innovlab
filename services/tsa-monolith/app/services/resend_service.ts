import { Resend } from 'resend'
import env from '#start/env'
import { inject } from '@adonisjs/core'

export interface ResendEmailData {
  to: string
  subject: string
  html: string
  from?: string
}

@inject()
export default class ResendService {
  private resend: Resend

  constructor() {
    this.resend = new Resend(env.get('RESEND_API_KEY'))
  }

  /**
   * Envoie un email via l'API Resend
   */
  async send(emailData: ResendEmailData): Promise<void> {
    try {
      // Utiliser le domaine configuré via variable d'environnement
      const mailDomain = env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'
      const fromAddress = emailData.from || `TSA Logistics <contact@${mailDomain}>`

      console.log(`🔍 DEBUG - Resend API Key: ${env.get('RESEND_API_KEY')?.substring(0, 10)}...`)
      console.log(`🔍 DEBUG - From: ${fromAddress}`)
      console.log(`🔍 DEBUG - To: ${emailData.to}`)

      const result = await this.resend.emails.send({
        from: fromAddress,
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        // Headers pour améliorer la délivrabilité
        headers: {
          'X-Entity-Ref-ID': `tsa-${Date.now()}`,
          'List-Unsubscribe': `<mailto:unsubscribe@onboarding.cam-coder.com>`,
        },
        // Ajouter une version texte
        text: emailData.html
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
      })

      console.log(`✅ Resend email sent successfully:`, result)

      // Vérifier si on a vraiment une erreur
      if (result.error) {
        throw new Error(`Resend API Error: ${result.error.message}`)
      }
    } catch (error) {
      console.error(`❌ Resend email failed:`, error)
      console.error(`❌ Error details:`, JSON.stringify(error, null, 2))
      throw error
    }
  }

  /**
   * Vérifie si Resend est correctement configuré
   */
  isConfigured(): boolean {
    return !!env.get('RESEND_API_KEY')
  }

  /**
   * Teste la connexion à Resend
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test simple d'envoi à nous-mêmes
      await this.send({
        to: env.get('MAIL_FROM'),
        subject: 'Test Resend - ' + new Date().toISOString(),
        html: '<p>Test de connexion Resend réussi !</p>',
      })
      return true
    } catch (error) {
      console.error('Test Resend échoué:', error)
      return false
    }
  }
}
