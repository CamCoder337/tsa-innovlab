import { BaseCommand } from '@adonisjs/core/ace'
import env from '#start/env'
import { Redis } from 'ioredis'

export default class Diagnose extends BaseCommand {
  static commandName = 'diagnose'
  static description = 'Diagnostique le système (Redis, Mail, etc.)'

  async run() {
    this.logger.info('🔍 Diagnostic du système TSA...')

    // Test Redis
    this.logger.info(`🔍 Configuration Redis:`)
    this.logger.info(`  - REDIS_HOST: ${env.get('REDIS_HOST')}`)
    this.logger.info(`  - REDIS_PORT: ${env.get('REDIS_PORT')}`)
    this.logger.info(`  - REDIS_PASSWORD: ${env.get('REDIS_PASSWORD') ? '[DÉFINI]' : '[VIDE]'}`)

    try {
      this.logger.info('📡 Tentative de connexion Redis...')

      // Créer une instance Redis directe
      const redis = new Redis({
        host: env.get('REDIS_HOST'),
        port: env.get('REDIS_PORT'),
        password: env.get('REDIS_PASSWORD') || undefined,
        lazyConnect: true,
      })
      await redis.ping()
      this.logger.info('✅ Redis: PING réussi')

      await redis.set('test-key', 'test-value', 'EX', 10)
      this.logger.info('✅ Redis: SET réussi')

      const value = await redis.get('test-key')
      if (value === 'test-value') {
        this.logger.info('✅ Redis: GET réussi - Connexion complètement OK')
      } else {
        this.logger.error(`❌ Redis: Valeur incorrecte - Attendu: 'test-value', Reçu: '${value}'`)
      }
      await redis.del('test-key')
      await redis.quit()
    } catch (error) {
      this.logger.error('❌ Redis: Erreur de connexion:')
      console.error('DEBUG Error object:', error)
      console.error('DEBUG Error type:', typeof error)
      console.error('DEBUG Error constructor:', error?.constructor?.name)

      if (error instanceof Error) {
        this.logger.error('Message: ' + error.message)
        this.logger.error('Stack: ' + (error.stack || 'No stack trace'))
      } else {
        this.logger.error('Erreur non-Error: ' + String(error))
      }

      // Le problème vient probablement de la configuration réseau ou Docker
      this.logger.info('💡 Vérifiez que Redis est bien démarré et accessible')
    }

    // Test configuration Mail
    try {
      this.logger.info(`📧 Configuration Mail:`)
      this.logger.info(`  - SMTP_HOST: ${env.get('SMTP_HOST')}`)
      this.logger.info(`  - SMTP_PORT: ${env.get('SMTP_PORT')}`)
      this.logger.info(`  - MAIL_FROM: ${env.get('MAIL_FROM')}`)
      this.logger.info(`  - FRONTEND_URL: ${env.get('FRONTEND_URL')}`)
      this.logger.info('✅ Configuration Mail: OK')
    } catch (error) {
      this.logger.error('❌ Configuration Mail: Erreur', error.message)
    }

    // Test queue email
    try {
      const redis = new Redis({
        host: env.get('REDIS_HOST'),
        port: env.get('REDIS_PORT'),
        password: env.get('REDIS_PASSWORD') || undefined,
        lazyConnect: true,
      })
      const queueLength = await redis.llen('email_queue')
      const failedLength = await redis.llen('email_failed_queue')

      this.logger.info(`📬 Queue Email:`)
      this.logger.info(`  - En attente: ${queueLength}`)
      this.logger.info(`  - Échoués: ${failedLength}`)

      if (queueLength > 0) {
        this.logger.info('⚠️  Il y a des emails en attente dans la queue')
      }

      if (failedLength > 0) {
        this.logger.info('⚠️  Il y a des emails échoués dans la DLQ')
      }
    } catch (error) {
      this.logger.error('❌ Queue Email: Erreur', error.message)
    }

    // Test email simple
    try {
      const testEmailData = {
        to: env.get('SMTP_USERNAME'),
        subject: 'Test TSA Logistics',
        template: 'test', // On va créer ce template
        data: { message: 'Test email depuis TSA Logistics' },
      }

      const redis = new Redis({
        host: env.get('REDIS_HOST'),
        port: env.get('REDIS_PORT'),
        password: env.get('REDIS_PASSWORD') || undefined,
        lazyConnect: true,
      })
      await redis.lpush('email_queue', JSON.stringify(testEmailData))
      this.logger.info('✅ Email de test ajouté à la queue')
    } catch (error) {
      this.logger.error('❌ Test email: Erreur', error.message)
    }

    this.logger.info('🏁 Diagnostic terminé')
  }
}
