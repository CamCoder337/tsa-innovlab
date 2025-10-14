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
          adresseDepartId = validatedData.adresseDepart.id
        } else if (validatedData.adresseDepart.street && validatedData.adresseDepart.city) {
          const adresseDepart = await Address.create(
            {
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
          adresseArriveeId = validatedData.adresseArrivee.id
        } else if (validatedData.adresseArrivee.street && validatedData.adresseArrivee.city) {
          const adresseArrivee = await Address.create(
            {
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

      await trx.commit()

      await mission.load('affreteur')
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')

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
          mission.adresseDepartId = validatedData.adresseDepart.id
        } else if (validatedData.adresseDepart.street && validatedData.adresseDepart.city) {
          const adresse = await Address.create(
            {
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
          mission.adresseArriveeId = validatedData.adresseArrivee.id
        } else if (validatedData.adresseArrivee.street && validatedData.adresseArrivee.city) {
          const adresse = await Address.create(
            {
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
}
