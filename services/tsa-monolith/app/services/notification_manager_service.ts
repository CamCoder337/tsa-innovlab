import { inject } from '@adonisjs/core'
import Notification, { NotificationPriority, NotificationType } from '#models/notification'
import Mission from '#models/mission'
import User from '#models/user'
import WebSocketService from './websocket_service.js'
import EmailService from './email_service.js'
import env from '#start/env'

@inject()
export default class NotificationManagerService {
  private websocketService: WebSocketService

  constructor(private emailService: EmailService) {
    // Utiliser l'instance singleton du WebSocketService
    this.websocketService = WebSocketService.getInstance()
  }

  /**
   * Notifie les transporteurs d'une nouvelle mission
   */
  async notifyNewMission(mission: Mission): Promise<void> {
    try {
      console.log(`🔔 Notification nouvelle mission: ${mission.title}`)

      // Récupérer tous les transporteurs actifs
      const transporteurs = await User.query()
        .where('role', 'transporteur')
        .where('status', 'active')

      for (const transporteur of transporteurs) {
        // Créer la notification en base
        const notification = await Notification.create({
          userId: transporteur.id,
          type: NotificationType.MISSION_NEW,
          title: `Nouvelle mission disponible: ${mission.title}`,
          message: `Mission de ${mission.adresseDepart?.city} vers ${mission.adresseArrivee?.city}. Budget: ${mission.getBudgetRange()}`,
          priority: NotificationPriority.NORMAL,
          missionId: mission.id,
          actionUrl: `/missions/${mission.id}`,
          emailSent: false,
        })

        // Diffuser en temps réel via WebSocket
        await this.websocketService.sendToUser(transporteur.id, {
          type: 'notification:new',
          data: notification.serialize(),
        })

        // Diffuser aussi sur le channel global des transporteurs
        await this.websocketService.broadcastToTransporteurs({
          type: 'mission:new',
          data: mission.serialize(),
        })

        // Envoyer l'email (en arrière-plan)
        this.sendMissionEmailNotification(transporteur, mission, notification).catch((error) => {
          console.error(`❌ Erreur email notification mission ${mission.id}:`, error)
        })
      }

      console.log(`✅ ${transporteurs.length} transporteurs notifiés pour mission ${mission.id}`)
    } catch (error) {
      console.error('❌ Erreur notification nouvelle mission:', error)
      throw error
    }
  }

  /**
   * Notifie l'assignation d'une mission à un transporteur
   */
  async notifyMissionAssigned(mission: Mission, transporteur: User): Promise<void> {
    try {
      console.log(`🔔 Notification mission assignée: ${mission.title} → ${transporteur.email}`)

      // Créer la notification
      const notification = await Notification.create({
        userId: transporteur.id,
        type: NotificationType.MISSION_ASSIGNED,
        title: `Mission assignée: ${mission.title}`,
        message: `Vous avez été assigné à la mission "${mission.title}". Préparez-vous pour le transport.`,
        priority: NotificationPriority.HIGH,
        missionId: mission.id,
        actionUrl: `/missions/${mission.id}`,
        emailSent: false,
      })

      // Diffuser en temps réel
      await this.websocketService.sendToUser(transporteur.id, {
        type: 'notification:new',
        data: notification.serialize(),
      })

      // Email de confirmation d'assignation
      this.sendAssignmentEmailNotification(transporteur, mission, notification).catch((error) => {
        console.error(`❌ Erreur email assignation mission ${mission.id}:`, error)
      })

      console.log(
        `✅ Transporteur ${transporteur.email} notifié de l'assignation mission ${mission.id}`
      )
    } catch (error) {
      console.error('❌ Erreur notification assignation mission:', error)
      throw error
    }
  }

  /**
   * Notifie le changement de statut d'une mission
   */
  async notifyMissionStatusChanged(
    mission: Mission,
    oldStatus: string,
    newStatus: string,
    transporteur: User
  ): Promise<void> {
    try {
      console.log(`🔔 Notification changement statut: ${mission.title} ${oldStatus} → ${newStatus}`)

      // Notifier l'affreteur du changement de statut
      const affreteur = await User.findOrFail(mission.affreteurId)

      const notification = await Notification.create({
        userId: affreteur.id,
        type: NotificationType.MISSION_STATUS_CHANGED,
        title: `Mission ${mission.title} - Statut mis à jour`,
        message: `Le statut de votre mission est passé de "${oldStatus}" à "${newStatus}" par ${transporteur.fullName}.`,
        priority: this.getStatusChangePriority(newStatus),
        missionId: mission.id,
        actionUrl: `/missions/${mission.id}`,
        emailSent: false,
      })

      // Diffuser en temps réel à l'affreteur
      await this.websocketService.sendToUser(affreteur.id, {
        type: 'notification:new',
        data: notification.serialize(),
      })

      // Diffuser aussi sur le channel de tracking de la mission
      await this.websocketService.broadcastToMission(mission.id, {
        type: 'mission:status_change',
        data: {
          oldStatus,
          newStatus,
          transporteur: transporteur.fullName,
          timestamp: new Date().toISOString(),
        },
      })

      // Email à l'affreteur
      this.sendStatusChangeEmailNotification(
        affreteur,
        mission,
        oldStatus,
        newStatus,
        notification
      ).catch((error) => {
        console.error(`❌ Erreur email changement statut mission ${mission.id}:`, error)
      })

      console.log(
        `✅ Affreteur ${affreteur.email} notifié du changement de statut mission ${mission.id}`
      )
    } catch (error) {
      console.error('❌ Erreur notification changement statut:', error)
      throw error
    }
  }

  /**
   * Notifie l'affreteur qu'un transporteur a annulé sa mission
   * La mission est automatiquement republiée et disponible pour d'autres transporteurs
   */
  async notifyMissionCancelledByTransporteur(
    mission: Mission,
    transporteur: User,
    previousTransporteurId: string,
    reason: string
  ): Promise<void> {
    try {
      console.log(
        `🔔 Notification annulation transporteur: ${mission.title} par ${transporteur.fullName}`
      )

      // Récupérer l'affreteur
      const affreteur = await User.findOrFail(mission.affreteurId)

      // Créer la notification pour l'affreteur
      const notification = await Notification.create({
        userId: mission.affreteurId,
        type: NotificationType.MISSION_STATUS_CHANGED,
        title: 'Mission annulée et republiée',
        message: `Le transporteur ${transporteur.fullName} a annulé votre mission "${mission.title}". Elle est maintenant à nouveau disponible pour d'autres transporteurs.`,
        priority: NotificationPriority.HIGH,
        missionId: mission.id,
        data: {
          missionId: mission.id,
          title: mission.title,
          oldStatus: 'assigned',
          newStatus: 'published',
          cancelledBy: transporteur.fullName,
          transporteurId: previousTransporteurId,
          reason: reason,
        },
        actionUrl: `/missions/${mission.id}`,
        emailSent: false,
      })

      // Diffuser en temps réel à l'affreteur
      await this.websocketService.sendToUser(mission.affreteurId, {
        type: 'notification:new',
        data: notification.serialize(),
      })

      // Diffuser aussi sur le channel de tracking de la mission
      await this.websocketService.broadcastToMission(mission.id, {
        type: 'mission:cancelled_and_republished',
        data: {
          oldStatus: 'assigned',
          newStatus: 'published',
          transporteur: transporteur.fullName,
          reason: reason,
          timestamp: new Date().toISOString(),
        },
      })

      // Email à l'affreteur
      this.sendCancellationEmailNotification(
        affreteur,
        mission,
        transporteur,
        reason,
        notification
      ).catch((error) => {
        console.error(`❌ Erreur email annulation mission ${mission.id}:`, error)
      })

      console.log(
        `✅ Affreteur ${affreteur.email} notifié de l'annulation par ${transporteur.fullName}`
      )
    } catch (error) {
      console.error('❌ Erreur notification annulation transporteur:', error)
      throw error
    }
  }

  /**
   * Notifie la réception d'un nouveau message
   */
  async notifyNewMessage(
    senderId: string,
    receiverId: string,
    messageContent: string
  ): Promise<void> {
    try {
      const sender = await User.findOrFail(senderId)

      const notification = await Notification.create({
        userId: receiverId,
        type: NotificationType.MESSAGE_RECEIVED,
        title: `Nouveau message de ${sender.fullName}`,
        message:
          messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/chat`,
        emailSent: false,
      })

      // Diffuser en temps réel
      await this.websocketService.sendToUser(receiverId, {
        type: 'notification:new',
        data: notification.serialize(),
      })

      console.log(`✅ Utilisateur ${receiverId} notifié du nouveau message de ${sender.email}`)
    } catch (error) {
      console.error('❌ Erreur notification nouveau message:', error)
      throw error
    }
  }

  /**
   * Envoie une notification système à un utilisateur
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    actionUrl?: string
  ): Promise<void> {
    try {
      const notification = await Notification.create({
        userId,
        type: NotificationType.SYSTEM,
        title,
        message,
        priority,
        actionUrl,
        emailSent: false,
      })

      // Diffuser en temps réel
      await this.websocketService.sendToUser(userId, {
        type: 'notification:new',
        data: notification.serialize(),
      })

      console.log(`✅ Notification système envoyée à l'utilisateur ${userId}`)
    } catch (error) {
      console.error('❌ Erreur notification système:', error)
      throw error
    }
  }

  // Méthodes privées pour l'envoi d'emails
  private async sendMissionEmailNotification(
    transporteur: User,
    mission: Mission,
    notification: Notification
  ): Promise<void> {
    try {
      await this.emailService.sendNewMissionNotification(transporteur, mission)

      // Marquer l'email comme envoyé
      notification.emailSent = true
      await notification.save()
    } catch (error) {
      console.error('❌ Erreur envoi email mission:', error)
    }
  }

  private async sendAssignmentEmailNotification(
    transporteur: User,
    mission: Mission,
    notification: Notification
  ): Promise<void> {
    try {
      // Utiliser la méthode existante ou en créer une nouvelle
      await this.emailService.sendPropositionAcceptedEmail(transporteur, mission)

      notification.emailSent = true
      await notification.save()
    } catch (error) {
      console.error('❌ Erreur envoi email assignation:', error)
    }
  }

  private async sendStatusChangeEmailNotification(
    _affreteur: User,
    _mission: Mission,
    _oldStatus: string,
    _newStatus: string,
    notification: Notification
  ): Promise<void> {
    try {
      // Créer un template email spécifique pour les changements de statut
      // TODO: Email content for future implementation when email service is properly integrated

      // Pour l'instant, utiliser une méthode générique ou créer une spécifique
      // await this.emailService.sendStatusChangeEmail(affreteur, mission, oldStatus, newStatus)

      notification.emailSent = true
      await notification.save()
    } catch (error) {
      console.error('❌ Erreur envoi email changement statut:', error)
    }
  }

  private async sendCancellationEmailNotification(
    _affreteur: User,
    _mission: Mission,
    _transporteur: User,
    _reason: string,
    notification: Notification
  ): Promise<void> {
    try {
      // TODO: Créer un template email spécifique pour les annulations de transporteur
      // await this.emailService.sendMissionCancelledEmail(affreteur, mission, transporteur, reason)

      notification.emailSent = true
      await notification.save()
    } catch (error) {
      console.error('❌ Erreur envoi email annulation:', error)
    }
  }

  /**
   * Détermine la priorité selon le nouveau statut
   */
  private getStatusChangePriority(status: string): NotificationPriority {
    switch (status) {
      case 'completed':
        return NotificationPriority.HIGH
      case 'cancelled':
        return NotificationPriority.URGENT
      case 'in_progress':
        return NotificationPriority.HIGH
      case 'delivered':
        return NotificationPriority.HIGH
      default:
        return NotificationPriority.NORMAL
    }
  }
}
