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

// Lazy load Transmit to avoid Redis connection errors during migrations
let transmit: any = null
try {
  const transmitModule = await import('@adonisjs/transmit/services/main')
  transmit = transmitModule.default
} catch (error) {
  console.warn('⚠️  Transmit service not available (Redis might be down)')
}

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
    router.get('/users', '#controllers/http/admin/users_controller.index')
    router.get('/users/:id', '#controllers/http/admin/users_controller.show')
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

    // Gestion des propositions reçues
    router.get(
      '/missions/:id/propositions',
      '#controllers/http/affreteur/propositions_controller.index'
    )
    router.post(
      '/missions/:missionId/propositions/:id/accept',
      '#controllers/http/affreteur/propositions_controller.accept'
    )
    router.post(
      '/missions/:missionId/propositions/:id/reject',
      '#controllers/http/affreteur/propositions_controller.reject'
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
    // Missions disponibles
    router.get(
      '/missions/available',
      '#controllers/http/transporteur/missions_controller.available'
    )
    router.get('/missions/:id', '#controllers/http/transporteur/missions_controller.show')

    // Mes missions
    router.get('/my-missions', '#controllers/http/transporteur/missions_controller.myMissions')

    // Propositions
    router.post(
      '/missions/:id/apply',
      '#controllers/http/transporteur/propositions_controller.apply'
    )
    router.get(
      '/my-propositions',
      '#controllers/http/transporteur/propositions_controller.myPropositions'
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
  })
  .prefix('/api/shop')

// ===== ROUTES PANIER & COMMANDES (PROTÉGÉES) =====
router
  .group(() => {
    // Panier
    router.get('/cart', '#controllers/http/shop/cart_controller.index')
    router.post('/cart/items', '#controllers/http/shop/cart_controller.addItem')
    router.put('/cart/items/:id', '#controllers/http/shop/cart_controller.updateItem')
    router.delete('/cart/items/:id', '#controllers/http/shop/cart_controller.removeItem')
    router.delete('/cart', '#controllers/http/shop/cart_controller.clear')

    // Commandes
    router.get('/orders', '#controllers/http/shop/orders_controller.index')
    router.post('/orders', '#controllers/http/shop/orders_controller.store')
    router.get('/orders/:id', '#controllers/http/shop/orders_controller.show')
    router.post('/orders/:id/cancel', '#controllers/http/shop/orders_controller.cancel')

    // Recommandations
    router.get('/recommendations', '#controllers/http/shop/recommendations_controller.index')
    router.get(
      '/recommendations/popular',
      '#controllers/http/shop/recommendations_controller.popular'
    )
    router.get(
      '/recommendations/similar/:id',
      '#controllers/http/shop/recommendations_controller.similar'
    )
  })
  .prefix('/api/shop')
  .middleware(middleware.auth())

// ===== ROUTES COMMUNES PROTÉGÉES =====
router
  .group(() => {
    // Conversations
    router.get('/conversations', '#controllers/http/common/conversations_controller.index')
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
    router.get(
      '/conversations/search/users',
      '#controllers/http/common/conversations_controller.searchUsers'
    )

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

    // Notifications
    router.get('/notifications', '#controllers/http/common/notifications_controller.index')
    router.put(
      '/notifications/:id/read',
      '#controllers/http/common/notifications_controller.markAsRead'
    )
    router.put(
      '/notifications/read-all',
      '#controllers/http/common/notifications_controller.markAllAsRead'
    )
  })
  .prefix('/api/common')
  .middleware(middleware.auth())

// ===== ROUTES SWAGGER =====
// Documentation API auto-générée
router.get('/docs', async ({ response }) => {
  return response.send(AutoSwagger.default.docs(router.toJSON(), swagger))
})

// Spec JSON pour Swagger UI
router.get('/swagger.json', async ({ response }) => {
  return response.json(AutoSwagger.default.writeFile(router.toJSON(), swagger))
})

// ===== ROUTES TRANSMIT =====
// Configuration Transmit avec authentification sécurisée
// Les routes sont automatiquement enregistrées par Transmit sur /__transmit/events
if (transmit) {
  transmit.registerRoutes((route: any) => {
    // Middleware pour extraire le token JWT du query string
    // Nécessaire car EventSource ne supporte pas les headers Authorization
    route.middleware([middleware.transmitAuthQuery()])
  })
  console.log('✅ Transmit routes registered on /__transmit/* with auth middleware')
} else {
  console.warn('⚠️  Transmit not available - real-time features disabled')
}

// Route de test pour broadcaster un message via Transmit (pour développement)
router.post('/transmit/broadcast', async ({ request, response }) => {
  try {
    if (!transmit) {
      return response.serviceUnavailable({
        success: false,
        message: 'Transmit service not available',
      })
    }

    const { channel, message } = request.only(['channel', 'message'])

    if (!channel || !message) {
      return response.badRequest({
        success: false,
        message: 'Channel and message required',
      })
    }

    const broadcastData = {
      type: 'broadcast',
      data: message,
      timestamp: new Date().toISOString(),
    }

    console.log(`📡 TRANSMIT BROADCAST:`, { channel, message, broadcastData })

    // Utiliser l'API Transmit pour broadcaster
    await transmit.broadcast(channel, broadcastData)

    console.log(`✅ TRANSMIT BROADCAST SENT: channel=${channel}`)

    return response.ok({
      success: true,
      message: `Message broadcasted to channel: ${channel}`,
      channel,
      data: broadcastData,
    })
  } catch (error) {
    console.error('❌ Erreur broadcast Transmit:', error)
    return response.internalServerError({
      success: false,
      message: 'Erreur envoi broadcast',
      error: error.message,
    })
  }
})

// Route de test pour simuler une nouvelle mission
router.post('/transmit/test-mission', async ({ response }) => {
  try {
    if (!transmit) {
      return response.serviceUnavailable({
        success: false,
        message: 'Transmit service not available',
      })
    }

    const missionData = {
      type: 'mission:new',
      data: {
        id: 'test-123',
        titre: 'Mission test de Douala vers Yaoundé',
        departureCity: 'Douala',
        arrivalCity: 'Yaoundé',
        budget: 50000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Transport de marchandises diverses',
        status: 'published',
      },
      timestamp: new Date().toISOString(),
      message: 'Nouvelle mission disponible!',
    }

    console.log(`🚛 SIMULATION NOUVELLE MISSION:`, missionData)

    // Broadcaster sur le channel officiel des transporteurs
    await transmit.broadcast('missions:new:transporteurs', missionData)

    // Aussi sur global pour les tests
    await transmit.broadcast('global', missionData)

    return response.ok({
      success: true,
      message: 'Simulation nouvelle mission envoyée via Transmit',
      channels: ['missions:new:transporteurs', 'global'],
    })
  } catch (error) {
    console.error('❌ Erreur simulation mission:', error)
    return response.internalServerError({
      success: false,
      message: 'Erreur simulation mission',
      error: error.message,
    })
  }
})
