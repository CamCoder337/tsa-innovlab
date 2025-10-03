import env from '#start/env'
import { defineConfig } from '@adonisjs/transmit'
import { redis } from '@adonisjs/transmit/transports'

const transmitConfig = defineConfig({
  transport: {
    driver: redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD') || undefined,
      keyPrefix: 'transmit:',
      lazyConnect: false, // Connexion immédiate
      enableReadyCheck: true, // Vérifier que Redis est prêt
      maxRetriesPerRequest: null, // Pas de limite pour pub/sub
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        console.log(`🔄 Transmit Redis retry #${times}, delay: ${delay}ms`)
        return delay
      },
    }),
  },

  /**
   * Authorization hook pour vérifier les permissions d'accès aux channels
   */
  authorization: {
    /**
     * Vérifie si un utilisateur peut s'abonner à un channel
     */
    subscribeToChannel: async (ctx: any, channel: string) => {
      const user = ctx.auth?.user

      if (!user) {
        // Autoriser connexions anonymes sur canal global pour tests
        if (channel === 'global') {
          return true
        }
        console.log(`❌ Transmit: Utilisateur non authentifié pour ${channel}`)
        return false
      }

      // Importer le service dynamiquement pour éviter les dépendances circulaires
      const { default: TransmitService } = await import('#services/transmit_service')
      const transmitService = new TransmitService()

      const canAccess = await transmitService.canAccessChannel(user, channel)

      if (!canAccess) {
        console.log(`❌ Transmit: ${user.email} refusé sur ${channel}`)
      }

      return canAccess
    },

    /**
     * Vérifie si un utilisateur peut envoyer des messages sur un channel
     */
    broadcastToChannel: async (ctx: any, channel: string) => {
      const user = ctx.auth?.user

      if (!user) {
        // Autoriser broadcasts anonymes sur canal global pour tests
        if (channel === 'global') {
          return true
        }
        console.log(`❌ Transmit: Utilisateur non authentifié pour broadcast ${channel}`)
        return false
      }

      // Les mêmes permissions que pour l'abonnement
      const { default: TransmitService } = await import('#services/transmit_service')
      const transmitService = new TransmitService()

      const canAccess = await transmitService.canAccessChannel(user, channel)

      if (!canAccess) {
        console.log(`❌ Transmit: ${user.email} ne peut pas broadcaster sur ${channel}`)
      }

      return canAccess
    },
  },
})

export default transmitConfig
