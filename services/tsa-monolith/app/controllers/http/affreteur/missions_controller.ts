import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import Mission, { MissionStatus } from '#models/mission'
import Address from '#models/address'
import {
  createMissionValidator,
  missionQueryValidator,
  updateMissionValidator,
} from '#validators/mission_validator'
import db from '@adonisjs/lucid/services/db'
import MissionNotificationService from '#services/mission_notification_service'
import MissionUpdate from '#models/mission_update'

/**
 * Contrôleur pour la gestion des missions par les affréteurs
 * @fileoverview CRUD complet des missions avec publication/dépublication
 * @tags Affreteur-Missions
 */
@inject()
export default class MissionsController {
  constructor(private missionNotificationService: MissionNotificationService) {}

  /*
   * @index
   * @summary Récupérer mes missions
   * @description Liste paginée des missions de l'affréteur connecté avec filtres de recherche
   * @paramQuery page - Page actuelle - @default(1) @type(number)
   * @paramQuery limit - Nombre d'éléments par page - @default(15) @type(number)
   * @paramQuery status - Filtre par statut - @enum(draft,published,assigned,completed,cancelled)
   * @paramQuery search - Recherche dans titre, description, type marchandise
   * @responseBody 200 - Liste des missions récupérée avec succès
   * @responseBody 500 - Erreur serveur
   */
  async index({ request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const validatedData = await request.validateUsing(missionQueryValidator)

      const {
        page = 1,
        limit = 15,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = validatedData

      const query = Mission.query()
        .where('affreteur_id', user.id)
        .preload('affreteur')
        .preload('transporteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'phone', 'email')
        })
        .preload('adresseDepart')
        .preload('adresseArrivee')

      if (status) {
        query.where('status', status)
      }

      if (search) {
        query.where((builder) => {
          builder
            .whereILike('title', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
            .orWhereILike('type_marchandise', `%${search}%`)
        })
      }

      query.orderBy(sortBy === 'created_at' ? 'created_at' : sortBy, sortOrder)

      const missions = await query.paginate(page, limit)

      return response.json({
        success: true,
        message: 'Missions retrieved successfully',
        data: {
          missions: missions.serialize(),
          pagination: {
            current_page: missions.currentPage,
            per_page: missions.perPage,
            total: missions.total,
            last_page: missions.lastPage,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve missions',
        error: error.message,
      })
    }
  }

  /*
   * @store
   * @summary Créer une nouvelle mission
   * @description Crée une mission avec statut DRAFT. L'affréteur peut ensuite la publier
   * @requestBody title - Titre de la mission - @required @type(string)
   * @requestBody description - Description détaillée - @type(string)
   * @requestBody typeMarchandise - Type de marchandise - @required @type(string)
   * @requestBody poids - Poids en kg - @type(number)
   * @requestBody volume - Volume en m3 - @type(number)
   * @requestBody dateDepartEstime - Date départ estimée - @type(string)
   * @requestBody dateArriveePrevue - Date arrivée prévue - @type(string)
   * @requestBody budgetMin - Budget minimum en FCFA - @type(number)
   * @requestBody budgetMax - Budget maximum en FCFA - @type(number)
   * @responseBody 201 - Mission créée avec succès
   * @responseBody 422 - Erreur de validation
   * @responseBody 500 - Erreur serveur
   */
  async store({ request, auth, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.getUserOrFail()

      // Debug: log des données reçues
      console.log('🐛 Raw request data:', JSON.stringify(request.all(), null, 2))

      const validatedData = await request.validateUsing(createMissionValidator)

      // Debug: log des données validées
      console.log('✅ Validated data:', JSON.stringify(validatedData, null, 2))

      let adresseDepartId: string | null = null
      let adresseArriveeId: string | null = null

      // Gérer l'adresse de départ
      if (validatedData.adresseDepart) {
        if (validatedData.adresseDepart.id) {
          // ✅ Vérifier que l'adresse existe ET appartient à l'affréteur connecté
          const existingAddress = await Address.query({ client: trx })
            .where('id', validatedData.adresseDepart.id)
            .where('user_id', user.id)
            .first()

          if (!existingAddress) {
            await trx.rollback()
            return response.status(403).json({
              success: false,
              message: 'Departure address not found or does not belong to you',
              errors: ["L'adresse de départ n'existe pas ou ne vous appartient pas"],
            })
          }
          adresseDepartId = validatedData.adresseDepart.id
        } else if (validatedData.adresseDepart.street && validatedData.adresseDepart.city) {
          // ✅ Créer avec userId de l'affréteur connecté
          const adresseDepart = await Address.create(
            {
              userId: user.id, // 🔑 Associer l'adresse à l'affréteur connecté
              street: validatedData.adresseDepart.street,
              city: validatedData.adresseDepart.city,
              region: validatedData.adresseDepart.region,
              country: validatedData.adresseDepart.country || 'Cameroun',
              postalCode: validatedData.adresseDepart.postalCode,
              latitude: validatedData.adresseDepart.latitude,
              longitude: validatedData.adresseDepart.longitude,
              label: validatedData.adresseDepart.label,
            },
            { client: trx }
          )
          adresseDepartId = adresseDepart.id
        }
      }

      // Gérer l'adresse d'arrivée
      if (validatedData.adresseArrivee) {
        if (validatedData.adresseArrivee.id) {
          // ✅ Vérifier que l'adresse existe ET appartient à l'affréteur connecté
          const existingAddress = await Address.query({ client: trx })
            .where('id', validatedData.adresseArrivee.id)
            .where('user_id', user.id)
            .first()

          if (!existingAddress) {
            await trx.rollback()
            return response.status(403).json({
              success: false,
              message: 'Arrival address not found or does not belong to you',
              errors: ["L'adresse d'arrivée n'existe pas ou ne vous appartient pas"],
            })
          }
          adresseArriveeId = validatedData.adresseArrivee.id
        } else if (validatedData.adresseArrivee.street && validatedData.adresseArrivee.city) {
          // ✅ Créer avec userId de l'affréteur connecté
          const adresseArrivee = await Address.create(
            {
              userId: user.id, // 🔑 Associer l'adresse à l'affréteur connecté
              street: validatedData.adresseArrivee.street,
              city: validatedData.adresseArrivee.city,
              region: validatedData.adresseArrivee.region,
              country: validatedData.adresseArrivee.country || 'Cameroun',
              postalCode: validatedData.adresseArrivee.postalCode,
              latitude: validatedData.adresseArrivee.latitude,
              longitude: validatedData.adresseArrivee.longitude,
              label: validatedData.adresseArrivee.label,
            },
            { client: trx }
          )
          adresseArriveeId = adresseArrivee.id
        }
      }

      // Validation métier : budgetMin <= budgetMax
      if (
        validatedData.budgetMin &&
        validatedData.budgetMax &&
        validatedData.budgetMin > validatedData.budgetMax
      ) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'Budget minimum cannot be greater than budget maximum',
          errors: ['Budget minimum doit être inférieur ou égal au budget maximum'],
        })
      }

      // Validation métier : dateDepart < dateArrivee
      if (validatedData.dateDepartEstime && validatedData.dateArriveePrevue) {
        const dateDepart = DateTime.fromJSDate(validatedData.dateDepartEstime)
        const dateArrivee = DateTime.fromJSDate(validatedData.dateArriveePrevue)

        if (dateDepart >= dateArrivee) {
          await trx.rollback()
          return response.status(422).json({
            success: false,
            message: 'Departure date must be before arrival date',
            errors: ["Date de départ doit être antérieure à la date d'arrivée"],
          })
        }
      }

      const mission = await Mission.create(
        {
          affreteurId: user.id,
          title: validatedData.title,
          description: validatedData.description,
          typeMarchandise: validatedData.typeMarchandise,
          poids: validatedData.poids,
          volume: validatedData.volume,
          dateDepartEstime: validatedData.dateDepartEstime
            ? DateTime.fromJSDate(validatedData.dateDepartEstime)
            : null,
          dateArriveePrevue: validatedData.dateArriveePrevue
            ? DateTime.fromJSDate(validatedData.dateArriveePrevue)
            : null,
          adresseDepartId,
          adresseArriveeId,
          budgetMin: validatedData.budgetMin,
          budgetMax: validatedData.budgetMax,
          status: MissionStatus.DRAFT,
        },
        { client: trx }
      )

      // 🔑 Initialiser les credentials de tracking (PIN et QR code) dès la création
      // Fait AVANT le commit pour être dans la transaction
      const trackingServiceModule = await import('#services/mission_tracking_service')
      const trackingService = trackingServiceModule.default

      // Générer les tokens directement dans la transaction
      if (!mission.trackingPin) {
        mission.trackingPin = await trackingService.generateUniqueTrackingPin()
      }
      if (!mission.qrCodeToken) {
        mission.qrCodeToken = trackingService.generateQrCodeToken()
      }
      // Sauvegarder dans la transaction en utilisant le client de transaction
      await mission.useTransaction(trx).save()

      await trx.commit()

      await mission.load('affreteur')
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')
      await mission.refresh()

      // 📍 Créer des MissionUpdates pour le tracking
      await MissionUpdate.createStatusUpdate(
        mission.id,
        null,
        null,
        MissionStatus.DRAFT,
        'Nouvelle mission créée'
      )

      return response.status(201).json({
        success: true,
        message: 'Mission created successfully',
        data: mission,
      })
    } catch (error) {
      await trx.rollback()

      // Debug: log détaillé de l'erreur
      console.error('❌ Mission creation error:', error)
      console.error('❌ Error stack:', error.stack)

      // Si c'est une erreur de validation, renvoyer les détails
      if (error.code === 'E_VALIDATION_ERROR' || error.messages) {
        return response.status(422).json({
          success: false,
          message: 'Validation failed',
          errors: error.messages || error.message,
        })
      }

      return response.status(500).json({
        success: false,
        message: 'Failed to create mission',
        error: error.message,
      })
    }
  }

  async show({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .preload('affreteur')
        .preload('adresseDepart')
        .preload('adresseArrivee')
        .preload('transporteur')
        .preload('feedback')
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      return response.json({
        success: true,
        message: 'Mission retrieved successfully',
        data: mission,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve mission',
        error: error.message,
      })
    }
  }

  async update({ params, request, auth, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.getUserOrFail()
      const validatedData = await request.validateUsing(updateMissionValidator)

      const mission = await Mission.query({ client: trx })
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      // Vérifier si la mission peut être modifiée (pas de propositions acceptées)
      if (mission.status === MissionStatus.ASSIGNED || mission.status === MissionStatus.COMPLETED) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'Cannot modify mission with assigned or completed status',
        })
      }

      // Gérer les adresses si fournies
      if (validatedData.adresseDepart) {
        if (validatedData.adresseDepart.id) {
          // ✅ Vérifier que l'adresse existe ET appartient à l'affréteur connecté
          const existingAddress = await Address.query({ client: trx })
            .where('id', validatedData.adresseDepart.id)
            .where('user_id', user.id)
            .first()

          if (!existingAddress) {
            await trx.rollback()
            return response.status(403).json({
              success: false,
              message: 'Departure address not found or does not belong to you',
              errors: ["L'adresse de départ n'existe pas ou ne vous appartient pas"],
            })
          }
          mission.adresseDepartId = validatedData.adresseDepart.id
        } else if (validatedData.adresseDepart.street && validatedData.adresseDepart.city) {
          // ✅ Créer avec userId de l'affréteur connecté
          const adresse = await Address.create(
            {
              userId: user.id, // 🔑 Associer l'adresse à l'affréteur connecté
              street: validatedData.adresseDepart.street,
              city: validatedData.adresseDepart.city,
              region: validatedData.adresseDepart.region,
              country: validatedData.adresseDepart.country || 'Cameroun',
              postalCode: validatedData.adresseDepart.postalCode,
              latitude: validatedData.adresseDepart.latitude,
              longitude: validatedData.adresseDepart.longitude,
              label: validatedData.adresseDepart.label,
            },
            { client: trx }
          )
          mission.adresseDepartId = adresse.id
        }
      }

      if (validatedData.adresseArrivee) {
        if (validatedData.adresseArrivee.id) {
          // ✅ Vérifier que l'adresse existe ET appartient à l'affréteur connecté
          const existingAddress = await Address.query({ client: trx })
            .where('id', validatedData.adresseArrivee.id)
            .where('user_id', user.id)
            .first()

          if (!existingAddress) {
            await trx.rollback()
            return response.status(403).json({
              success: false,
              message: 'Arrival address not found or does not belong to you',
              errors: ["L'adresse d'arrivée n'existe pas ou ne vous appartient pas"],
            })
          }
          mission.adresseArriveeId = validatedData.adresseArrivee.id
        } else if (validatedData.adresseArrivee.street && validatedData.adresseArrivee.city) {
          // ✅ Créer avec userId de l'affréteur connecté
          const adresse = await Address.create(
            {
              userId: user.id, // 🔑 Associer l'adresse à l'affréteur connecté
              street: validatedData.adresseArrivee.street,
              city: validatedData.adresseArrivee.city,
              region: validatedData.adresseArrivee.region,
              country: validatedData.adresseArrivee.country || 'Cameroun',
              postalCode: validatedData.adresseArrivee.postalCode,
              latitude: validatedData.adresseArrivee.latitude,
              longitude: validatedData.adresseArrivee.longitude,
              label: validatedData.adresseArrivee.label,
            },
            { client: trx }
          )
          mission.adresseArriveeId = adresse.id
        }
      }

      // Validation métier si budgets fournis
      const newBudgetMin = validatedData.budgetMin ?? mission.budgetMin
      const newBudgetMax = validatedData.budgetMax ?? mission.budgetMax
      if (newBudgetMin && newBudgetMax && newBudgetMin > newBudgetMax) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'Budget minimum cannot be greater than budget maximum',
        })
      }

      // Mise à jour des champs
      mission.merge({
        title: validatedData.title,
        description: validatedData.description,
        typeMarchandise: validatedData.typeMarchandise,
        poids: validatedData.poids,
        volume: validatedData.volume,
        dateDepartEstime: validatedData.dateDepartEstime
          ? DateTime.fromJSDate(validatedData.dateDepartEstime)
          : undefined,
        dateArriveePrevue: validatedData.dateArriveePrevue
          ? DateTime.fromJSDate(validatedData.dateArriveePrevue)
          : undefined,
        budgetMin: validatedData.budgetMin,
        budgetMax: validatedData.budgetMax,
        status: validatedData.status as MissionStatus,
      })

      await mission.save()
      await trx.commit()

      await mission.load('affreteur')
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')

      return response.json({
        success: true,
        message: 'Mission updated successfully',
        data: mission,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).json({
        success: false,
        message: 'Failed to update mission',
        error: error.message,
      })
    }
  }

  /*
   * @publish
   * @summary Publier une mission
   * @description Publie une mission DRAFT pour la rendre visible aux transporteurs
   * @paramPath id - ID de la mission - @required @type(string)
   * @responseBody 200 - Mission publiée avec succès
   * @responseBody 404 - Mission non trouvée
   * @responseBody 422 - Mission ne peut pas être publiée
   * @responseBody 500 - Erreur serveur
   */
  async publish({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      if (mission.status !== MissionStatus.DRAFT) {
        return response.status(422).json({
          success: false,
          message: 'Only draft missions can be published',
          currentStatus: mission.status,
        })
      }

      // Vérifications avant publication
      const missingFields = []
      if (!mission.title) missingFields.push('title')
      if (!mission.adresseDepartId) missingFields.push('adresse de départ')
      if (!mission.adresseArriveeId) missingFields.push("adresse d'arrivée")

      if (missingFields.length > 0) {
        return response.status(422).json({
          success: false,
          message: 'Mission cannot be published with missing required fields',
          missingFields,
        })
      }

      mission.status = MissionStatus.PUBLISHED
      await mission.save()

      await mission.load('affreteur')
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')

      // 📍 Créer des MissionUpdates pour le tracking
      await MissionUpdate.createStatusUpdate(
        mission.id,
        null,
        MissionStatus.DRAFT,
        MissionStatus.PUBLISHED,
        'Mission publiée'
      )

      // 🔔 Notifier tous les transporteurs de la nouvelle mission par EMAIL + SSE
      try {
        await this.missionNotificationService.notifyNewMissionToTransporteurs(mission)
        console.log(`✅ Notifications EMAIL + SSE envoyées pour la mission ${mission.id}`)
      } catch (notificationError) {
        console.error('❌ Erreur envoi notifications nouvelle mission:', notificationError)
        // Ne pas faire échouer la publication si les notifications échouent
      }

      return response.json({
        success: true,
        message: 'Mission published successfully and is now visible to transporters',
        data: mission,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to publish mission',
        error: error.message,
      })
    }
  }

  async unpublish({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      if (mission.status !== MissionStatus.PUBLISHED) {
        return response.status(422).json({
          success: false,
          message: 'Only published missions can be unpublished',
          currentStatus: mission.status,
        })
      }

      mission.status = MissionStatus.DRAFT
      await mission.save()

      await mission.load('affreteur')
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')

      // 📍 Créer des MissionUpdates pour le tracking
      await MissionUpdate.createStatusUpdate(
        mission.id,
        null,
        MissionStatus.PUBLISHED,
        MissionStatus.DRAFT,
        'Mission dépubliée'
      )

      return response.json({
        success: true,
        message: 'Mission unpublished successfully and is now hidden from transporters',
        data: mission,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to unpublish mission',
        error: error.message,
      })
    }
  }

  async destroy({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      // Vérifier si la mission peut être supprimée (draft ou published sans propositions)
      if (mission.status === MissionStatus.ASSIGNED || mission.status === MissionStatus.COMPLETED) {
        return response.status(422).json({
          success: false,
          message: 'Cannot delete mission with assigned or completed status',
        })
      }

      await mission.delete()

      return response.json({
        success: true,
        message: 'Mission deleted successfully',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to delete mission',
        error: error.message,
      })
    }
  }

  /**
   * Créer un feedback pour noter le transporteur après la mission
   */
  async createFeedback({ params, request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Importer le validateur et le modèle
      const { createFeedbackValidator } = await import('#validators/feedback_validator')
      const feedbackModule = await import('#models/feedback')
      const Feedback = feedbackModule.default

      const validatedData = await request.validateUsing(createFeedbackValidator)

      // Vérifier que la mission existe, appartient à cet affreteur et est COMPLETED
      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .where('status', MissionStatus.COMPLETED)
        .whereNotNull('transporteur_id')
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found, not completed, or no transporteur assigned',
        })
      }

      // Vérifier qu'aucun feedback n'existe déjà
      const existingFeedback = await Feedback.query().where('mission_id', mission.id).first()

      if (existingFeedback) {
        return response.status(422).json({
          success: false,
          message: 'Feedback already exists for this mission',
        })
      }

      // Créer le feedback
      const feedback = await Feedback.create({
        missionId: mission.id,
        affreteurId: user.id,
        transporteurId: mission.transporteurId!,
        rating: validatedData.rating,
        description: validatedData.description || null,
      })

      await feedback.load('transporteur')
      await feedback.load('mission')

      return response.status(201).json({
        success: true,
        message: 'Feedback created successfully',
        data: feedback,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to create feedback',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer le feedback d'une mission
   */
  async getFeedback({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const feedbackModule = await import('#models/feedback')
      const Feedback = feedbackModule.default

      // Vérifier que la mission appartient à cet affreteur
      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      const feedback = await Feedback.query()
        .where('mission_id', mission.id)
        .preload('transporteur')
        .first()

      if (!feedback) {
        return response.status(404).json({
          success: false,
          message: 'Feedback not found for this mission',
        })
      }

      return response.json({
        success: true,
        message: 'Feedback retrieved successfully',
        data: feedback,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve feedback',
        error: error.message,
      })
    }
  }

  /**
   * Générer ou récupérer le QR code de preuve de livraison
   */
  async getDeliveryQrCode({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const qrCodeServiceModule = await import('#services/qr_code_service')
      const qrCodeService = qrCodeServiceModule.default

      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      // Initialiser le tracking si pas déjà fait
      if (!mission.qrCodeToken) {
        const trackingServiceModule = await import('#services/mission_tracking_service')
        const trackingService = trackingServiceModule.default
        await trackingService.initializeTracking(mission)
        await mission.refresh()
      }

      const qrCodeDataUrl = await qrCodeService.generateDeliveryQrCode(mission)

      return response.json({
        success: true,
        message: 'QR code generated successfully',
        data: {
          qrCode: qrCodeDataUrl,
          mission: {
            id: mission.id,
            title: mission.title,
            status: mission.status,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to generate QR code',
        error: error.message,
      })
    }
  }

  /**
   * Régénérer le QR code (en cas de perte ou suspicion de fuite)
   */
  async regenerateQrCode({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const qrCodeServiceModule = await import('#services/qr_code_service')
      const qrCodeService = qrCodeServiceModule.default

      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      await qrCodeService.regenerateQrCodeToken(mission)
      await mission.refresh()

      const qrCodeDataUrl = await qrCodeService.generateDeliveryQrCode(mission)

      return response.json({
        success: true,
        message: 'QR code regenerated successfully',
        data: {
          qrCode: qrCodeDataUrl,
          mission: {
            id: mission.id,
            title: mission.title,
            status: mission.status,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to regenerate QR code',
        error: error.message,
      })
    }
  }

  /**
   * Marquer une mission comme payée
   */
  async markAsPaid({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      if (mission.status !== MissionStatus.DELIVERED) {
        return response.status(422).json({
          success: false,
          message: 'Mission must be delivered before marking as paid',
        })
      }

      mission.status = MissionStatus.PAID
      mission.paidAt = DateTime.now()
      await mission.save()

      // TODO: Envoyer notification au transporteur

      return response.json({
        success: true,
        message: 'Mission marked as paid successfully',
        data: { mission },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to mark mission as paid',
        error: error.message,
      })
    }
  }

  /**
   * Clôturer définitivement une mission
   */
  async completeMission({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      if (mission.status !== 'paid') {
        return response.status(422).json({
          success: false,
          message: 'Mission must be paid before final completion',
        })
      }

      mission.status = MissionStatus.COMPLETED
      await mission.save()

      // TODO: Archiver les données de tracking (optionnel)

      return response.json({
        success: true,
        message: 'Mission completed successfully',
        data: { mission },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to complete mission',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer les positions GPS d'une mission
   */
  async getLocationUpdates({ params, request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const trackingServiceModule = await import('#services/mission_tracking_service')
      const trackingService = trackingServiceModule.default

      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      const limit = request.input('limit', 50)
      const locations = await trackingService.getRecentLocations(mission.id, limit)

      return response.json({
        success: true,
        message: 'Location updates retrieved successfully',
        data: {
          mission: {
            id: mission.id,
            title: mission.title,
            status: mission.status,
          },
          locations,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve location updates',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer les problèmes signalés pour une mission
   */
  async getIssues({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const missionIssueModule = await import('#models/mission_issue')
      const MissionIssue = missionIssueModule.default

      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      const issues = await MissionIssue.query()
        .where('mission_id', mission.id)
        .preload('reportedBy')
        .orderBy('created_at', 'desc')

      return response.json({
        success: true,
        message: 'Issues retrieved successfully',
        data: { issues },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve issues',
        error: error.message,
      })
    }
  }

  /**
   * Marquer un problème comme reconnu
   */
  async acknowledgeIssue({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const missionIssueModule = await import('#models/mission_issue')
      const MissionIssue = missionIssueModule.default
      const { IssueStatus } = missionIssueModule

      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      const issue = await MissionIssue.query()
        .where('id', params.issueId)
        .where('mission_id', mission.id)
        .first()

      if (!issue) {
        return response.status(404).json({
          success: false,
          message: 'Issue not found',
        })
      }

      issue.status = IssueStatus.ACKNOWLEDGED
      await issue.save()

      return response.json({
        success: true,
        message: 'Issue acknowledged successfully',
        data: { issue },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to acknowledge issue',
        error: error.message,
      })
    }
  }

  /**
   * Marquer un problème comme résolu
   */
  async resolveIssue({ params, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const missionIssueModule = await import('#models/mission_issue')
      const MissionIssue = missionIssueModule.default
      const { IssueStatus } = missionIssueModule

      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      const issue = await MissionIssue.query()
        .where('id', params.issueId)
        .where('mission_id', mission.id)
        .first()

      if (!issue) {
        return response.status(404).json({
          success: false,
          message: 'Issue not found',
        })
      }

      issue.status = IssueStatus.RESOLVED
      issue.resolvedAt = DateTime.now()
      await issue.save()

      return response.json({
        success: true,
        message: 'Issue resolved successfully',
        data: { issue },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to resolve issue',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer l'historique complet d'une mission
   */
  async getHistory({ params, request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier que la mission appartient à cet affreteur
      const mission = await Mission.query()
        .where('id', params.id)
        .where('affreteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found or not owned by you',
        })
      }

      // Paramètres de requête optionnels
      const page = request.input('page', 1)
      const limit = request.input('limit', 50)
      const type = request.input('type') // Filtrer par type d'événement

      // Construire la requête
      const query = MissionUpdate.query()
        .where('mission_id', mission.id)
        .preload('transporteur', (transporteurQuery) => {
          transporteurQuery.select('id', 'firstName', 'lastName', 'email', 'phone')
        })
        .orderBy('created_at', 'desc')

      // Filtrer par type si spécifié
      if (type) {
        query.where('type', type)
      }

      // Pagination
      const updates = await query.paginate(page, limit)

      return response.json({
        success: true,
        message: 'Mission history retrieved successfully',
        data: {
          mission: {
            id: mission.id,
            title: mission.title,
            status: mission.status,
          },
          updates: updates.serialize(),
          pagination: {
            current_page: updates.currentPage,
            per_page: updates.perPage,
            total: updates.total,
            last_page: updates.lastPage,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve mission history',
        error: error.message,
      })
    }
  }

  /**
   * Get all active GPS locations for missions created by this affreteur
   * GET /api/affreteur/missions/active-locations
   */
  async getActiveLocations({ response, auth, logger }: HttpContext) {
    logger.info('🟢 DEBUT getActiveLocations (Affreteur)')

    try {
      const user = auth.getUserOrFail()

      logger.info('📍 Récupération des positions actives pour affreteur', {
        affreteurId: user.id,
      })

      // Import LocationUpdate dynamically
      const { default: LocationUpdate } = await import('#models/location_update')

      // Get all missions created by this affreteur (actives + terminées pour historique)
      const missions = await Mission.query()
        .where('affreteur_id', user.id)
        .whereIn('status', [
          MissionStatus.IN_PROGRESS,
          MissionStatus.ASSIGNED,
          MissionStatus.READY_TO_START,
          MissionStatus.DELIVERED,
          MissionStatus.PAID,
          MissionStatus.COMPLETED,
        ])
        .preload('affreteur', (query) => {
          query.select('id', 'firstName', 'lastName')
        })
        .preload('adresseDepart')
        .preload('adresseArrivee')
        .preload('transporteur', (query) => {
          query.select('id', 'firstName', 'lastName')
        })

      logger.info(`✅ ${missions.length} missions trouvées pour l'affreteur`, {
        missionIds: missions.map((m) => m.id),
      })

      // For each mission, get the latest location update
      const locationsPromises = missions.map(async (mission) => {
        const missionId = mission.id
        logger.info(`🔍 Traitement de la mission ${missionId} (${mission.status})`)

        try {
          const latestLocation = await LocationUpdate.query()
            .where('mission_id', missionId)
            .orderBy('timestamp', 'desc')
            .first()

          if (!latestLocation) {
            logger.info(`ℹ️ Aucune position trouvée pour la mission ${missionId}`)
            return null
          }

          logger.info(`📡 Position trouvée pour la mission ${missionId}`, {
            locationId: latestLocation.id,
            timestamp: latestLocation.timestamp?.toISO(),
          })

          // Check if position is recent (last 5 minutes)
          const fiveMinutesAgo = DateTime.now().minus({ minutes: 5 })
          const locationDate = latestLocation.timestamp

          if (!locationDate) {
            logger.warn(`⚠️ La position ${latestLocation.id} n'a pas de date`)
            return null
          }

          if (locationDate < fiveMinutesAgo) {
            logger.info(
              `⏱️ Position trop ancienne pour la mission ${missionId} (${locationDate.toISO()})`
            )
            return null
          }

          return {
            missionId: mission.id,
            missionTitle: mission.title,
            missionStatus: mission.status,
            location: {
              latitude: latestLocation.latitude,
              longitude: latestLocation.longitude,
              speed: latestLocation.speed,
              heading: latestLocation.heading,
              accuracy: latestLocation.accuracy,
              timestamp: locationDate.toISO(),
            },
            driver: mission.transporteur
              ? {
                  id: mission.transporteur.id,
                  name: `${mission.transporteur.firstName} ${mission.transporteur.lastName}`,
                }
              : null,
            departure: mission.adresseDepart
              ? {
                  latitude: mission.adresseDepart.latitude,
                  longitude: mission.adresseDepart.longitude,
                  address: mission.adresseDepart.street,
                }
              : null,
            arrival: mission.adresseArrivee
              ? {
                  latitude: mission.adresseArrivee.latitude,
                  longitude: mission.adresseArrivee.longitude,
                  address: mission.adresseArrivee.street,
                }
              : null,
          }
        } catch (error) {
          logger.error(`❌ Erreur lors du traitement de la mission ${missionId}:`, {
            error: error.message,
            stack: error.stack,
          })
          return null
        }
      })

      const locationsResults = await Promise.all(locationsPromises)
      const locations = locationsResults.filter(Boolean)

      logger.info(`✅ ${locations.length} positions actives trouvées pour l'affreteur`)

      return response.ok({
        success: true,
        data: { locations },
      })
    } catch (error) {
      logger.error('❌ ERREUR CRITIQUE dans getActiveLocations (Affreteur)', {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
      })

      return response.internalServerError({
        success: false,
        message: 'Une erreur est survenue lors de la récupération des positions actives',
        error:
          process.env.NODE_ENV === 'development'
            ? {
                message: error.message,
                name: error.name,
                stack: error.stack,
              }
            : undefined,
      })
    } finally {
      logger.info('🔴 FIN getActiveLocations (Affreteur)')
    }
  }
}
