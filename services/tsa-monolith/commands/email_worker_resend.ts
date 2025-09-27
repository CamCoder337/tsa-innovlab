import { BaseCommand } from '@adonisjs/core/ace'
import env from '#start/env'
import { Redis } from 'ioredis'
import { Resend } from 'resend'
import EmailFilterService from '#services/email_filter_service'

interface EmailData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
  priority?: 'high' | 'normal' | 'low'
  createdAt?: string
}

export default class EmailWorkerResend extends BaseCommand {
  static commandName = 'email:worker-resend'
  static description = 'Worker email utilisant exclusivement Resend API'

  static options = {
    startApp: true,
  }

  private isProcessing = false
  private processInterval = 1000 // 1 seconde
  private maxRetries = 3
  private redis!: Redis
  private resend!: Resend
  private fromAddress!: string

  async run() {
    this.logger.info('📧 Email Worker Resend démarré')

    // Vérifier la configuration Resend
    if (!env.get('RESEND_API_KEY')) {
      this.logger.error("❌ RESEND_API_KEY manquant dans les variables d'environnement")
      process.exit(1)
    }

    // Initialiser Resend
    try {
      this.resend = new Resend(env.get('RESEND_API_KEY'))
      const mailDomain = env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'
      this.fromAddress = `TSA Logistics <contact@${mailDomain}>`
      this.logger.info(`📮 Resend configuré avec domaine: ${mailDomain}`)
    } catch (error) {
      this.logger.error('❌ Erreur initialisation Resend:', error.message)
      process.exit(1)
    }

    // Créer l'instance Redis
    this.redis = new Redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD') || undefined,
      lazyConnect: true,
    })

    // Gestionnaire d'arrêt propre
    process.on('SIGINT', () => this.gracefulShutdown())
    process.on('SIGTERM', () => this.gracefulShutdown())

    // Démarrer le traitement de la queue
    this.processQueue()

    this.logger.info('✅ Email Worker Resend actif - CTRL+C pour arrêter')
    await this.keepAlive()
  }

  private async processQueue() {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      const queueLength = await this.redis.llen('email_queue')

      if (queueLength > 0) {
        this.logger.info(`📧 ${queueLength} emails en attente dans la queue`)

        // Traite jusqu'à 10 emails par lot
        const batch = await this.redis.rpop('email_queue', 10)

        if (batch && batch.length > 0) {
          const promises = batch.map((emailStr) => this.processEmail(emailStr))
          await Promise.allSettled(promises)

          this.logger.info(`📬 Traité ${batch.length} emails`)
        }
      }
    } catch (error) {
      this.logger.error('❌ Erreur traitement queue email:', error.message)
    } finally {
      this.isProcessing = false
      setTimeout(() => this.processQueue(), this.processInterval)
    }
  }

  private async processEmail(emailStr: string, attempt = 1): Promise<void> {
    try {
      const emailData: EmailData = JSON.parse(emailStr)

      // Vérifier si c'est un email de test
      if (EmailFilterService.shouldIgnoreEmail(emailData.to)) {
        this.logger.info(`🚫 Email de test ignoré: ${emailData.to} - ${emailData.subject}`)
        return
      }

      this.logger.info(`📨 Tentative envoi email: ${emailData.subject} → ${emailData.to}`)
      this.logger.info(`📮 Envoi email vers ${emailData.to}`)
      this.logger.info(`   Sujet: ${emailData.subject}`)
      this.logger.info(`   Template: ${emailData.template}`)
      this.logger.info('   🔄 Via Resend API')

      // Créer le HTML basé sur le template et les données
      const html = this.createEmailHTML(emailData.template, emailData.data, emailData.subject)

      // Envoi via Resend
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to: [emailData.to],
        subject: emailData.subject,
        html: html,
        // Headers pour améliorer la délivrabilité
        headers: {
          'X-Entity-Ref-ID': `tsa-${Date.now()}`,
          'List-Unsubscribe': `<mailto:contact@${env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'}>`,
        },
        // Version texte
        text: this.stripHtml(html),
      })

      if (result.error) {
        throw new Error(`Resend API Error: ${result.error.message}`)
      }

      this.logger.info(`✅ Email envoyé avec succès: ${emailData.subject} → ${emailData.to}`)
      this.logger.info(`   ID Resend: ${result.data?.id}`)
    } catch (error) {
      this.logger.error(`❌ Échec email (tentative ${attempt}):`)
      this.logger.error(`Message: ${error?.message || 'Aucun message'}`)
      this.logger.error(`Type: ${typeof error}`)
      this.logger.error(`Email data: ${emailStr}`)

      // Retry logic
      if (attempt < this.maxRetries) {
        this.logger.info(
          `🔄 Nouvelle tentative ${attempt + 1}/${this.maxRetries} dans ${Math.pow(2, attempt)} secondes`
        )
        await this.delay(Math.pow(2, attempt) * 1000)
        return this.processEmail(emailStr, attempt + 1)
      }

      // Après max retries, stocker dans une DLQ
      await this.redis.lpush('email_failed_queue', emailStr)
      this.logger.error('☠️ Email déplacé vers failed queue après échec définitif')
    }
  }

  private createEmailHTML(template: string, data: any, subject: string): string {
    // Utiliser le bon domaine selon l'environnement
    const getFrontendUrl = () => {
      if (env.get('NODE_ENV') === 'production') {
        return env.get('FRONTEND_PRODUCTION_URL') || 'https://tsa-logistics.com'
      }
      return env.get('FRONTEND_URL') || 'http://localhost:5173'
    }
    // Templates HTML personnalisés pour chaque type d'email
    const baseStyle = `
      font-family: Arial, sans-serif; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
      line-height: 1.6;
    `

    const headerStyle = `
      background: #2c3e50; 
      color: white; 
      padding: 20px; 
      text-align: center; 
      border-radius: 8px 8px 0 0;
    `

    const contentStyle = `
      background: #f8f9fa; 
      padding: 30px; 
      border-radius: 0 0 8px 8px;
    `

    const buttonStyle = `
      background: #3498db; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      display: inline-block;
      margin: 20px 0;
    `

    // Template de base professionnel
    let content = ''

    switch (template) {
      case 'emails/verify_email':
        // Utiliser le domaine approprié pour les liens
        const verificationUrl = data.verificationUrl?.replace(
          'http://localhost:5173',
          getFrontendUrl()
        )
        content = `
          <p>Bonjour <strong>${data.userName || 'Utilisateur'}</strong>,</p>
          <p>Merci de vous être inscrit sur TSA Logistics. Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" style="${buttonStyle}">Vérifier mon email</a>
          </div>
          <p><strong>Ce lien expire dans ${data.expiresIn || '24 heures'}.</strong></p>
          <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
        `
        break

      case 'emails/welcome':
        // Ne pas inclure de liens en production pour éviter les problèmes de domaine
        content = `
          <p>Bienvenue <strong>${data.userName || 'Utilisateur'}</strong> !</p>
          <p>Votre compte TSA Logistics a été créé avec succès. Vous êtes maintenant <strong>${data.role || 'utilisateur'}</strong> de notre plateforme.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Fonctionnalités disponibles :</h3>
            <ul>
              ${(data.features || []).map((feature: string) => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
          <p style="text-align: center; color: #666;">
            <strong>Vous pouvez maintenant vous connecter à votre tableau de bord TSA Logistics.</strong>
          </p>
        `
        break

      case 'emails/password_reset':
        // Utiliser le domaine approprié pour les liens
        const resetUrl = data.resetUrl?.replace('http://localhost:5173', getFrontendUrl())
        content = `
          <p>Bonjour <strong>${data.userName || 'Utilisateur'}</strong>,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe TSA Logistics.</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" style="${buttonStyle}">Réinitialiser mon mot de passe</a>
          </div>
          <p><strong>Ce lien expire dans ${data.expiresIn || '1 heure'}.</strong></p>
          <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
        `
        break

      default:
        // Template générique
        content = `
          <p>Bonjour <strong>${data.userName || 'Utilisateur'}</strong>,</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${Object.entries(data)
              .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
              .join('')}
          </div>
        `
        break
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0;">TSA Logistics</h1>
          <p style="margin: 10px 0 0 0;">Solutions logistiques au Cameroun</p>
        </div>
        <div style="${contentStyle}">
          ${content}
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; text-align: center;">
            Pour toute question, contactez-nous à 
            <a href="mailto:contact@${env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'}">contact@${env.get('MAIL_DOMAIN') || 'onboarding.cam-coder.com'}</a>
          </p>
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} TSA Logistics - Tous droits réservés
          </p>
        </div>
      </body>
      </html>
    `
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private async gracefulShutdown() {
    this.logger.info('🛑 Arrêt gracieux du worker Resend...')
    this.isProcessing = false
    process.exit(0)
  }

  private async keepAlive(): Promise<never> {
    return new Promise(() => {})
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
