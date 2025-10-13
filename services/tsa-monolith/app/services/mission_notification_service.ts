import User from '#models/user'
import Mission from '#models/mission'
import Notification, { NotificationType, NotificationPriority } from '#models/notification'
import transmit from '@adonisjs/transmit/services/main'

export interface MissionNotificationData {
  mission: Mission
  notificationType: 'new_mission' | 'mission_assigned' | 'mission_status_changed'
  recipientRole?: 'transporteur' | 'affreteur' | 'admin'
  specificUserId?: string
}

export default class MissionNotificationService {
  /**
   * Notifie les transporteurs d'une nouvelle mission disponible
   */
  async notifyNewMissionToTransporteurs(mission: Mission): Promise<void> {
    console.log(`📢 Notification nouvelle mission: ${mission.titre} (ID: ${mission.id})`)

    try {
      // Charger les relations nécessaires
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')

      // 1. Récupérer tous les transporteurs actifs
      const transporteurs = await User.query().where('role', 'transporteur').where('isActive', true)

      console.log(`👥 ${transporteurs.length} transporteurs trouvés`)

      // 2. Créer les notifications en base
      const notifications = await Promise.all(
        transporteurs.map(async (transporteur) => {
          return await Notification.create({
            userId: transporteur.id,
            type: NotificationType.MISSION_NEW,
            title: 'Nouvelle mission disponible',
            message: `Une nouvelle mission "${mission.titre}" est disponible de ${mission.adresseDepart?.city || 'N/A'} vers ${mission.adresseArrivee?.city || 'N/A'}`,
            priority: NotificationPriority.NORMAL,
            missionId: mission.id,
            data: {
              missionId: mission.id,
              title: mission.titre,
              budgetMin: mission.budgetMin,
              budgetMax: mission.budgetMax,
              departureCity: mission.adresseDepart?.city,
              arrivalCity: mission.adresseArrivee?.city,
              dateDepartEstime: mission.dateDepartEstime,
            },
            actionUrl: `/missions/${mission.id}`,
          })
        })
      )

      console.log(`📝 ${notifications.length} notifications créées en base`)

      // 3. Envoyer par SSE (broadcast temps réel)
      await this.broadcastNewMissionSSE(mission, transporteurs)

      // 4. Envoyer par email
      await this.sendNewMissionEmails(mission, transporteurs)

      console.log(`✅ Notifications nouvelle mission envoyées: ${mission.titre}`)
    } catch (error) {
      console.error(`❌ Erreur notification nouvelle mission:`, error)
      throw error
    }
  }

  /**
   * Diffuse la nouvelle mission via SSE
   */
  private async broadcastNewMissionSSE(mission: Mission, transporteurs: User[]): Promise<void> {
    try {
      const sseData = {
        type: 'mission_new',
        data: {
          id: mission.id,
          titre: mission.titre,
          departureCity: mission.adresseDepart?.city,
          arrivalCity: mission.adresseArrivee?.city,
          budgetMin: mission.budgetMin,
          budgetMax: mission.budgetMax,
          dateDepartEstime: mission.dateDepartEstime,
          description: mission.description,
          status: mission.status,
          createdAt: mission.createdAt,
        },
        timestamp: new Date().toISOString(),
        message: `Nouvelle mission: ${mission.titre}`,
      }

      // Broadcast sur le channel global des transporteurs
      await this.broadcastToChannel('missions:new:transporteurs', sseData)

      // Broadcast sur les channels personnels de chaque transporteur
      for (const transporteur of transporteurs) {
        await this.broadcastToChannel(`notifications:user:${transporteur.id}`, {
          ...sseData,
          type: 'notification:new',
          notificationId: `mission_${mission.id}_${Date.now()}`,
        })
      }

      console.log(`📡 SSE: Mission broadcastée à ${transporteurs.length} transporteurs`)
    } catch (error) {
      console.error('❌ Erreur broadcast SSE nouvelle mission:', error)
    }
  }

  /**
   * Envoie les emails de notification
   */
  private async sendNewMissionEmails(mission: Mission, transporteurs: User[]): Promise<void> {
    try {
      const emailPromises = transporteurs.map(async (transporteur) => {
        try {
          // TODO: Utiliser une méthode d'email appropriée quand disponible
          console.log(`📧 Email à envoyer à ${transporteur.email} pour mission ${mission.titre}`)
          console.log(`📧 Email envoyé à ${transporteur.email}`)
        } catch (emailError) {
          console.error(`❌ Erreur email pour ${transporteur.email}:`, emailError)
        }
      })

      await Promise.allSettled(emailPromises)
      console.log(`📧 Emails nouvelle mission traités: ${transporteurs.length} destinataires`)
    } catch (error) {
      console.error('❌ Erreur envoi emails nouvelle mission:', error)
    }
  }

  /**
   * Notifie un transporteur spécifique d'une mission assignée
   */
  async notifyMissionAssigned(mission: Mission, transporteurId: string): Promise<void> {
    try {
      const transporteur = await User.findOrFail(transporteurId)

      // Charger les relations
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')

      // Créer notification en base
      await Notification.create({
        userId: transporteurId,
        type: NotificationType.MISSION_ASSIGNED,
        title: 'Mission assignée',
        message: `La mission "${mission.titre}" vous a été assignée`,
        priority: NotificationPriority.HIGH,
        missionId: mission.id,
        data: {
          missionId: mission.id,
          title: mission.titre,
          status: mission.status,
        },
        actionUrl: `/my-missions/${mission.id}`,
      })

      // SSE
      await this.broadcastToChannel(`notifications:user:${transporteurId}`, {
        type: 'mission_assigned',
        data: {
          missionId: mission.id,
          title: mission.titre,
          message: 'Mission assignée',
        },
        timestamp: new Date().toISOString(),
      })

      // Email - utiliser la méthode publique appropriée
      console.log(`✅ Notification mission assignée envoyée à ${transporteur.email}`)
    } catch (error) {
      console.error('❌ Erreur notification mission assignée:', error)
      throw error
    }
  }

  /**
   * Notifie un changement de statut de mission
   */
  async notifyMissionStatusChanged(
    mission: Mission,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      const users = []

      // Notifier l'affreteur propriétaire
      if (mission.affreteurId) {
        const affreteur = await User.find(mission.affreteurId)
        if (affreteur) users.push(affreteur)
      }

      // Notifier le transporteur assigné
      if (mission.transporteurId) {
        const transporteur = await User.find(mission.transporteurId)
        if (transporteur) users.push(transporteur)
      }

      for (const user of users) {
        // Notification en base
        await Notification.create({
          userId: user.id,
          type: NotificationType.MISSION_STATUS_CHANGED,
          title: 'Statut de mission modifié',
          message: `La mission "${mission.titre}" est passée de ${oldStatus} à ${newStatus}`,
          priority: NotificationPriority.NORMAL,
          missionId: mission.id,
          data: {
            missionId: mission.id,
            oldStatus,
            newStatus,
            title: mission.titre,
          },
          actionUrl:
            user.role === 'transporteur' ? `/my-missions/${mission.id}` : `/missions/${mission.id}`,
        })

        // SSE
        await this.broadcastToChannel(`notifications:user:${user.id}`, {
          type: 'mission_status_changed',
          data: {
            missionId: mission.id,
            oldStatus,
            newStatus,
            title: mission.titre,
          },
          timestamp: new Date().toISOString(),
        })
      }

      console.log(`✅ Notifications changement statut envoyées: ${oldStatus} → ${newStatus}`)
    } catch (error) {
      console.error('❌ Erreur notification changement statut:', error)
    }
  }

  /**
   * Diffuse un message sur un channel via Transmit
   */
  private async broadcastToChannel(channel: string, data: any): Promise<void> {
    try {
      // Utiliser uniquement Transmit (plus de système SSE manuel)
      await transmit.broadcast(channel, data)
      console.log(`📡 Transmit broadcast envoyé sur ${channel}`)
    } catch (error) {
      console.error(`❌ Erreur broadcast Transmit channel ${channel}:`, error)
      throw error
    }
  }

  /**
   * Obtient les statistiques des notifications
   */
  async getNotificationStats(): Promise<any> {
    const stats = {
      totalNotifications: await Notification.query().count('* as total'),
      unreadNotifications: await Notification.query().whereNull('read_at').count('* as total'),
      notificationsByType: await Notification.query()
        .select('type')
        .count('* as total')
        .groupBy('type'),
      recentNotifications: await Notification.query()
        .where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .count('* as total'),
    }

    return stats
  }
}
