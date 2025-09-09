import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import MfaRecoveryCode from '#models/mfa_recovery_code'
import Database from '@adonisjs/lucid/services/db'

export default class CleanupInconsistentUsers extends BaseCommand {
  static commandName = 'cleanup:users'
  static description = 'Clean up inconsistent users (admin with mfa_enabled=false)'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting cleanup of inconsistent users...')

    // Find admin users with MFA disabled
    const inconsistentUsers = await User.query()
      .where('role', 'admin')
      .where('mfa_enabled', false)

    if (inconsistentUsers.length === 0) {
      this.logger.success('No inconsistent users found.')
      return
    }

    this.logger.info(`Found ${inconsistentUsers.length} inconsistent admin users:`)

    for (const user of inconsistentUsers) {
      this.logger.info(`- ${user.email} (ID: ${user.id}) - Status: ${user.status}`)
    }

    // Ask for confirmation
    const shouldDelete = await this.prompt.confirm(
      'Do you want to delete these inconsistent admin users? This action cannot be undone.'
    )

    if (!shouldDelete) {
      this.logger.info('Operation cancelled.')
      return
    }

    // Delete users and their related data in transaction
    await Database.transaction(async (trx) => {
      for (const user of inconsistentUsers) {
        this.logger.info(`Deleting user: ${user.email}`)
        
        // Delete MFA recovery codes
        await MfaRecoveryCode.query({ client: trx })
          .where('userId', user.id)
          .delete()

        // Delete the user
        await user.useTransaction(trx).delete()
      }
    })

    this.logger.success(`Successfully deleted ${inconsistentUsers.length} inconsistent users.`)
  }
}