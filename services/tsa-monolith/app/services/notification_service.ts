import redis from '@adonisjs/redis/services/main'
import User from '#models/user'
import Mission from '#models/mission'
import EmailService from './email_service.js'
import logger from '@adonisjs/core/services/logger'

export interface NotificationPayload {
  userId: string
  type: string
  title: string
  message: string
  data?: any
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export default class NotificationService {
  private readonly QUEUE_NAME = 'notifications'
  private emailService: EmailService

  constructor() {
    const ResendService = require('#services/resend_service').default
    const resendService = new ResendService()
    this.emailService = new EmailService(resendService)
  }

  async notify(user: User, type: string, data: any): Promise<void> {
    const payload: NotificationPayload = {
      userId: user.id,
      type,
      title: this.getTitle(type),
      message: this.getMessage(type, data),
      data,
      priority: this.getPriority(type),
    }

    // Push to Redis queue for processing
    await redis.lpush(this.QUEUE_NAME, JSON.stringify(payload))

    // For urgent notifications, also push to real-time channel
    if (payload.priority === 'urgent') {
      await this.pushRealTime(user.id, payload)
    }

    // Send email notification based on type
    try {
      await this.sendEmailNotification(user, type, data)
    } catch (error) {
      logger.error('Email notification failed:', error)
    }
  }

  async notifyTransporteurs(mission: Mission): Promise<void> {
    // Get all active transporteurs
    const transporteurs = await User.query().where('role', 'transporteur').where('status', 'active')

    // Load mission relations
    await mission.load('adresseDepart')
    await mission.load('adresseArrivee')

    // Prepare batch emails
    const emailData = transporteurs.map((transporteur) => ({
      to: transporteur.email,
      subject: `Nouvelle mission disponible: ${mission.title}`,
      template: 'emails/new-mission',
      data: {
        userName: transporteur.fullName || 'Transporteur',
        missionTitle: mission.title,
        description: mission.description,
        budget: mission.getBudgetRange(),
        departCity: mission.adresseDepart?.city,
        arriveeCity: mission.adresseArrivee?.city,
        dateDepart: mission.dateDepartEstime?.toFormat('dd/MM/yyyy'),
        missionUrl: `${process.env.FRONTEND_URL}/missions/${mission.id}`,
      },
    }))

    // Send batch emails
    await this.emailService.sendBatchEmails(emailData)

    // Also push to notification queue
    const notifications = transporteurs.map((t) => ({
      userId: t.id,
      type: 'new_mission',
      title: 'Nouvelle mission disponible',
      message: `Une nouvelle mission "${mission.title}" est disponible`,
      data: {
        missionId: mission.id,
        title: mission.title,
        budget: mission.getBudgetRange(),
      },
      priority: 'normal' as const,
    }))

    // Push all notifications to queue
    const pipeline = redis.pipeline()
    for (const notification of notifications) {
      pipeline.lpush(this.QUEUE_NAME, JSON.stringify(notification))
    }
    await pipeline.exec()
  }

  private async sendEmailNotification(user: User, type: string, data: any): Promise<void> {
    switch (type) {
      case 'proposition_accepted':
        const mission = await Mission.find(data.missionId)
        if (mission) {
          await this.emailService.sendPropositionAcceptedEmail(user, mission)
        }
        break

      case 'account_verified':
        await this.emailService.sendWelcomeEmail(user)
        break

      case 'mfa_enabled':
        await this.emailService.sendMFAEnabledNotification(user)
        break

      case 'account_locked':
        await this.emailService.sendAccountLockedNotification(user)
        break
    }
  }

  private async pushRealTime(userId: string, payload: NotificationPayload): Promise<void> {
    // Publish to user's channel for WebSocket delivery
    await redis.publish(`user:${userId}:notifications`, JSON.stringify(payload))
  }

  private getTitle(type: string): string {
    const titles: Record<string, string> = {
      new_mission: 'Nouvelle mission disponible',
      nouvelle_proposition: 'Nouvelle proposition reçue',
      proposition_accepted: 'Proposition acceptée',
      proposition_rejected: 'Proposition refusée',
      mission_assigned: 'Mission attribuée',
      mission_cancelled: 'Mission annulée',
      account_verified: 'Compte vérifié',
      mfa_enabled: '2FA activée',
      account_locked: 'Compte verrouillé',
    }
    return titles[type] || 'Notification'
  }

  private getMessage(type: string, data: any): string {
    switch (type) {
      case 'nouvelle_proposition':
        return `Nouvelle offre de ${data.prix} FCFA pour votre mission`
      case 'proposition_accepted':
        return 'Votre proposition a été acceptée'
      case 'proposition_rejected':
        return 'Votre proposition a été refusée'
      default:
        return 'Vous avez une nouvelle notification'
    }
  }

  private getPriority(type: string): 'low' | 'normal' | 'high' | 'urgent' {
    const priorities: Record<string, any> = {
      proposition_accepted: 'high',
      mission_cancelled: 'high',
      account_locked: 'urgent',
      nouvelle_proposition: 'normal',
      new_mission: 'normal',
    }
    return priorities[type] || 'normal'
  }
}
