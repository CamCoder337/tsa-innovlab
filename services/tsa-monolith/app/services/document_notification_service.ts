import Document from '#models/document'
import User from '#models/user'
import Vehicle from '#models/vehicle'
import mail from '@adonisjs/mail/services/main'

export default class DocumentNotificationService {
  /**
   * Envoie une notification de document expirant bientôt
   */
  async sendDocumentExpiringNotification(document: Document, daysLeft: number): Promise<void> {
    await document.load('user')
    await document.load('documentType')

    const urgency = daysLeft <= 7 ? 'urgent' : 'soon'

    await mail.send((message) => {
      message
        .to(document.user.email)
        .subject(
          urgency === 'urgent'
            ? `URGENT: Votre document expire dans ${daysLeft} jours`
            : `Votre document expire bientôt (${daysLeft} jours)`
        )
        .htmlView('emails/document_expiring_soon', {
          user: document.user,
          document,
          documentType: document.documentType,
          daysLeft,
          urgency,
          expirationDate: document.expirationDate,
        })
    })
  }

  /**
   * Envoie une notification de document expiré
   */
  async sendDocumentExpiredNotification(document: Document): Promise<void> {
    await document.load('user')
    await document.load('documentType')

    await mail.send((message) => {
      message
        .to(document.user.email)
        .subject(`Votre document ${document.documentType.labelFr} est expiré`)
        .htmlView('emails/document_expired', {
          user: document.user,
          document,
          documentType: document.documentType,
          expirationDate: document.expirationDate,
        })
    })
  }

  /**
   * Envoie une notification de document validé
   */
  async sendDocumentValidatedNotification(document: Document): Promise<void> {
    await document.load('user')
    await document.load('documentType')

    if (document.validatedById) {
      await document.load('validatedBy')
    }

    await mail.send((message) => {
      message
        .to(document.user.email)
        .subject(`Votre document ${document.documentType.labelFr} a été validé`)
        .htmlView('emails/document_validated', {
          user: document.user,
          document,
          documentType: document.documentType,
          validatedBy: document.validatedBy,
          validatedAt: document.validatedAt,
        })
    })
  }

  /**
   * Envoie une notification de document rejeté
   */
  async sendDocumentRejectedNotification(document: Document, reason: string): Promise<void> {
    await document.load('user')
    await document.load('documentType')

    await mail.send((message) => {
      message
        .to(document.user.email)
        .subject(`Votre document ${document.documentType.labelFr} a été rejeté`)
        .htmlView('emails/document_rejected', {
          user: document.user,
          document,
          documentType: document.documentType,
          reason,
        })
    })
  }

  /**
   * Envoie une notification de KYC complété
   */
  async sendKycCompletedNotification(user: User): Promise<void> {
    await mail.send((message) => {
      message
        .to(user.email)
        .subject('Félicitations ! Votre vérification KYC est complète')
        .htmlView('emails/kyc_completed', {
          user,
        })
    })
  }

  /**
   * Envoie une notification de véhicule vérifié
   */
  async sendVehicleVerifiedNotification(vehicle: Vehicle): Promise<void> {
    await vehicle.load('user')

    await mail.send((message) => {
      message
        .to(vehicle.user.email)
        .subject(`Votre véhicule ${vehicle.registration} est vérifié`)
        .htmlView('emails/vehicle_verified', {
          user: vehicle.user,
          vehicle,
        })
    })
  }
}
