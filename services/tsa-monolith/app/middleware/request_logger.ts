import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware pour logger les requêtes entrantes
 */
export default class RequestLogger {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const url = request.url()
    const method = request.method()
    const ip = request.ip()
    const start = Date.now()

    // Ne pas logger les requêtes de santé et WebSocket
    if (url.startsWith('/health') || url.startsWith('/ws')) {
      return next()
    }

    // Formater la date pour les logs
    const logTime = () => new Date().toISOString().replace('T', ' ').replace(/\..+/, '')

    // Logger la requête entrante avec des caractères ASCII simples
    console.log(`[${logTime()}] [REQ] ${method} ${url} - IP: ${ip}`)

    try {
      await next()
    } catch (error) {
      console.error(`[${logTime()}] [ERR] ${method} ${url} - Error: ${error.message}`)
      throw error
    } finally {
      const responseTime = Date.now() - start
      console.log(
        `[${logTime()}] [RES] ${method} ${url} - ` +
          `Status: ${response.getStatus()} (${responseTime}ms)`
      )
    }
  }
}
