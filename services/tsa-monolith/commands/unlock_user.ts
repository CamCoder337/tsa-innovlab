import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import CacheService from '#services/cache_service'

export default class UnlockUser extends BaseCommand {
  static commandName = 'unlock:user'
  static description = 'Unlock user from rate limiting'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const email = await this.prompt.ask('Enter email to unlock:')
    
    if (!email) {
      this.logger.error('Email is required')
      return
    }

    try {
      const cacheService = new CacheService()
      const rateLimitKey = `rate:login:${email.toLowerCase()}`
      
      // Check if user is actually rate limited
      const deletedCount = await cacheService.delete(rateLimitKey)
      
      if (deletedCount > 0) {
        this.logger.success(`✅ User ${email} has been unlocked from rate limiting`)
      } else {
        this.logger.info(`ℹ️  User ${email} was not rate limited`)
      }
      
      // Also clear any other potential keys
      const pattern = `*rate*login*${email.toLowerCase()}*`
      await cacheService.flushPattern(pattern)
      
    } catch (error) {
      this.logger.error(`❌ Failed to unlock user: ${error.message}`)
    }
  }
}