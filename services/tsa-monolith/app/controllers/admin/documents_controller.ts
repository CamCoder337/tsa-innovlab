import type { HttpContext } from '@adonisjs/core/http'
import Document, { DocumentStatus } from '#models/document'
import User from '#models/user'
import Vehicle from '#models/vehicle'
import UserVerificationStatus, { KycStatus } from '#models/user_verification_status'
import VehicleVerificationStatus from '#models/vehicle_verification_status'
import DocumentVerificationService from '#services/document_verification_service'
import {
  validateDocumentValidator,
  rejectDocumentValidator,
  searchDocumentsValidator,
} from '#validators/document_validator'
import { DateTime } from 'luxon'

export default class AdminDocumentsController {
  private verificationService = new DocumentVerificationService()

  /**
   * Liste tous les documents avec filtres (admin)
   */
  async index({ request, response }: HttpContext) {
    const filters = await request.validateUsing(searchDocumentsValidator)

    const page = filters.page || 1
    const limit = filters.limit || 20

    const query = Document.query()
      .preload('user')
      .preload('documentType')
      .preload('validatedBy')
      .preload('vehicle')

    if (filters.status) {
      query.where('status', filters.status)
    }

    if (filters.documentTypeId) {
      query.where('document_type_id', filters.documentTypeId)
    }

    if (filters.userId) {
      query.where('user_id', filters.userId)
    }

    if (filters.vehicleId) {
      query.where('vehicle_id', filters.vehicleId)
    }

    query.orderBy('created_at', 'desc')

    const documents = await query.paginate(page, limit)

    return response.ok({
      success: true,
      data: documents,
    })
  }

  /**
   * Liste les documents en attente de validation
   */
  async pending({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const documents = await Document.query()
      .where('status', DocumentStatus.PENDING)
      .preload('user')
      .preload('documentType')
      .preload('vehicle')
      .orderBy('created_at', 'asc')
      .paginate(page, limit)

    return response.ok({
      success: true,
      data: documents,
    })
  }

  /**
   * Liste les documents expirant bientôt
   */
  async expiring({ request, response }: HttpContext) {
    const days = request.input('days', 30)
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const now = DateTime.now()
    const futureDate = now.plus({ days })

    const documents = await Document.query()
      .where('status', DocumentStatus.VALIDATED)
      .whereNotNull('expiration_date')
      .whereBetween('expiration_date', [now.toSQLDate()!, futureDate.toSQLDate()!])
      .preload('user')
      .preload('documentType')
      .preload('vehicle')
      .orderBy('expiration_date', 'asc')
      .paginate(page, limit)

    return response.ok({
      success: true,
      data: documents,
    })
  }

  /**
   * Affiche les détails d'un document (admin)
   */
  async show({ params, response }: HttpContext) {
    const document = await Document.query()
      .where('id', params.id)
      .preload('user')
      .preload('documentType')
      .preload('validatedBy')
      .preload('vehicle')
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
   * Valide un document (admin)
   */
  async validate({ auth, params, request, response }: HttpContext) {
    const admin = auth.user!
    const payload = await request.validateUsing(validateDocumentValidator)

    try {
      const document = await this.verificationService.validateDocument(
        params.id,
        admin.id,
        payload.notes
      )

      await document.load('documentType')
      await document.load('user')

      return response.ok({
        success: true,
        message: 'Document validé avec succès',
        data: document,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: error.message,
      })
    }
  }

  /**
   * Rejette un document (admin)
   */
  async reject({ auth, params, request, response }: HttpContext) {
    const admin = auth.user!
    const payload = await request.validateUsing(rejectDocumentValidator)

    try {
      const document = await this.verificationService.rejectDocument(
        params.id,
        admin.id,
        payload.reason
      )

      await document.load('documentType')
      await document.load('user')

      return response.ok({
        success: true,
        message: 'Document rejeté avec succès',
        data: document,
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: error.message,
      })
    }
  }

  /**
   * Liste tous les documents d'un utilisateur
   */
  async userDocuments({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.userId)

    const documents = await Document.query()
      .where('user_id', user.id)
      .preload('documentType')
      .preload('validatedBy')
      .preload('vehicle')
      .orderBy('created_at', 'desc')

    return response.ok({
      success: true,
      data: documents,
    })
  }

  /**
   * Retourne le statut de vérification KYC d'un utilisateur
   */
  async userVerificationStatus({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.userId)
    const status = await this.verificationService.calculateUserVerificationStatus(user.id)

    // Récupérer les documents requis et soumis
    const requiredDocuments = await this.verificationService.getRequiredDocumentsForUser(user)
    const submittedDocuments = await Document.query()
      .where('user_id', user.id)
      .whereNull('vehicle_id')
      .preload('documentType')

    return response.ok({
      success: true,
      data: {
        status,
        requiredDocuments,
        submittedDocuments,
      },
    })
  }

  /**
   * Liste tous les documents d'un véhicule
   */
  async vehicleDocuments({ params, response }: HttpContext) {
    const vehicle = await Vehicle.findOrFail(params.vehicleId)

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
   * Retourne le statut de vérification d'un véhicule
   */
  async vehicleVerificationStatus({ params, response }: HttpContext) {
    const vehicle = await Vehicle.findOrFail(params.vehicleId)
    const status = await this.verificationService.calculateVehicleVerificationStatus(vehicle.id)

    // Récupérer les documents requis et soumis
    const requiredDocuments = await this.verificationService.getRequiredDocumentsForVehicle(vehicle)
    const submittedDocuments = await Document.query()
      .where('vehicle_id', vehicle.id)
      .preload('documentType')

    return response.ok({
      success: true,
      data: {
        status,
        requiredDocuments,
        submittedDocuments,
      },
    })
  }

  /**
   * Dashboard de vérification global
   */
  async dashboard({ response }: HttpContext) {
    // Statistiques globales
    const totalDocuments = await Document.query().count('* as total')
    const pendingDocuments = await Document.query()
      .where('status', DocumentStatus.PENDING)
      .count('* as total')
    const validatedDocuments = await Document.query()
      .where('status', DocumentStatus.VALIDATED)
      .count('* as total')
    const rejectedDocuments = await Document.query()
      .where('status', DocumentStatus.REJECTED)
      .count('* as total')
    const expiredDocuments = await Document.query()
      .where('status', DocumentStatus.EXPIRED)
      .count('* as total')

    // Statistiques KYC utilisateurs
    const totalUsers = await User.query()
      .whereIn('role', ['affreteur', 'transporteur'])
      .count('* as total')
    const kycCompleted = await UserVerificationStatus.query()
      .where('kyc_status', KycStatus.VALIDATED)
      .count('* as total')
    const kycPending = await UserVerificationStatus.query()
      .where('kyc_status', KycStatus.PENDING)
      .count('* as total')
    const kycIncomplete = await UserVerificationStatus.query()
      .where('kyc_status', KycStatus.INCOMPLETE)
      .count('* as total')

    // Statistiques véhicules
    const totalVehicles = await Vehicle.query().count('* as total')
    const vehiclesVerified = await VehicleVerificationStatus.query()
      .where('verification_status', KycStatus.VALIDATED)
      .count('* as total')
    const vehiclesPending = await VehicleVerificationStatus.query()
      .where('verification_status', KycStatus.PENDING)
      .count('* as total')

    // Documents expirant dans les 30 prochains jours
    const now = DateTime.now()
    const thirtyDaysLater = now.plus({ days: 30 })
    const expiringDocuments = await Document.query()
      .where('status', DocumentStatus.VALIDATED)
      .whereNotNull('expiration_date')
      .whereBetween('expiration_date', [now.toSQLDate()!, thirtyDaysLater.toSQLDate()!])
      .count('* as total')

    return response.ok({
      success: true,
      data: {
        documents: {
          total: totalDocuments[0].$extras.total,
          pending: pendingDocuments[0].$extras.total,
          validated: validatedDocuments[0].$extras.total,
          rejected: rejectedDocuments[0].$extras.total,
          expired: expiredDocuments[0].$extras.total,
          expiringSoon: expiringDocuments[0].$extras.total,
        },
        users: {
          total: totalUsers[0].$extras.total,
          kycCompleted: kycCompleted[0].$extras.total,
          kycPending: kycPending[0].$extras.total,
          kycIncomplete: kycIncomplete[0].$extras.total,
        },
        vehicles: {
          total: totalVehicles[0].$extras.total,
          verified: vehiclesVerified[0].$extras.total,
          pending: vehiclesPending[0].$extras.total,
        },
      },
    })
  }
}
