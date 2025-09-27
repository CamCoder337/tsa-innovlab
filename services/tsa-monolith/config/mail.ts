import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  // Toujours utiliser SMTP pour AdonisJS Mail
  // Le choix Resend vs SMTP se fait dans EmailService et le Worker
  default: 'smtp',

  /**
   * The mailer object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    // Gmail SMTP - utilisé par AdonisJS Mail en développement
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: env.get('SMTP_PORT') === '465', // SSL pour port 465, STARTTLS pour 587
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME'),
        pass: env.get('SMTP_PASSWORD'),
      },
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
