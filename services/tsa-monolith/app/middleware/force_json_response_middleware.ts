import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Updating the "Accept" header to always accept "application/json" response
 * from the server. This will force the internals of the framework like
 * validator errors or auth errors to return a JSON response.
 *
 * EXCEPTION: Exclut les routes Transmit SSE (/__transmit/*) qui nécessitent text/event-stream
 */
export default class ForceJsonResponseMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    const url = request.url()

    // Ne pas forcer JSON pour TOUTES les routes Transmit (/__transmit/*)
    if (url.startsWith('/__transmit')) {
      console.log(
        '⚡ Route Transmit détectée, conservation du header Accept original:',
        request.header('accept')
      )
      return next()
    }

    const headers = request.headers()
    headers.accept = 'application/json'

    return next()
  }
}
