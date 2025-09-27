import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class TestDns extends BaseCommand {
  static commandName = 'test:dns'
  static description = 'Test DNS configuration for email delivery'

  static options: CommandOptions = {
    startApp: false,
  }

  async run() {
    this.logger.info('🔍 Test de configuration DNS pour onboarding.cam-coder.com')

    const domain = 'onboarding.cam-coder.com'

    // Test SPF
    this.logger.info('\n📧 Test SPF:')
    try {
      const spfCommand = `dig TXT send.${domain} +short`
      this.logger.info(`Commande: ${spfCommand}`)
      this.logger.info('Résultat attendu: "v=spf1 include:amazonses.com ~all"')
    } catch (error) {
      this.logger.error('Erreur SPF:', error.message)
    }

    // Test DKIM
    this.logger.info('\n🔐 Test DKIM:')
    try {
      const dkimCommand = `dig TXT resend._domainkey.${domain} +short`
      this.logger.info(`Commande: ${dkimCommand}`)
      this.logger.info('Doit retourner la clé publique DKIM')
    } catch (error) {
      this.logger.error('Erreur DKIM:', error.message)
    }

    // Test DMARC
    this.logger.info('\n🛡️ Test DMARC:')
    try {
      const dmarcCommand = `dig TXT _dmarc.${domain} +short`
      this.logger.info(`Commande: ${dmarcCommand}`)
      this.logger.info('Résultat: "v=DMARC1; p=none;"')
    } catch (error) {
      this.logger.error('Erreur DMARC:', error.message)
    }

    // Test MX
    this.logger.info('\n📮 Test MX:')
    try {
      const mxCommand = `dig MX send.${domain} +short`
      this.logger.info(`Commande: ${mxCommand}`)
      this.logger.info('Résultat: "10 feedback-smtp.eu-west-1.amazonses.com"')
    } catch (error) {
      this.logger.error('Erreur MX:', error.message)
    }

    this.logger.info('\n🧪 Pour tester manuellement:')
    this.logger.info('1. Ouvrez un terminal')
    this.logger.info('2. Exécutez ces commandes pour vérifier:')
    this.logger.info(`   dig TXT send.${domain} +short`)
    this.logger.info(`   dig TXT resend._domainkey.${domain} +short`)
    this.logger.info(`   dig TXT _dmarc.${domain} +short`)
    this.logger.info(`   dig MX send.${domain} +short`)

    this.logger.info('\n📊 Outils en ligne pour tester:')
    this.logger.info('- https://mxtoolbox.com/spf.aspx')
    this.logger.info('- https://dmarcian.com/dmarc-inspector/')
    this.logger.info('- https://mail-tester.com/ (score spam)')

    this.logger.info('\n✅ Si tous les DNS sont OK mais emails en spam:')
    this.logger.info('1. Le domaine est nouveau (réchauffement nécessaire)')
    this.logger.info('2. Gmail apprend progressivement votre réputation')
    this.logger.info('3. Marquez manuellement comme "Non spam" plusieurs fois')
    this.logger.info('4. Demandez aux utilisateurs test de faire de même')
  }
}
