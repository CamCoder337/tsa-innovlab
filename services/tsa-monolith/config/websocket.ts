import env from '#start/env'
import { defineConfig } from 'adonisjs-websocket'

const websocketConfig = defineConfig({
  /**
   * Middlewares globaux appliqués à toutes les routes WebSocket
   * Ces middlewares s'exécutent avant le handler de la route
   */
  middleware: [
    // Container bindings pour l'injection de dépendances
    () => import('#middleware/container_bindings_middleware'),
    // Initialisation de l'authentification
    () => import('@adonisjs/auth/initialize_auth_middleware'),
  ],

  /**
   * Configuration Redis pour le broadcasting entre plusieurs instances de serveur
   * Si enabled: true, les messages WebSocket seront broadcastés via Redis Pub/Sub
   * permettant la communication entre plusieurs serveurs AdonisJS
   */
  redis: {
    enabled: env.get('WEBSOCKET_REDIS_ENABLED', false),
    host: env.get('REDIS_HOST', 'localhost'),
    port: env.get('REDIS_PORT', 6379),
    password: env.get('REDIS_PASSWORD'),
  },
})

export default websocketConfig
