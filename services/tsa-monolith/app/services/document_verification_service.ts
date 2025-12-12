import { DateTime } from 'luxon'
import Document, { DocumentStatus } from '#models/document'
import DocumentType, { DocumentApplicableTo } from '#models/document_type'
import User from '#models/user'
import Vehicle from '#models/vehicle'
import UserVerificationStatus, { KycStatus } from '#models/user_verification_status'
import VehicleVerificationStatus from '#models/vehicle_verification_status'
import DocumentValidationHistory, {
  DocumentValidationAction,
} from '#models/document_validation_history'
import AuditLog from '#models/audit_log'
import DocumentNotificationService from '#services/document_notification_service'

export default class DocumentVerificationService {
  /**
   * Calcule et met à jour le statut de vérification KYC d'un utilisateur
   */
  async calculateUserVerificationStatus(userId: string): Promise<UserVerificationStatus> {
    const user = await User.findOrFail(userId)

    // Récupérer les types de documents requis pour le rôle de l'utilisateur
    const requiredDocuments = await this.getRequiredDocumentsForUser(user)
    const requiredCount = requiredDocuments.length

    // Récupérer tous les documents de l'utilisateur (hors véhicules)
    const documents = await Document.query()
      .where('user_id', userId)
      .whereNull('vehicle_id')
      .preload('documentType')

    // Compter les documents par statut
    const submittedCount = documents.length
    const validatedCount = documents.filter((d) => d.status === DocumentStatus.VALIDATED).length
    const rejectedCount = documents.filter((d) => d.status === DocumentStatus.REJECTED).length
    const expiredCount = documents.filter((d) => d.status === DocumentStatus.EXPIRED).length

    // Déterminer le statut KYC
    let kycStatus: KycStatus = KycStatus.INCOMPLETE
    let kycCompletedAt: DateTime | null = null

    if (submittedCount < requiredCount) {
      kycStatus = KycStatus.INCOMPLETE
    } else if (rejectedCount > 0) {
      kycStatus = KycStatus.REJECTED
    } else if (expiredCount > 0) {
      kycStatus = KycStatus.EXPIRED
    } else if (validatedCount === requiredCount) {
      kycStatus = KycStatus.VALIDATED
      kycCompletedAt = DateTime.now()
    } else if (submittedCount === requiredCount && validatedCount < requiredCount) {
      kycStatus = KycStatus.PENDING
    }

    if (rejectedCount > 0 || expiredCount > 0) {
      kycStatus = KycStatus.ACTION_REQUIRED
    }

    // Récupérer ou créer le statut de vérification
    let verificationStatus = await UserVerificationStatus.query()
      .where('user_id', userId)
      .first()

    if (!verificationStatus) {
      verificationStatus = await UserVerificationStatus.create({
        userId,
        kycStatus,
        kycCompletedAt,
        documentsRequiredCount: requiredCount,
        documentsSubmittedCount: submittedCount,
        documentsValidatedCount: validatedCount,
        documentsRejectedCount: rejectedCount,
        documentsExpiredCount: expiredCount,
      })
    } else {
      verificationStatus.kycStatus = kycStatus
      verificationStatus.kycCompletedAt = kycStatus === KycStatus.VALIDATED ? kycCompletedAt : null
      verificationStatus.documentsRequiredCount = requiredCount
      verificationStatus.documentsSubmittedCount = submittedCount
      verificationStatus.documentsValidatedCount = validatedCount
      verificationStatus.documentsRejectedCount = rejectedCount
      verificationStatus.documentsExpiredCount = expiredCount
      await verificationStatus.save()
    }

    return verificationStatus
  }

  /**
   * Calcule et met à jour le statut de vérification d'un véhicule
   */
  async calculateVehicleVerificationStatus(
    vehicleId: string
  ): Promise<VehicleVerificationStatus> {
    const vehicle = await Vehicle.findOrFail(vehicleId)

    // Récupérer les types de documents requis pour le type de véhicule
    const requiredDocuments = await this.getRequiredDocumentsForVehicle(vehicle)
    const requiredCount = requiredDocuments.length

    // Récupérer tous les documents du véhicule
    const documents = await Document.query()
      .where('vehicle_id', vehicleId)
      .preload('documentType')

    // Compter les documents par statut
    const submittedCount = documents.length
    const validatedCount = documents.filter((d) => d.status === DocumentStatus.VALIDATED).length
    const rejectedCount = documents.filter((d) => d.status === DocumentStatus.REJECTED).length
    const expiredCount = documents.filter((d) => d.status === DocumentStatus.EXPIRED).length

    // Déterminer le statut de vérification
    let verificationStatus: KycStatus = KycStatus.INCOMPLETE
    let verifiedAt: DateTime | null = null

    if (submittedCount < requiredCount) {
      verificationStatus = KycStatus.INCOMPLETE
    } else if (rejectedCount > 0) {
      verificationStatus = KycStatus.REJECTED
    } else if (expiredCount > 0) {
      verificationStatus = KycStatus.EXPIRED
    } else if (validatedCount === requiredCount) {
      verificationStatus = KycStatus.VALIDATED
      verifiedAt = DateTime.now()
    } else if (submittedCount === requiredCount && validatedCount < requiredCount) {
      verificationStatus = KycStatus.PENDING
    }

    if (rejectedCount > 0 || expiredCount > 0) {
      verificationStatus = KycStatus.ACTION_REQUIRED
    }

    // Trouver la prochaine date d'expiration
    const validatedDocs = documents.filter((d) => d.status === DocumentStatus.VALIDATED)
    const expiringDocs = validatedDocs
      .filter((d) => d.expirationDate !== null)
      .sort((a, b) => {
        if (!a.expirationDate || !b.expirationDate) return 0
        return a.expirationDate < b.expirationDate ? -1 : 1
      })

    const nextExpirationDate = expiringDocs.length > 0 ? expiringDocs[0].expirationDate : null

    // Récupérer ou créer le statut de vérification
    let vehicleStatus = await VehicleVerificationStatus.query()
      .where('vehicle_id', vehicleId)
      .first()

    if (!vehicleStatus) {
      vehicleStatus = await VehicleVerificationStatus.create({
        vehicleId,
        verificationStatus,
        verifiedAt,
        documentsRequiredCount: requiredCount,
        documentsSubmittedCount: submittedCount,
        documentsValidatedCount: validatedCount,
        documentsRejectedCount: rejectedCount,
        documentsExpiredCount: expiredCount,
        nextExpirationDate,
      })
    } else {
      vehicleStatus.verificationStatus = verificationStatus
      vehicleStatus.verifiedAt =
        verificationStatus === KycStatus.VALIDATED ? verifiedAt : null
      vehicleStatus.documentsRequiredCount = requiredCount
      vehicleStatus.documentsSubmittedCount = submittedCount
      vehicleStatus.documentsValidatedCount = validatedCount
      vehicleStatus.documentsRejectedCount = rejectedCount
      vehicleStatus.documentsExpiredCount = expiredCount
      vehicleStatus.nextExpirationDate = nextExpirationDate
      await vehicleStatus.save()
    }

    return vehicleStatus
  }

  /**
   * Retourne la liste des types de documents requis pour un utilisateur
   */
  async getRequiredDocumentsForUser(user: User): Promise<DocumentType[]> {
    return await DocumentType.query()
      .where('applicable_to', DocumentApplicableTo.USER)
      .where('is_active', true)
      .whereRaw(`? = ANY(required_for_roles)`, [user.role])
      .orderBy('display_order', 'asc')
  }

  /**
   * Retourne la liste des types de documents requis pour un véhicule
   */
  async getRequiredDocumentsForVehicle(vehicle: Vehicle): Promise<DocumentType[]> {
    return await DocumentType.query()
      .where('applicable_to', DocumentApplicableTo.VEHICLE)
      .where('is_active', true)
      .whereRaw(`? = ANY(required_for_vehicle_types)`, [vehicle.type])
      .orderBy('display_order', 'asc')
  }

  /**
   * Valide un document (action admin)
   */
  async validateDocument(
    documentId: string,
    adminId: string,
    notes?: string
  ): Promise<Document> {
    const document = await Document.findOrFail(documentId)

    if (document.status !== DocumentStatus.PENDING) {
      throw new Error('Seuls les documents en attente peuvent être validés')
    }

    // Charger le type de document pour obtenir la durée de validité
    await document.load('documentType')

    const previousStatus = document.status

    // Mettre à jour le document
    document.status = DocumentStatus.VALIDATED
    document.validatedById = adminId
    document.validatedAt = DateTime.now()

    // Calculer la date d'expiration si le document a une expiration
    if (document.documentType.hasExpiration && document.documentType.defaultValidityDays) {
      const validityDays = document.documentType.defaultValidityDays
      document.expirationDate = DateTime.now().plus({ days: validityDays })
      document.expiresAt = DateTime.now().plus({ days: validityDays })
    }

    await document.save()

    // Créer une entrée dans l'historique de validation
    await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.VALIDATED,
      previousStatus,
      newStatus: DocumentStatus.VALIDATED,
      performedById: adminId,
      reason: notes || null,
    })

    // Logger dans audit_logs
    await AuditLog.create({
      userId: adminId,
      action: 'documents.validated',
      entityType: 'documents',
      entityId: document.id,
      oldValues: { status: previousStatus },
      newValues: { status: DocumentStatus.VALIDATED, validatedById: adminId },
      metadata: { documentTypeId: document.documentTypeId, vehicleId: document.vehicleId },
    })

    // Recalculer le statut de vérification
    if (document.vehicleId) {
      const vehicleStatus = await this.calculateVehicleVerificationStatus(document.vehicleId)

      // Si véhicule complètement vérifié, envoyer notification
      if (vehicleStatus.isComplete()) {
        const vehicle = await Vehicle.findOrFail(document.vehicleId)
        const notificationService = new DocumentNotificationService()
        await notificationService.sendVehicleVerifiedNotification(vehicle)
      }
    } else {
      const userStatus = await this.calculateUserVerificationStatus(document.userId)

      // Si KYC complet, envoyer notification
      if (userStatus.isComplete()) {
        const user = await User.findOrFail(document.userId)
        const notificationService = new DocumentNotificationService()
        await notificationService.sendKycCompletedNotification(user)
      }
    }

    // Envoyer notification de validation à l'utilisateur
    const notificationService = new DocumentNotificationService()
    await notificationService.sendDocumentValidatedNotification(document)

    return document
  }

  /**
   * Rejette un document (action admin)
   */
  async rejectDocument(
    documentId: string,
    adminId: string,
    reason: string
  ): Promise<Document> {
    const document = await Document.findOrFail(documentId)

    if (document.status !== DocumentStatus.PENDING) {
      throw new Error('Seuls les documents en attente peuvent être rejetés')
    }

    const previousStatus = document.status

    // Mettre à jour le document
    document.status = DocumentStatus.REJECTED
    document.rejectionReason = reason
    await document.save()

    // Créer une entrée dans l'historique de validation
    await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.REJECTED,
      previousStatus,
      newStatus: DocumentStatus.REJECTED,
      performedById: adminId,
      reason,
    })

    // Logger dans audit_logs
    await AuditLog.create({
      userId: adminId,
      action: 'documents.rejected',
      entityType: 'documents',
      entityId: document.id,
      oldValues: { status: previousStatus },
      newValues: { status: DocumentStatus.REJECTED, rejectionReason: reason },
      metadata: { documentTypeId: document.documentTypeId, vehicleId: document.vehicleId },
    })

    // Recalculer le statut de vérification
    if (document.vehicleId) {
      await this.calculateVehicleVerificationStatus(document.vehicleId)
    } else {
      await this.calculateUserVerificationStatus(document.userId)
    }

    // Envoyer notification de rejet à l'utilisateur
    const notificationService = new DocumentNotificationService()
    await notificationService.sendDocumentRejectedNotification(document, reason)

    return document
  }

  /**
   * Vérifie si un utilisateur peut uploader un document de ce type
   */
  async canUploadDocument(
    userId: string,
    documentTypeId: string,
    vehicleId?: string
  ): Promise<boolean> {
    // Vérifier s'il existe déjà un document actif (pending ou validated) du même type
    const existingDocument = await Document.query()
      .where('user_id', userId)
      .where('document_type_id', documentTypeId)
      .where((query) => {
        if (vehicleId) {
          query.where('vehicle_id', vehicleId)
        } else {
          query.whereNull('vehicle_id')
        }
      })
      .whereIn('status', [DocumentStatus.PENDING, DocumentStatus.VALIDATED])
      .first()

    return !existingDocument
  }

  /**
   * Expire les documents obsolètes (à exécuter via cron)
   */
  async checkDocumentExpirations(): Promise<number> {
    const today = DateTime.now().startOf('day')

    // Trouver tous les documents validés dont la date d'expiration est dépassée
    const expiredDocuments = await Document.query()
      .where('status', DocumentStatus.VALIDATED)
      .whereNotNull('expiration_date')
      .where('expiration_date', '<=', today.toSQLDate()!)

    let count = 0

    for (const document of expiredDocuments) {
      const previousStatus = document.status

      // Mettre à jour le statut
      document.status = DocumentStatus.EXPIRED
      await document.save()

      // Créer une entrée dans l'historique
      await DocumentValidationHistory.create({
        documentId: document.id,
        action: DocumentValidationAction.AUTO_EXPIRED,
        previousStatus,
        newStatus: DocumentStatus.EXPIRED,
        performedById: null, // Action système
        reason: 'Document expiré automatiquement',
      })

      // Logger dans audit_logs
      await AuditLog.create({
        userId: document.userId,
        action: 'documents.expired',
        entityType: 'documents',
        entityId: document.id,
        oldValues: { status: previousStatus },
        newValues: { status: DocumentStatus.EXPIRED },
        metadata: { auto_expired: true },
      })

      // Recalculer le statut de vérification
      if (document.vehicleId) {
        await this.calculateVehicleVerificationStatus(document.vehicleId)
      } else {
        await this.calculateUserVerificationStatus(document.userId)
      }

      // Envoyer notification
      const notificationService = new DocumentNotificationService()
      await notificationService.sendDocumentExpiredNotification(document)

      count++
    }

    return count
  }

  /**
   * Envoie les notifications d'expiration (à exécuter via cron)
   */
  async sendExpirationNotifications(): Promise<void> {
    const notificationService = new DocumentNotificationService()
    const now = DateTime.now()

    // Documents expirant dans 30 jours (notification non encore envoyée)
    const documents30Days = await Document.query()
      .where('status', DocumentStatus.VALIDATED)
      .whereNotNull('expiration_date')
      .whereBetween('expiration_date', [
        now.toSQLDate()!,
        now.plus({ days: 30 }).toSQLDate()!,
      ])
      .whereNull('expiration_notified_at')

    for (const document of documents30Days) {
      const daysLeft = document.daysUntilExpiration()
      if (daysLeft !== null && daysLeft <= 30) {
        await notificationService.sendDocumentExpiringNotification(document, daysLeft)
        document.expirationNotifiedAt = DateTime.now()
        await document.save()
      }
    }

    // Documents expirant dans 7 jours (notification urgente)
    const documents7Days = await Document.query()
      .where('status', DocumentStatus.VALIDATED)
      .whereNotNull('expiration_date')
      .whereBetween('expiration_date', [now.toSQLDate()!, now.plus({ days: 7 }).toSQLDate()!])

    for (const document of documents7Days) {
      const daysLeft = document.daysUntilExpiration()
      if (daysLeft !== null && daysLeft <= 7 && daysLeft > 0) {
        await notificationService.sendDocumentExpiringNotification(document, daysLeft)
      }
    }
  }
}
