import env from '#start/env'
import { defineConfig } from '@adonisjs/core/logger'

const loggerConfig = defineConfig({
  default: 'app',

  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL', 'info'),

      // Configuration personnalisée pour la console
      transport:
        env.get('NODE_ENV') === 'production'
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname',
                messageFormat: '{msg}',
                singleLine: true,
                sync: true,
                // Forcer l'encodage UTF-8 pour Windows
                customPrettifiers: {},
                // Utiliser des caractères ASCII simples pour éviter les problèmes d'encodage
                hideObject: false,
              },
            },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
