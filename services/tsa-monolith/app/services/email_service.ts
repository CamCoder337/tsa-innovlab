// app/services/email_service.ts
import mail from '@adonisjs/mail/services/main'
import { inject } from '@adonisjs/core'
import User from '#models/user'
import Mission from '#models/mission'
import { DateTime } from 'luxon'
import env from '#start/env'
import redis from '@adonisjs/redis/services/main'
import { EmailData } from '../types/email.js'

@inject()
export default class EmailService {
  private from = `TSA Logistics <${env.get('MAIL_FROM')}>`

  private async send(
    to: string,
    subject: string,
    view: string,
    data: Record<string, any>,
    queue = true
  ) {
    if (queue) {
      // Utiliser notre queue Redis personnalisée
      await this.sendViaQueue(to, subject, view, data)
    } else {
      // Envoi direct
      await mail.send((message) => {
        message.from(this.from).to(to).subject(subject).htmlView(view, data)
      })
    }
  }

  async sendVerificationEmail(user: User, token: string) {
    console.log('🔍 ENVOI EMAIL VERIFICATION POUR:', user.email) // DEBUG
    const verificationUrl = `${env.get('FRONTEND_URL')}/verify-email?token=${token}`

    return this.send(
      user.email,
      'Vérifiez votre adresse email - TSA Logistics',
      'emails/verify_email',
      {
        userName: user.fullName || 'Utilisateur',
        verificationUrl,
        expiresIn: '24 heures',
      },
      true // Test queue Redis à nouveau
    )
  }

  async sendPasswordResetEmail(user: User, token: string) {
    const resetUrl = `${env.get('FRONTEND_URL')}/reset-password?token=${token}`

    return this.send(
      user.email,
      'Réinitialisation de mot de passe - TSA Logistics',
      'emails/password_reset',
      {
        userName: user.fullName || 'Utilisateur',
        resetUrl,
        expiresIn: '1 heure',
      }
    )
  }

  async sendWelcomeEmail(user: User) {
    const dashboardUrl = `${env.get('FRONTEND_URL')}/dashboard`

    return this.send(user.email, 'Bienvenue sur TSA Logistics 🚛', 'emails/welcome', {
      userName: user.fullName || 'Utilisateur',
      role: this.getRoleName(user.role),
      dashboardUrl,
      features: this.getRoleFeatures(user.role),
    }, true) // Utiliser la queue pour les emails de bienvenue
  }

  async sendNewMissionNotification(transporteur: User, mission: Mission) {
    const missionUrl = `${env.get('FRONTEND_URL')}/missions/${mission.id}`

    return this.send(
      transporteur.email,
      `Nouvelle mission disponible : ${mission.titre}`,
      'emails/new_mission',
      {
        userName: transporteur.fullName || 'Transporteur',
        missionTitle: mission.titre,
        description: mission.description,
        budget: mission.getBudgetRange(),
        departCity: mission.adresseDepart?.city,
        arriveeCity: mission.adresseArrivee?.city,
        dateDepart: mission.dateDepartEstime?.toFormat('dd/MM/yyyy'),
        missionUrl,
      }
    )
  }

  async sendPropositionAcceptedEmail(user: User, mission: Mission): Promise<void> {
    const missionUrl = `${process.env.FRONTEND_URL}/missions/${mission.id}`
    return this.send(
      user.email,
      'Votre proposition a été acceptée - TSA Logistics',
      'emails/proposition-accepted',
      {
        userName: user.fullName || 'Transporteur',
        missionTitle: mission.titre,
        departDate: mission.dateDepartEstime?.toFormat('dd/MM/yyyy'),
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        missionUrl,
      }
    )
  }

  async sendBatchEmails(emails: EmailData[]) {
    const pipeline = redis.pipeline()
    for (const email of emails) {
      pipeline.lpush('email_queue', JSON.stringify(email))
    }
    await pipeline.exec()
  }

  /**
   * Envoie un email via la queue Redis pour traitement asynchrone
   * Idéal pour la scalabilité (5000+ utilisateurs)
   */
  async sendViaQueue(
    to: string,
    subject: string,
    template: string,
    data: Record<string, any>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) {
    const emailData: EmailData = {
      to,
      subject,
      template,
      data,
      priority,
      createdAt: new Date().toISOString(),
    }

    const queueName = priority === 'high' ? 'email_queue_priority' : 'email_queue'
    await redis.lpush(queueName, JSON.stringify(emailData))
  }

  async sendLowStockAlert(adminEmail: string, products: any[]) {
    return this.send(
      adminEmail,
      '⚠️ Alerte Stock Faible - Action Requise',
      'emails/low_stock_alert',
      {
        products,
        dashboardUrl: `${env.get('FRONTEND_URL')}/admin/products`,
        alertDate: DateTime.now().toFormat('dd/MM/yyyy HH:mm'),
      }
    )
  }

  async sendMFAEnabledNotification(user: User) {
    return this.send(
      user.email,
      '🔐 Authentification à deux facteurs activée',
      'emails/mfa_enabled',
      {
        userName: user.fullName || 'Utilisateur',
        enabledAt: DateTime.now().toFormat('dd/MM/yyyy HH:mm'),
        securityUrl: `${env.get('FRONTEND_URL')}/settings/security`,
      }
    )
  }

  async sendAccountLockedNotification(user: User) {
    return this.send(user.email, '🔒 Compte temporairement verrouillé', 'emails/account_locked', {
      userName: user.fullName || 'Utilisateur',
      unlockTime: user.lockedUntil?.toFormat('dd/MM/yyyy HH:mm'),
      supportEmail: env.get('SUPPORT_EMAIL', 'support@tsa-logistics.com'),
    })
  }

  async sendAdminMFASetupEmail(user: User, manualEntryKey: string, recoveryCodes: string[], accountName: string, issuer: string) {
    console.log('🔍 ENVOI EMAIL MFA POUR:', user.email) // DEBUG
    // Envoi direct simple sans QR code (beaucoup plus rapide)
    return this.send(
      user.email,
      '🔐 Configuration MFA Obligatoire - Compte Administrateur',
      'emails/admin_mfa_setup',
      {
        userName: user.fullName || 'Administrateur',
        manualEntryKey, // Secret formaté pour saisie manuelle
        recoveryCodes,
        accountName,
        issuer,
        mfaUrl: `${env.get('FRONTEND_URL')}/settings/mfa`,
        supportEmail: env.get('SUPPORT_EMAIL', 'support@tsa-logistics.com'),
      },
      true // Test queue Redis à nouveau
    )
  }

  // === Helpers ===
  private getRoleName(role: string): string {
    const roles: Record<string, string> = {
      admin: 'Administrateur',
      transporteur: 'Transporteur',
      affreteur: 'Affréteur',
    }
    return roles[role] || 'Utilisateur'
  }

  private getRoleFeatures(role: string): string[] {
    const features: Record<string, string[]> = {
      admin: [
        'Gestion complète de la plateforme',
        'Accès aux statistiques détaillées',
        'Gestion des utilisateurs et des produits',
        'Supervision des missions',
      ],
      transporteur: [
        'Consultation des missions disponibles',
        'Soumission de propositions',
        'Suivi de vos transports',
        'Gestion de votre profil',
      ],
      affreteur: [
        'Création de missions de transport',
        'Réception et gestion des propositions',
        'Suivi en temps réel',
        'Historique complet',
      ],
    }
    return features[role] || []
  }
}
