import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Document, { DocumentStatus } from '#models/document'
import Vehicle from '#models/vehicle'
import DocumentVerificationService from '#services/document_verification_service'
import DocumentValidationHistory, {
  DocumentValidationAction,
} from '#models/document_validation_history'
import AuditLog from '#models/audit_log'
import { uploadDocumentValidator, updateDocumentValidator } from '#validators/document_validator'

export default class DocumentsController {
  private verificationService = new DocumentVerificationService()

  /**
   * Liste les documents de l'utilisateur connecté
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    const documents = await Document.query()
      .where('user_id', user.id)
      .whereNull('vehicle_id')
      .preload('documentType')
      .preload('validatedBy')
      .orderBy('created_at', 'desc')

    return response.ok({
      success: true,
      message: 'Documents récupérés avec succès',
      data: documents,
    })
  }

  /**
   * Upload un nouveau document
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(uploadDocumentValidator)

    // Vérifier que l'utilisateur peut uploader ce type de document
    const canUpload = await this.verificationService.canUploadDocument(
      user.id,
      payload.documentTypeId,
      payload.vehicleId || undefined
    )

    if (!canUpload) {
      return response.badRequest({
        success: false,
        message: 'Un document actif de ce type existe déjà',
      })
    }

    // Si vehicleId fourni, vérifier que le véhicule appartient à l'utilisateur
    if (payload.vehicleId) {
      const vehicle = await Vehicle.query()
        .where('id', payload.vehicleId)
        .where('user_id', user.id)
        .first()

      if (!vehicle) {
        return response.forbidden({
          success: false,
          message: "Véhicule non trouvé ou vous n'en êtes pas le propriétaire",
        })
      }
    }

    // Créer le document (convertir les dates en DateTime)
    const document = await Document.create({
      documentTypeId: payload.documentTypeId,
      vehicleId: payload.vehicleId,
      userId: user.id,
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileSizeBytes: payload.fileSizeBytes,
      mimeType: payload.mimeType,
      issueDate: payload.issueDate ? DateTime.fromJSDate(payload.issueDate) : null,
      expirationDate: payload.expirationDate ? DateTime.fromJSDate(payload.expirationDate) : null,
      metadata: payload.metadata,
      status: DocumentStatus.PENDING,
      version: 1,
    })

    // Créer une entrée dans l'historique
    await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.RESUBMITTED,
      previousStatus: null,
      newStatus: DocumentStatus.PENDING,
      performedById: user.id,
      reason: 'Document uploadé',
    })

    // Logger dans audit_logs
    await AuditLog.create({
      userId: user.id,
      action: 'documents.uploaded',
      entityType: 'documents',
      entityId: document.id,
      oldValues: {},
      newValues: { status: DocumentStatus.PENDING },
      metadata: { documentTypeId: payload.documentTypeId, vehicleId: payload.vehicleId },
    })

    // Recalculer le statut de vérification
    if (payload.vehicleId) {
      await this.verificationService.calculateVehicleVerificationStatus(payload.vehicleId)
    } else {
      await this.verificationService.calculateUserVerificationStatus(user.id)
    }

    await document.load('documentType')

    return response.created({
      success: true,
      message: 'Document uploadé avec succès',
      data: document,
    })
  }

  /**
   * Affiche les détails d'un document
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const document = await Document.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .preload('documentType')
      .preload('validatedBy')
      .preload('validationHistory', (query) => {
        query.preload('performedBy').orderBy('created_at', 'desc')
      })
      .firstOrFail()

    return response.ok({
      success: true,
      data: document,
    })
  }

  /**
   * Met à jour les métadonnées d'un document
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(updateDocumentValidator)

    const document = await Document.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    // Seuls les documents en attente ou rejetés peuvent être modifiés
    if (![DocumentStatus.PENDING, DocumentStatus.REJECTED].includes(document.status)) {
      return response.badRequest({
        success: false,
        message: 'Seuls les documents en attente ou rejetés peuvent être modifiés',
      })
    }

    // Mettre à jour les champs (convertir les dates en DateTime)
    if (payload.metadata !== undefined) {
      document.metadata = payload.metadata
    }
    if (payload.issueDate !== undefined) {
      document.issueDate = payload.issueDate ? DateTime.fromJSDate(payload.issueDate) : null
    }
    if (payload.expirationDate !== undefined) {
      document.expirationDate = payload.expirationDate
        ? DateTime.fromJSDate(payload.expirationDate)
        : null
    }

    await document.save()

    return response.ok({
      success: true,
      message: 'Document mis à jour avec succès',
      data: document,
    })
  }

  /**
   * Supprime un document (seulement si pending ou rejected)
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const document = await Document.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    // Seuls les documents en attente ou rejetés peuvent être supprimés
    if (![DocumentStatus.PENDING, DocumentStatus.REJECTED].includes(document.status)) {
      return response.badRequest({
        success: false,
        message: 'Seuls les documents en attente ou rejetés peuvent être supprimés',
      })
    }

    const vehicleId = document.vehicleId

    await document.delete()

    // Recalculer le statut de vérification
    if (vehicleId) {
      await this.verificationService.calculateVehicleVerificationStatus(vehicleId)
    } else {
      await this.verificationService.calculateUserVerificationStatus(user.id)
    }

    return response.ok({
      success: true,
      message: 'Document supprimé avec succès',
    })
  }

  /**
   * Retourne le statut de vérification KYC global de l'utilisateur
   */
  async verificationStatus({ auth, response }: HttpContext) {
    const user = auth.user!
    const status = await this.verificationService.calculateUserVerificationStatus(user.id)

    return response.ok({
      success: true,
      data: status,
    })
  }

  /**
   * Retourne la liste des documents requis pour l'utilisateur
   */
  async required({ auth, response }: HttpContext) {
    const user = auth.user!
    const requiredDocuments = await this.verificationService.getRequiredDocumentsForUser(user)

    // Récupérer les documents déjà soumis
    const submittedDocuments = await Document.query()
      .where('user_id', user.id)
      .whereNull('vehicle_id')
      .select('document_type_id', 'status')

    const documentsWithStatus = requiredDocuments.map((docType) => {
      const submitted = submittedDocuments.find((d) => d.documentTypeId === docType.id)
      return {
        ...docType.serialize(),
        submitted: !!submitted,
        status: submitted?.status || null,
      }
    })

    return response.ok({
      success: true,
      data: documentsWithStatus,
    })
  }

  /**
   * Liste les documents d'un véhicule
   */
  async vehicleDocuments({ auth, params, response }: HttpContext) {
    const user = auth.user!

    // Vérifier que le véhicule appartient à l'utilisateur
    const vehicle = await Vehicle.query()
      .where('id', params.vehicleId)
      .where('user_id', user.id)
      .firstOrFail()

    const documents = await Document.query()
      .where('vehicle_id', vehicle.id)
      .preload('documentType')
      .preload('validatedBy')
      .orderBy('created_at', 'desc')

    return response.ok({
      success: true,
      data: documents,
    })
  }

  /**
   * Upload un document pour un véhicule
   */
  async storeVehicleDocument({ auth, params, request, response }: HttpContext) {
    const user = auth.user!

    // Vérifier que le véhicule appartient à l'utilisateur
    const vehicle = await Vehicle.query()
      .where('id', params.vehicleId)
      .where('user_id', user.id)
      .firstOrFail()

    const payload = await request.validateUsing(uploadDocumentValidator)

    // Forcer le vehicleId
    payload.vehicleId = vehicle.id

    // Vérifier que l'utilisateur peut uploader ce type de document
    const canUpload = await this.verificationService.canUploadDocument(
      user.id,
      payload.documentTypeId,
      vehicle.id
    )

    if (!canUpload) {
      return response.badRequest({
        success: false,
        message: 'Un document actif de ce type existe déjà pour ce véhicule',
      })
    }

    // Créer le document (convertir les dates en DateTime)
    const document = await Document.create({
      documentTypeId: payload.documentTypeId,
      vehicleId: vehicle.id,
      userId: user.id,
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileSizeBytes: payload.fileSizeBytes,
      mimeType: payload.mimeType,
      issueDate: payload.issueDate ? DateTime.fromJSDate(payload.issueDate) : null,
      expirationDate: payload.expirationDate ? DateTime.fromJSDate(payload.expirationDate) : null,
      metadata: payload.metadata,
      status: DocumentStatus.PENDING,
      version: 1,
    })

    // Créer une entrée dans l'historique
    await DocumentValidationHistory.create({
      documentId: document.id,
      action: DocumentValidationAction.RESUBMITTED,
      previousStatus: null,
      newStatus: DocumentStatus.PENDING,
      performedById: user.id,
      reason: 'Document véhicule uploadé',
    })

    // Logger dans audit_logs
    await AuditLog.create({
      userId: user.id,
      action: 'documents.uploaded',
      entityType: 'documents',
      entityId: document.id,
      oldValues: {},
      newValues: { status: DocumentStatus.PENDING },
      metadata: { documentTypeId: payload.documentTypeId, vehicleId: vehicle.id },
    })

    // Recalculer le statut de vérification du véhicule
    await this.verificationService.calculateVehicleVerificationStatus(vehicle.id)

    await document.load('documentType')

    return response.created({
      success: true,
      message: 'Document véhicule uploadé avec succès',
      data: document,
    })
  }

  /**
   * Retourne le statut de vérification d'un véhicule
   */
  async vehicleVerificationStatus({ auth, params, response }: HttpContext) {
    const user = auth.user!

    // Vérifier que le véhicule appartient à l'utilisateur
    const vehicle = await Vehicle.query()
      .where('id', params.vehicleId)
      .where('user_id', user.id)
      .firstOrFail()

    const status = await this.verificationService.calculateVehicleVerificationStatus(vehicle.id)

    return response.ok({
      success: true,
      data: status,
    })
  }
}
