import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export default class TestEmail extends BaseCommand {
  static commandName = 'test:email'
  static description = 'Test email sending directly'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const testEmail = await this.prompt.ask('Enter email to test with:')

    try {
      this.logger.info('Testing direct email sending...')

      await mail.send((message) => {
        message
          .from(`TSA Logistics <${env.get('MAIL_FROM')}>`)
          .to(testEmail)
          .subject('🧪 Test Email - TSA Logistics').html(`
            <h1>Test Email</h1>
            <p>Si vous recevez cet email, la configuration SMTP Gmail fonctionne !</p>
            <p>Envoyé le: ${new Date().toLocaleString()}</p>
            <hr>
            <small>Configuration:</small>
            <ul>
              <li>SMTP Host: ${env.get('SMTP_HOST')}</li>
              <li>SMTP Port: ${env.get('SMTP_PORT')}</li>
              <li>From: ${env.get('MAIL_FROM')}</li>
            </ul>
          `)
      })

      this.logger.success('✅ Email sent successfully!')
    } catch (error) {
      this.logger.error('❌ Email sending failed:')
      this.logger.error(error.message)

      if (error.code) {
        this.logger.error(`Error code: ${error.code}`)
      }
    }
  }
}
