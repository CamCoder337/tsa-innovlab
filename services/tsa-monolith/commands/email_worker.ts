import { BaseCommand } from '@adonisjs/core/ace'
import env from '#start/env'
import { Redis } from 'ioredis'

interface EmailData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
  priority?: 'high' | 'normal' | 'low'
  createdAt?: string
}

export default class EmailWorker extends BaseCommand {
  static commandName = 'email:worker'
  static description = 'Lance le worker de traitement des emails en arrière-plan'

  private isProcessing = false
  private processInterval = 1000 // 1 seconde
  private maxRetries = 3
  // private from = `TSA Logistics <${env.get('MAIL_FROM')}>` // Unused for now
  private redis!: Redis

  async run() {
    this.logger.info('📧 Email Worker démarré')

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

    // Garde le processus en vie
    this.logger.info('✅ Email Worker actif - CTRL+C pour arrêter')
    await this.keepAlive()
  }

  private async processQueue() {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      // Vérifier la connexion Redis
      const queueLength = await this.redis.llen('email_queue')

      if (queueLength > 0) {
        this.logger.info(`📧 ${queueLength} emails en attente dans la queue`)

        // Traite jusqu'à 10 emails par lot pour optimiser
        const batch = await this.redis.rpop('email_queue', 10)

        if (batch && batch.length > 0) {
          const promises = batch.map((emailStr) => this.processEmail(emailStr))
          await Promise.allSettled(promises)

          this.logger.info(`📬 Traité ${batch.length} emails`)
        }
      }
    } catch (error) {
      this.logger.error('❌ Erreur traitement queue email:')
      console.error('DEBUG Error object:', error)
      console.error('DEBUG Error type:', typeof error)
      console.error('DEBUG Error constructor:', error?.constructor?.name)

      if (error instanceof Error) {
        this.logger.error('Message: ' + error.message)
        this.logger.error('Stack: ' + (error.stack || 'No stack trace'))
      } else {
        this.logger.error('Erreur non-Error: ' + String(error))
      }
    } finally {
      this.isProcessing = false
      // Continue le traitement avec intervalle plus long si pas d'emails
      setTimeout(() => this.processQueue(), this.processInterval)
    }
  }

  private async processEmail(emailStr: string, attempt = 1): Promise<void> {
    try {
      this.logger.info(`📧 Processing email data: ${emailStr.substring(0, 100)}...`)
      const emailData: EmailData = JSON.parse(emailStr)

      this.logger.info(`📨 Tentative envoi email: ${emailData.subject} → ${emailData.to}`)

      // Pour l'instant, simuler l'envoi d'email
      this.logger.info(`📮 Simulation envoi email vers ${emailData.to}`)
      this.logger.info(`   Sujet: ${emailData.subject}`)
      this.logger.info(`   Template: ${emailData.template}`)

      // TODO: Configurer le vrai service mail
      // await mail.send((message) => {
      //   message
      //     .from(this.from)
      //     .to(emailData.to)
      //     .subject(emailData.subject)
      //     .htmlView(emailData.template, emailData.data)
      // })

      this.logger.info(`✅ Email envoyé avec succès: ${emailData.subject} → ${emailData.to}`)
    } catch (error) {
      this.logger.error(`❌ Échec email (tentative ${attempt}):`, error.message)
      this.logger.error(`Email data: ${emailStr}`)

      // Retry logic
      if (attempt < this.maxRetries) {
        this.logger.info(
          `🔄 Nouvelle tentative ${attempt + 1}/${this.maxRetries} dans ${Math.pow(2, attempt)} secondes`
        )
        await this.delay(Math.pow(2, attempt) * 1000) // Exponential backoff
        return this.processEmail(emailStr, attempt + 1)
      }

      // Après max retries, stocker dans une DLQ (Dead Letter Queue)
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
    return new Promise(() => {
      // Garde le processus vivant indéfiniment
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
