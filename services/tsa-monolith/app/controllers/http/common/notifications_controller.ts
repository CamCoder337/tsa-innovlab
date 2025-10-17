import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Notification, { NotificationPriority, NotificationType } from '#models/notification'
import WebSocketService from '#services/websocket_service'
import { notificationValidator } from '#validators/notification'

@inject()
export default class NotificationsController {
  private websocketService: WebSocketService

  constructor() {
    // Utiliser l'instance singleton du WebSocketService
    this.websocketService = WebSocketService.getInstance()
  }

  /**
   * Liste les notifications de l'utilisateur connecté
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { page = 1, limit = 20, filter = 'all' } = request.qs()

      const query = Notification.query()
        .where('user_id', user.id)
        .preload('mission', (missionQuery) => {
          missionQuery.select('id', 'title', 'status')
        })
        .orderBy('created_at', 'desc')

      // Filtres
      if (filter === 'unread') {
        query.whereNull('read_at')
      } else if (filter === 'read') {
        query.whereNotNull('read_at')
      } else if (filter === 'urgent') {
        query.where('priority', NotificationPriority.URGENT)
      }

      const notifications = await query.paginate(page, limit)

      return response.ok({
        success: true,
        data: {
          notifications: notifications.serialize(),
          stats: {
            unread: await this.getUnreadCount(user.id),
            urgent: await this.getUrgentCount(user.id),
          },
        },
      })
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la récupération des notifications',
        error: error.message,
      })
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { id } = request.params()

      const notification = await Notification.query()
        .where('id', id)
        .where('user_id', user.id)
        .firstOrFail()

      notification.markAsRead()
      await notification.save()

      return response.ok({
        success: true,
        message: 'Notification marquée comme lue',
        data: {
          notification: notification.serialize(),
        },
      })
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du marquage de la notification',
        error: error.message,
      })
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead({ response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const updatedCount = await Notification.query()
        .where('user_id', user.id)
        .whereNull('read_at')
        .update({ read_at: new Date() })

      return response.ok({
        success: true,
        message: `${updatedCount} notifications marquées comme lues`,
        data: {
          updatedCount,
        },
      })
    } catch (error) {
      console.error('❌ Erreur marquage toutes notifications:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du marquage des notifications',
        error: error.message,
      })
    }
  }

  /**
   * Supprime une notification
   */
  async destroy({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { id } = request.params()

      const notification = await Notification.query()
        .where('id', id)
        .where('user_id', user.id)
        .firstOrFail()

      await notification.delete()

      return response.ok({
        success: true,
        message: 'Notification supprimée avec succès',
      })
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la suppression de la notification',
        error: error.message,
      })
    }
  }

  /**
   * Récupère les statistiques des notifications
   */
  async stats({ response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const [unreadCount, urgentCount, totalCount] = await Promise.all([
        this.getUnreadCount(user.id),
        this.getUrgentCount(user.id),
        this.getTotalCount(user.id),
      ])

      // Répartition par type
      const typeStats = await Notification.query()
        .where('user_id', user.id)
        .groupBy('type')
        .select('type')
        .count('* as count')

      return response.ok({
        success: true,
        data: {
          unread: unreadCount,
          urgent: urgentCount,
          total: totalCount,
          byType: typeStats.reduce(
            (acc, stat) => {
              acc[stat.type] = Number.parseInt(stat.$extras.count)
              return acc
            },
            {} as Record<string, number>
          ),
        },
      })
    } catch (error) {
      console.error('❌ Erreur statistiques notifications:', error)
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message,
      })
    }
  }

  /**
   * Teste l'envoi d'une notification (admin seulement)
   */
  async testNotification({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier que l'utilisateur est admin
      if (user.role !== 'admin') {
        return response.forbidden({
          success: false,
          message: 'Accès refusé - Admin requis',
        })
      }

      const payload = await request.validateUsing(notificationValidator)

      // Créer une notification de test
      const notification = await Notification.create({
        userId: user.id,
        type: NotificationType.SYSTEM,
        title: payload.title || 'Test de notification',
        message: payload.message || 'Ceci est une notification de test',
        priority: (payload.priority as NotificationPriority) || NotificationPriority.NORMAL,
        emailSent: false,
      })

      // Diffuser en temps réel
      await this.websocketService.sendToUser(user.id, {
        type: 'notification:new',
        data: notification.serialize(),
      })

      return response.created({
        success: true,
        message: 'Notification de test envoyée',
        data: {
          notification: notification.serialize(),
        },
      })
    } catch (error) {
      console.error('❌ Erreur test notification:', error)
      return response.internalServerError({
        success: false,
        message: "Erreur lors de l'envoi de la notification test",
        error: error.message,
      })
    }
  }

  // Méthodes privées utilitaires
  private async getUnreadCount(userId: string): Promise<number> {
    const result = await Notification.query()
      .where('user_id', userId)
      .whereNull('read_at')
      .count('* as count')

    return Number.parseInt(result[0].$extras.count)
  }

  private async getUrgentCount(userId: string): Promise<number> {
    const result = await Notification.query()
      .where('user_id', userId)
      .where('priority', NotificationPriority.URGENT)
      .whereNull('read_at')
      .count('* as count')

    return Number.parseInt(result[0].$extras.count)
  }

  private async getTotalCount(userId: string): Promise<number> {
    const result = await Notification.query().where('user_id', userId).count('* as count')

    return Number.parseInt(result[0].$extras.count)
  }
}
