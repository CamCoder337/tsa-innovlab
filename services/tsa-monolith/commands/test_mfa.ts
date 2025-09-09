import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import * as OTPAuth from 'otpauth'

export default class TestMfa extends BaseCommand {
  static commandName = 'test:mfa'
  static description = 'Test MFA token generation'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const secret = 'T7O5IZOGBESYY4ULKSBXOS45XO33GRPC'

    const totp = new OTPAuth.TOTP({
      issuer: 'TSA Logistics',
      label: 'ffredy337@gmail.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    })

    this.logger.info('=== Test MFA ===')
    this.logger.info(`Secret: ${secret}`)
    this.logger.info(`Current token: ${totp.generate()}`)
    this.logger.info(`TOTP URL: ${totp.toString()}`)

    // Test validation
    const currentToken = totp.generate()
    const isValid = totp.validate({ token: currentToken, window: 5 })

    this.logger.info(`Token validation: ${isValid !== null ? '✅ Valid' : '❌ Invalid'}`)
  }
}
