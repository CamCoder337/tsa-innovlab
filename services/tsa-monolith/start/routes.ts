/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import { UserRole } from '#models/user'
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'

// Helper function pour créer un middleware de rôle
function roleGuard(role: UserRole) {
  return async (ctx: any, next: any) => {
    const user = ctx.auth.getUserOrFail()

    if (user.role !== role) {
      return ctx.response.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.',
        required_role: role,
        user_role: user.role,
      })
    }

    // Vérifier MFA pour les admins
    if (user.role === UserRole.ADMIN && user.mustEnableMFA()) {
      return ctx.response.status(403).json({
        success: false,
        message: 'MFA setup required for admin accounts',
        action_required: 'enable_mfa',
      })
    }

    await next()
  }
}

// Helper function pour créer un middleware multi-rôles
function multiRoleGuard(allowedRoles: UserRole[]) {
  return async (ctx: any, next: any) => {
    const user = ctx.auth.getUserOrFail()

    if (!allowedRoles.includes(user.role)) {
      return ctx.response.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.',
        allowed_roles: allowedRoles,
        user_role: user.role,
      })
    }

    // Vérifier MFA pour les admins
    if (user.role === UserRole.ADMIN && user.mustEnableMFA()) {
      return ctx.response.status(403).json({
        success: false,
        message: 'MFA setup required for admin accounts',
        action_required: 'enable_mfa',
      })
    }

    await next()
  }
}

// Route de base
router.get('/', async () => {
  return {
    message: 'TSA Logistics API',
    version: '1.0.0',
    status: 'active',
  }
})

// Health check for ensuring that the app is online
router.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }
})

// ===== ROUTES D'AUTHENTIFICATION =====
router
  .group(() => {
    // Routes publiques (pas d'authentification requise)
    router.post('/login', '#controllers/http/auth/auth_controller.login')
    router.post('/register', '#controllers/http/auth/auth_controller.register')
    router.post('/verify-email', '#controllers/http/auth/auth_controller.verifyEmail')
    router.post('/forgot-password', '#controllers/http/auth/auth_controller.forgotPassword')
    router.post('/reset-password', '#controllers/http/auth/auth_controller.resetPassword')
    router.post('/refresh-token', '#controllers/http/auth/auth_controller.refreshToken')
    router.post('/debug-token', '#controllers/http/auth/auth_controller.debugToken')

    // Routes protégées (authentification requise)
    router
      .group(() => {
        router.get('/me', '#controllers/http/auth/auth_controller.me')
        router.put('/profile', '#controllers/http/auth/auth_controller.updateProfile')
        router.put('/change-password', '#controllers/http/auth/auth_controller.changePassword')
        router.post('/logout', '#controllers/http/auth/auth_controller.logout')

        // Routes MFA
        router.get('/mfa/status', '#controllers/http/auth/auth_controller.mfaStatus')
        router.post('/mfa/initialize', '#controllers/http/auth/auth_controller.initializeMFA')
        router.post('/mfa/enable', '#controllers/http/auth/auth_controller.enableMFA')
        router.post('/mfa/disable', '#controllers/http/auth/auth_controller.disableMFA')
        router.post(
          '/mfa/regenerate-codes',
          '#controllers/http/auth/auth_controller.regenerateRecoveryCodes'
        )
      })
      .middleware(middleware.auth())
  })
  .prefix('/api/auth')

// ===== ROUTES ADMIN =====
router
  .group(() => {
    router.get('/dashboard', '#controllers/http/admin/dashboard_controller.index')

    // Gestion des utilisateurs
    router.get('/users/stats', '#controllers/http/admin/users_controller.stats')
    router.get('/users', '#controllers/http/admin/users_controller.index')
    router.get('/users/:id', '#controllers/http/admin/users_controller.show')
    router.post('/users/:id/suspend', '#controllers/http/admin/users_controller.suspend')
    router.post('/users/:id/activate', '#controllers/http/admin/users_controller.activate')
    router.put('/users/:id', '#controllers/http/admin/users_controller.update')
    router.delete('/users/:id', '#controllers/http/admin/users_controller.destroy')

    // Gestion des produits
    router.get('/products', '#controllers/http/admin/products_controller.index')
    router.post('/products', '#controllers/http/admin/products_controller.store')
    router.get('/products/stats', '#controllers/http/admin/products_controller.stats')
    router.get('/products/low-stock', '#controllers/http/admin/products_controller.lowStock')
    router.post('/products/bulk', '#controllers/http/admin/products_controller.bulk')
    router.get('/products/:id', '#controllers/http/admin/products_controller.show')
    router.put('/products/:id', '#controllers/http/admin/products_controller.update')
    router.delete('/products/:id', '#controllers/http/admin/products_controller.destroy')

    // Gestion des catégories
    router.get('/categories', '#controllers/http/admin/categories_controller.index')
    router.post('/categories', '#controllers/http/admin/categories_controller.store')
    router.get('/categories/tree', '#controllers/http/admin/categories_controller.tree')
    router.get('/categories/:id', '#controllers/http/admin/categories_controller.show')
    router.put('/categories/:id', '#controllers/http/admin/categories_controller.update')
    router.delete('/categories/:id', '#controllers/http/admin/categories_controller.destroy')

    // Gestion des missions
    router.get('/missions', '#controllers/http/admin/missions_controller.index')
    router.post('/missions', '#controllers/http/admin/missions_controller.store')
    router.get('/missions/stats', '#controllers/http/admin/missions_controller.stats')
    router.get('/missions/:id', '#controllers/http/admin/missions_controller.show')
    router.put('/missions/:id/status', '#controllers/http/admin/missions_controller.updateStatus')

    // Audit logs
    router.get('/audit-logs', '#controllers/http/admin/audit_logs_controller.index')

    // Statistiques
    router.get('/stats/overview', '#controllers/http/admin/stats_controller.overview')
    router.get('/stats/users', '#controllers/http/admin/stats_controller.users')
    router.get('/stats/missions', '#controllers/http/admin/stats_controller.missions')
    router.get('/stats/products', '#controllers/http/admin/stats_controller.products')

    // Feedbacks
    router.get('/feedbacks', '#controllers/http/admin/feedbacks_controller.index')
    router.get('/feedbacks/stats', '#controllers/http/admin/feedbacks_controller.stats')
    router.get('/feedbacks/:id', '#controllers/http/admin/feedbacks_controller.show')
  })
  .prefix('/api/admin')
  .middleware([middleware.auth(), roleGuard(UserRole.ADMIN)])

// ===== ROUTES AFFRETEUR =====
router
  .group(() => {
    // Gestion des missions
    router.get('/missions', '#controllers/http/affreteur/missions_controller.index')
    router.post('/missions', '#controllers/http/affreteur/missions_controller.store')
    router.get('/missions/:id', '#controllers/http/affreteur/missions_controller.show')
    router.put('/missions/:id', '#controllers/http/affreteur/missions_controller.update')
    router.post('/missions/:id/publish', '#controllers/http/affreteur/missions_controller.publish')
    router.post(
      '/missions/:id/unpublish',
      '#controllers/http/affreteur/missions_controller.unpublish'
    )
    router.delete('/missions/:id', '#controllers/http/affreteur/missions_controller.destroy')

    // Feedback des missions
    router.post(
      '/missions/:id/feedback',
      '#controllers/http/affreteur/missions_controller.createFeedback'
    )
    router.get(
      '/missions/:id/feedback',
      '#controllers/http/affreteur/missions_controller.getFeedback'
    )

    // Historique des missions
    router.get(
      '/missions/:id/history',
      '#controllers/http/affreteur/missions_controller.getHistory'
    )

    // Pricing dynamique pour les missions
    router.post(
      '/pricing/calculate',
      '#controllers/http/affreteur/dynamic_pricing_controller.calculate'
    )
    router.get(
      '/pricing/config',
      '#controllers/http/affreteur/dynamic_pricing_controller.getConfig'
    )

    // Suivi des expéditions
    router.get('/shipments', '#controllers/http/affreteur/shipments_controller.index')
    router.get(
      '/shipments/:id/tracking',
      '#controllers/http/affreteur/shipments_controller.tracking'
    )
  })
  .prefix('/api/affreteur')
  .middleware([middleware.auth(), roleGuard(UserRole.AFFRETEUR)])

// ===== ROUTES TRANSPORTEUR =====
router
  .group(() => {
    // Gestion des véhicules
    router.get('/vehicles', '#controllers/http/transporteur/vehicles_controller.index')
    router.post('/vehicles', '#controllers/http/transporteur/vehicles_controller.store')
    router.get('/vehicles/:id', '#controllers/http/transporteur/vehicles_controller.show')
    router.put('/vehicles/:id', '#controllers/http/transporteur/vehicles_controller.update')
    router.delete('/vehicles/:id', '#controllers/http/transporteur/vehicles_controller.destroy')
    router.put(
      '/vehicles/:id/status',
      '#controllers/http/transporteur/vehicles_controller.updateStatus'
    )

    // Missions disponibles
    router.get(
      '/missions/available',
      '#controllers/http/transporteur/missions_controller.available'
    )
    router.get('/missions/:id', '#controllers/http/transporteur/missions_controller.show')

    // Mes missions
    router.get('/my-missions', '#controllers/http/transporteur/missions_controller.myMissions')

    // Réclamer une mission (avec vehicleId requis)
    router.post('/missions/:id/claim', '#controllers/http/transporteur/missions_controller.claim')

    // Historique des missions
    router.get(
      '/missions/:id/history',
      '#controllers/http/transporteur/missions_controller.getHistory'
    )

    // Pricing dynamique (pour estimer avant de proposer)
    router.post(
      '/pricing/calculate',
      '#controllers/http/affreteur/dynamic_pricing_controller.calculate'
    )
    router.get(
      '/pricing/config',
      '#controllers/http/affreteur/dynamic_pricing_controller.getConfig'
    )

    // Suivi des courses
    router.put(
      '/missions/:id/status',
      '#controllers/http/transporteur/missions_controller.updateStatus'
    )
    router.post(
      '/missions/:id/location',
      '#controllers/http/transporteur/missions_controller.updateLocation'
    )
    router.post(
      '/missions/:id/proof',
      '#controllers/http/transporteur/missions_controller.uploadProof'
    )
  })
  .prefix('/api/transporteur')
  .middleware([middleware.auth(), roleGuard(UserRole.TRANSPORTEUR)])

// ===== ROUTES PUBLIQUES BOUTIQUE =====
router
  .group(() => {
    // Catalogue produits (public)
    router.get('/products', '#controllers/http/shop/products_controller.index')
    router.get('/products/:id', '#controllers/http/shop/products_controller.show')
    router.get('/categories', '#controllers/http/shop/categories_controller.index')

    // Recherche
    router.get('/search', '#controllers/http/shop/search_controller.index')

    // Recommandations de produits (public access)
    router.get(
      '/product-recommendations/popular',
      '#controllers/http/shop/product_recommendations_controller.popular'
    )
  })
  .prefix('/api/shop')

// ===== ROUTES RECOMMANDATIONS DE PRODUITS (AUTHENTIFIÉES) =====
router
  .group(() => {
    // Recommandations personnalisées de produits
    router.get(
      '/product-recommendations',
      '#controllers/http/shop/product_recommendations_controller.index'
    )
    router.get(
      '/product-recommendations/similar/:id',
      '#controllers/http/shop/product_recommendations_controller.similar'
    )

    // Reconnaissance visuelle (authentifié)
    router.post(
      '/visual-recognition/search',
      '#controllers/http/shop/visual_recognition_controller.searchByImage'
    )
    router.get(
      '/visual-recognition/health',
      '#controllers/http/shop/visual_recognition_controller.health'
    )
  })
  .prefix('/api/shop')
  .middleware(middleware.auth())

// ===== ROUTES E-COMMERCE (CLIENT, AFFRETEUR, TRANSPORTEUR) =====
router
  .group(() => {
    // Panier (Cart)
    router.get('/cart', '#controllers/http/client/cart_controller.index')
    router.post('/cart/items', '#controllers/http/client/cart_controller.addItem')
    router.put('/cart/items/:id', '#controllers/http/client/cart_controller.updateItem')
    router.delete('/cart/items/:id', '#controllers/http/client/cart_controller.removeItem')
    router.delete('/cart', '#controllers/http/client/cart_controller.clear')

    // Commandes (Orders)
    router.get('/orders/stats', '#controllers/http/client/orders_controller.stats')
    router.get('/orders', '#controllers/http/client/orders_controller.index')
    router.post('/orders', '#controllers/http/client/orders_controller.store')
    router.get('/orders/:id', '#controllers/http/client/orders_controller.show')
    router.post('/orders/:id/cancel', '#controllers/http/client/orders_controller.cancel')

    // Paiements (Payments)
    router.post('/payments/initiate', '#controllers/http/client/payments_controller.initiate')
    router.get('/payments/:id/status', '#controllers/http/client/payments_controller.checkStatus')
    router.post('/payments/:id/confirm', '#controllers/http/client/payments_controller.confirm') // Dev only
    router.get(
      '/orders/:orderId/payment',
      '#controllers/http/client/payments_controller.getByOrder'
    )
  })
  .prefix('/api/client')
  .middleware([
    middleware.auth(),
    multiRoleGuard([UserRole.CLIENT, UserRole.AFFRETEUR, UserRole.TRANSPORTEUR]),
  ])

// ===== ROUTES COMMUNES PROTÉGÉES =====
router
  .group(() => {
    // Conversations
    router.get('/conversations', '#controllers/http/common/conversations_controller.index')
    // Support both hyphenated and slash-separated search routes for frontend compatibility
    router.get(
      '/conversations/search-users',
      '#controllers/http/common/conversations_controller.searchUsers'
    )
    router.get(
      '/conversations/search/users',
      '#controllers/http/common/conversations_controller.searchUsers'
    )
    router.get('/conversations/:id', '#controllers/http/common/conversations_controller.show')
    router.post(
      '/conversations/direct',
      '#controllers/http/common/conversations_controller.createDirect'
    )
    router.post(
      '/conversations/mission',
      '#controllers/http/common/conversations_controller.createMission'
    )
    router.delete('/conversations/:id', '#controllers/http/common/conversations_controller.destroy')

    // Messages
    router.get(
      '/conversations/:conversationId/messages',
      '#controllers/http/common/messages_controller.index'
    )
    router.post(
      '/conversations/:conversationId/messages',
      '#controllers/http/common/messages_controller.store'
    )
    router.put('/messages/:id/read', '#controllers/http/common/messages_controller.markAsRead')
    router.put(
      '/conversations/:conversationId/messages/read-all',
      '#controllers/http/common/messages_controller.markAllAsRead'
    )
    router.get('/messages/unread-count', '#controllers/http/common/messages_controller.unreadCount')
    router.post(
      '/conversations/:conversationId/typing',
      '#controllers/http/common/messages_controller.sendTypingIndicator'
    )

    // Notifications
    router.get('/notifications', '#controllers/http/common/notifications_controller.index')
    router.get('/notifications/stats', '#controllers/http/common/notifications_controller.stats')
    router.put(
      '/notifications/:id/read',
      '#controllers/http/common/notifications_controller.markAsRead'
    )
    router.put(
      '/notifications/read-all',
      '#controllers/http/common/notifications_controller.markAllAsRead'
    )

    // Chatbot AI
    router.post('/chatbot/query', '#controllers/http/common/chatbot_controller.query')
    router.get(
      '/chatbot/history/:conversationId',
      '#controllers/http/common/chatbot_controller.history'
    )
    router.get('/chatbot/health', '#controllers/http/common/chatbot_controller.health')
  })
  .prefix('/api/common')
  .middleware(middleware.auth())

// ===== ROUTES WEBHOOKS =====
// Webhook MTN Mobile Money (route publique - pas d'auth)
router.post(
  '/api/webhooks/mtn/payment-callback',
  '#controllers/http/client/payments_controller.mtnWebhook'
)

// ===== ROUTES SWAGGER =====
// Documentation API auto-générée
router.get('/docs', async ({ response }) => {
  return response.send(AutoSwagger.default.docs(router.toJSON(), swagger))
})

// Spec JSON pour Swagger UI
router.get('/swagger.json', async ({ response }) => {
  return response.json(AutoSwagger.default.writeFile(router.toJSON(), swagger))
})

// ===== ROUTES WEBSOCKET =====
// Route principale pour les notifications temps réel
// Conditionnée pour ne charger que si le provider WebSocket est disponible
if (typeof router.ws === 'function') {
  router.ws(
    '/ws/notifications',
    async (ctx) => {
      try {
        const { ws, auth } = ctx
        // Authentification requise
        const user = auth.getUserOrFail()

        // Obtenir l'instance singleton du service WebSocket
        const { default: WebSocketService } = await import('#services/websocket_service')
        const websocketService = WebSocketService.getInstance()

        console.log(`✅ WebSocket: ${user.email} (${user.role}) connecté`)

        // Enregistrer la connexion
        websocketService.registerConnection(user.id, user.role, ws)

        // Message de bienvenue
        ws.send(
          JSON.stringify({
            type: 'connected',
            message: 'Connexion WebSocket établie',
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
            },
            timestamp: new Date().toISOString(),
          })
        )

        // Gérer les messages entrants (heartbeat)
        ws.on('message', (message: Buffer) => {
          const msg = message.toString()

          if (msg === 'ping') {
            ws.send('pong')
          }
        })

        // Gérer la déconnexion
        ws.on('close', () => {
          console.log(`❌ WebSocket: ${user.email} déconnecté`)
          websocketService.unregisterConnection(user.id)
        })

        // Gérer les erreurs
        ws.on('error', (error: Error) => {
          console.error(`❌ WebSocket error for ${user.email}:`, error.message)
          websocketService.unregisterConnection(user.id)
        })
      } catch (error: any) {
        console.error('❌ WebSocket authentication failed:', error.message)
        ctx.ws.close()
      }
    },
    [middleware.auth()]
  )

  console.log('✅ WebSocket routes registered on /ws/*')
} else {
  console.log('ℹ️  WebSocket provider not loaded (test environment)')
}
