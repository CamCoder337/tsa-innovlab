import { BaseCommand } from '@adonisjs/core/ace'
import env from '#start/env'
import { Redis } from 'ioredis'
import mail from '@adonisjs/mail/services/main'
import EmailFilterService from '#services/email_filter_service'

interface EmailData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
  priority?: 'high' | 'normal' | 'low'
  createdAt?: string
}

export default class EmailWorkerSimple extends BaseCommand {
  static commandName = 'email:worker-simple'
  static description = 'Lance le worker de traitement des emails (version simple)'

  static options = {
    startApp: true,
  }

  private isProcessing = false
  private processInterval = 1000
  private maxRetries = 3
  private from = `TSA Logistics <${env.get('MAIL_FROM')}>`
  private redis!: Redis

  async run() {
    this.logger.info('📧 Email Worker Simple démarré')

    this.redis = new Redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD') || undefined,
      lazyConnect: true,
    })

    this.logger.info('📮 Mode: Gmail SMTP uniquement')

    process.on('SIGINT', () => this.gracefulShutdown())
    process.on('SIGTERM', () => this.gracefulShutdown())

    this.processQueue()

    this.logger.info('✅ Email Worker actif - CTRL+C pour arrêter')
    await this.keepAlive()
  }

  private async processQueue() {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      const queueLength = await this.redis.llen('email_queue')

      if (queueLength > 0) {
        this.logger.info(`📧 ${queueLength} emails en attente dans la queue`)

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

      if (EmailFilterService.shouldIgnoreEmail(emailData.to)) {
        this.logger.info(`🚫 Email de test ignoré: ${emailData.to} - ${emailData.subject}`)
        return
      }

      this.logger.info(`📨 Tentative envoi email: ${emailData.subject} → ${emailData.to}`)
      this.logger.info(`📮 Envoi email vers ${emailData.to}`)
      this.logger.info(`   Sujet: ${emailData.subject}`)
      this.logger.info(`   Template: ${emailData.template}`)
      this.logger.info('   🔄 Via Gmail SMTP')

      await mail.send((message) => {
        message
          .from(this.from)
          .to(emailData.to)
          .subject(emailData.subject)
          .htmlView(emailData.template, emailData.data)
      })

      this.logger.info(`✅ Email envoyé avec succès: ${emailData.subject} → ${emailData.to}`)
    } catch (error) {
      this.logger.error(`❌ Échec email (tentative ${attempt}):`)
      this.logger.error(`Message: ${error?.message || 'Aucun message'}`)

      if (attempt < this.maxRetries) {
        this.logger.info(
          `🔄 Nouvelle tentative ${attempt + 1}/${this.maxRetries} dans ${Math.pow(2, attempt)} secondes`
        )
        await this.delay(Math.pow(2, attempt) * 1000)
        return this.processEmail(emailStr, attempt + 1)
      }

      await this.redis.lpush('email_failed_queue', emailStr)
      this.logger.error('☠️ Email déplacé vers failed queue après échec définitif')
    }
  }

  private async gracefulShutdown() {
    this.logger.info('🛑 Arrêt gracieux du worker...')
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
