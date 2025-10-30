import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'
import AIService from '#services/ai_service'

/**
 * Health Check Controller
 * Endpoints pour monitoring et orchestration
 */
export default class HealthController {
  private aiService: AIService
  private startTime: number

  constructor() {
    this.aiService = new AIService()
    this.startTime = Date.now()
  }

  /**
   * Health check complet
   * GET /health
   */
  async index({ response }: HttpContext) {
    try {
      const checks = await Promise.allSettled([
        this._checkDatabase(),
        this._checkRedis(),
        this._checkAIService(),
        this._checkDiskSpace(),
        this._checkMemory(),
      ])

      const [database, redis, aiService, disk, memory] = checks.map((result) =>
        result.status === 'fulfilled' ? result.value : { status: 'unhealthy', error: result.reason }
      )

      const allHealthy =
        database.status === 'healthy' &&
        redis.status === 'healthy' &&
        aiService.status === 'healthy'

      const overallStatus = allHealthy ? 'healthy' : 'degraded'

      return response.status(allHealthy ? 200 : 503).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: this._getUptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database,
          redis,
          aiService,
          disk,
          memory,
        },
      })
    } catch (error) {
      return response.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      })
    }
  }

  /**
   * Liveness probe (Kubernetes)
   * GET /health/live
   */
  async live({ response }: HttpContext) {
    return response.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Readiness probe (Kubernetes)
   * GET /health/ready
   */
  async ready({ response }: HttpContext) {
    try {
      // Vérifications critiques seulement
      const dbCheck = await this._checkDatabase()
      const redisCheck = await this._checkRedis()

      const isReady = dbCheck.status === 'healthy' && redisCheck.status === 'healthy'

      return response.status(isReady ? 200 : 503).json({
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbCheck.status,
          redis: redisCheck.status,
        },
      })
    } catch (error) {
      return response.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      })
    }
  }

  /**
   * Vérification base de données
   */
  private async _checkDatabase() {
    try {
      const startTime = Date.now()
      await db.rawQuery('SELECT 1')
      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connection: 'active',
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      }
    }
  }

  /**
   * Vérification Redis
   */
  private async _checkRedis() {
    try {
      const startTime = Date.now()
      await redis.ping()
      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connection: 'active',
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      }
    }
  }

  /**
   * Vérification service AI
   */
  private async _checkAIService() {
    try {
      const startTime = Date.now()
      const isHealthy = await this.aiService.checkHealth()
      const responseTime = Date.now() - startTime

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: `${responseTime}ms`,
        url: process.env.FASTAPI_BASE_URL,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      }
    }
  }

  /**
   * Vérification espace disque
   */
  private async _checkDiskSpace() {
    try {
      const { execSync } = await import('child_process')
      const output = execSync("df -h / | tail -1 | awk '{print $5}'").toString().trim()
      const usage = parseInt(output.replace('%', ''))

      return {
        status: usage < 90 ? 'healthy' : 'warning',
        usage: `${usage}%`,
        threshold: '90%',
      }
    } catch (error) {
      return {
        status: 'unknown',
        error: 'Unable to check disk space',
      }
    }
  }

  /**
   * Vérification mémoire
   */
  private async _checkMemory() {
    try {
      const used = process.memoryUsage()
      const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024)
      const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024)
      const usage = Math.round((heapUsedMB / heapTotalMB) * 100)

      return {
        status: usage < 90 ? 'healthy' : 'warning',
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        usage: `${usage}%`,
      }
    } catch (error) {
      return {
        status: 'unknown',
        error: 'Unable to check memory',
      }
    }
  }

  /**
   * Calcule l'uptime
   */
  private _getUptime(): string {
    const uptimeMs = Date.now() - this.startTime
    const seconds = Math.floor(uptimeMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }
}
