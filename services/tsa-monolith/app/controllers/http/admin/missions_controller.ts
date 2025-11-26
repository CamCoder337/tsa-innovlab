import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import Mission, { MissionStatus } from '#models/mission'
import Vehicle, { VehicleStatus } from '#models/vehicle'
import User, { UserRole } from '#models/user'
import Address from '#models/address'
import {
  createMissionValidator,
  missionQueryValidator,
  updateMissionValidator,
  updateStatusValidator,
} from '#validators/mission_validator'
import db from '@adonisjs/lucid/services/db'
import MissionNotificationService from '#services/mission_notification_service'
import MissionUpdate from '#models/mission_update'

@inject()
export default class MissionsController {
  constructor(private missionNotificationService: MissionNotificationService) {}

  async index({ request, response }: HttpContext) {
    try {
      const validatedData = await request.validateUsing(missionQueryValidator)

      const {
        page = 1,
        limit = 15,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
        city,
        budgetMin,
        budgetMax,
        typeMarchandise,
      } = validatedData

      const query = Mission.query()
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'phone')
        })
        .preload('transporteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'phone')
        })
        .preload('adresseDepart')
        .preload('adresseArrivee')

      // Filtres admin spécialisés
      if (status) {
        query.where('status', status)
      }

      if (search) {
        query.where((builder) => {
          builder
            .whereILike('title', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
            .orWhereILike('type_marchandise', `%${search}%`)
            .orWhereHas('affreteur', (affreteurQuery) => {
              affreteurQuery
                .whereILike('first_name', `%${search}%`)
                .orWhereILike('last_name', `%${search}%`)
                .orWhereILike('email', `%${search}%`)
            })
        })
      }

      if (city) {
        query.where((builder) => {
          builder
            .whereHas('adresseDepart', (addrQuery) => {
              addrQuery.whereILike('city', `%${city}%`)
            })
            .orWhereHas('adresseArrivee', (addrQuery) => {
              addrQuery.whereILike('city', `%${city}%`)
            })
        })
      }

      if (budgetMin) {
        query.where('budget_min', '>=', budgetMin)
      }

      if (budgetMax) {
        query.where('budget_max', '<=', budgetMax)
      }

      if (typeMarchandise) {
        query.whereILike('type_marchandise', `%${typeMarchandise}%`)
      }

      query.orderBy(sortBy === 'created_at' ? 'created_at' : sortBy, sortOrder)

      const missions = await query.paginate(page, limit)

      return response.json({
        success: true,
        message: 'All missions retrieved successfully',
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

  async show({ params, response }: HttpContext) {
    try {
      const mission = await Mission.query()
        .where('id', params.id)
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'phone')
        })
        .preload('transporteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'email', 'phone')
        })
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

  async store({ request, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const validatedData = await request.validateUsing(createMissionValidator)

      // Vérifier que l'affreteur existe (obligatoire pour admin)
      if (!validatedData.affreteurId) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'Affreteur ID is required for admin mission creation',
          errors: ["affreteurId est requis pour créer une mission en tant qu'admin"],
        })
      }

      const affreteur = await User.query({ client: trx })
        .where('id', validatedData.affreteurId)
        .where('role', UserRole.AFFRETEUR)
        .first()

      if (!affreteur) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Affreteur not found or invalid role',
        })
      }

      let adresseDepartId: string | null = null
      let adresseArriveeId: string | null = null

      // Gérer l'adresse de départ
      if (validatedData.adresseDepart) {
        if (validatedData.adresseDepart.id) {
          // ✅ Vérifier que l'adresse existe ET appartient à l'affréteur ciblé
          const existingAddress = await Address.query({ client: trx })
            .where('id', validatedData.adresseDepart.id)
            .where('user_id', validatedData.affreteurId)
            .first()

          if (!existingAddress) {
            await trx.rollback()
            return response.status(403).json({
              success: false,
              message: 'Departure address not found or does not belong to this affreteur',
              errors: ["L'adresse de départ n'existe pas ou n'appartient pas à cet affréteur"],
            })
          }
          adresseDepartId = validatedData.adresseDepart.id
        } else if (validatedData.adresseDepart.street && validatedData.adresseDepart.city) {
          // ✅ Créer avec userId de l'affréteur ciblé
          const adresseDepart = await Address.create(
            {
              userId: validatedData.affreteurId, // 🔑 Associer à l'affréteur ciblé
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
          // ✅ Vérifier que l'adresse existe ET appartient à l'affréteur ciblé
          const existingAddress = await Address.query({ client: trx })
            .where('id', validatedData.adresseArrivee.id)
            .where('user_id', validatedData.affreteurId)
            .first()

          if (!existingAddress) {
            await trx.rollback()
            return response.status(403).json({
              success: false,
              message: 'Arrival address not found or does not belong to this affreteur',
              errors: ["L'adresse d'arrivée n'existe pas ou n'appartient pas à cet affréteur"],
            })
          }
          adresseArriveeId = validatedData.adresseArrivee.id
        } else if (validatedData.adresseArrivee.street && validatedData.adresseArrivee.city) {
          // ✅ Créer avec userId de l'affréteur ciblé
          const adresseArrivee = await Address.create(
            {
              userId: validatedData.affreteurId, // 🔑 Associer à l'affréteur ciblé
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

      // Validation métier
      if (
        validatedData.budgetMin &&
        validatedData.budgetMax &&
        validatedData.budgetMin > validatedData.budgetMax
      ) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'Budget minimum cannot be greater than budget maximum',
        })
      }

      if (validatedData.dateDepartEstime && validatedData.dateArriveePrevue) {
        const dateDepart = DateTime.fromJSDate(validatedData.dateDepartEstime)
        const dateArrivee = DateTime.fromJSDate(validatedData.dateArriveePrevue)

        if (dateDepart >= dateArrivee) {
          await trx.rollback()
          return response.status(422).json({
            success: false,
            message: 'Departure date must be before arrival date',
          })
        }
      }

      const mission = await Mission.create(
        {
          affreteurId: validatedData.affreteurId,
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

      // 📍 Créer des MissionUpdates pour le tracking
      await MissionUpdate.createStatusUpdate(
        mission.id,
        '',
        null,
        MissionStatus.DRAFT,
        'Nouvelle mission créé'
      )

      return response.status(201).json({
        success: true,
        message: 'Mission created successfully for affreteur',
        data: mission,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).json({
        success: false,
        message: 'Failed to create mission',
        error: error.message,
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const validatedData = await request.validateUsing(updateMissionValidator)

      const mission = await Mission.query({ client: trx }).where('id', params.id).first()

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
            .where('user_id', mission.affreteurId)
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
              userId: mission.affreteurId, // 🔑 Associer l'adresse à l'affréteur connecté
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
            .where('user_id', mission.affreteurId)
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
              userId: mission.affreteurId, // 🔑 Associer l'adresse à l'affréteur connecté
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

  async publish({ params, response }: HttpContext) {
    try {
      const mission = await Mission.query().where('id', params.id).first()

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

  async unpublish({ params, response }: HttpContext) {
    try {
      const mission = await Mission.query().where('id', params.id).first()

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

  async destroy({ params, response }: HttpContext) {
    try {
      const mission = await Mission.query().where('id', params.id).first()

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

  async updateStatus({ params, request, response }: HttpContext) {
    const trx = await db.transaction()
    let transporteur

    try {
      const validatedData = await request.validateUsing(updateStatusValidator)

      const mission = await Mission.query({ client: trx }).where('id', params.id).first()

      if (!mission) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
        })
      }

      // Vérifier les transitions de statut autorisées pour les transporteurs
      const allowedTransitions: Record<MissionStatus, MissionStatus[]> = {
        [MissionStatus.ASSIGNED]: [
          MissionStatus.IN_PROGRESS,
          MissionStatus.COMPLETED,
          MissionStatus.CANCELLED,
        ],
        [MissionStatus.IN_PROGRESS]: [MissionStatus.COMPLETED, MissionStatus.CANCELLED],
      } as Record<MissionStatus, MissionStatus[]>

      const currentAllowedStatuses = allowedTransitions[mission.status] || []

      if (!currentAllowedStatuses.includes(validatedData.status as MissionStatus)) {
        return response.status(422).json({
          success: false,
          message: `Cannot transition from ${mission.status} to ${validatedData.status}`,
          allowedStatuses: currentAllowedStatuses,
        })
      }

      // Si on assigne un transporteur
      if (validatedData.transporteurId) {
        transporteur = await User.query({ client: trx })
          .where('id', validatedData.transporteurId)
          .where('role', UserRole.TRANSPORTEUR)
          .first()

        if (!transporteur) {
          await trx.rollback()
          return response.status(404).json({
            success: false,
            message: 'Transporteur not found or invalid role',
          })
        }

        mission.transporteurId = validatedData.transporteurId
      }

      const oldStatus = mission.status
      let newStatus = validatedData.status as MissionStatus

      const isTransporteurCancellation = newStatus === MissionStatus.CANCELLED
      if (isTransporteurCancellation) {
        newStatus = MissionStatus.PUBLISHED
        console.log(
          `🔄 Transporteur ${transporteur?.fullName} annule mission ${mission.id} → PUBLISHED`
        )
      }

      // Sauvegarder les IDs avant désassignation
      const previousTransporteurId = mission.transporteurId
      const previousVehicleId = mission.vehicleId

      // Utiliser une transaction pour garantir la cohérence
      await db.transaction(async () => {
        // Mettre à jour le statut de la mission
        mission.status = newStatus

        // 🧹 Si annulation transporteur, nettoyer l'assignation
        if (isTransporteurCancellation) {
          mission.transporteurId = null
          mission.vehicleId = null
        }

        await mission.useTransaction(trx).save()

        // 🚗 Libérer le véhicule si la mission est terminée ou annulée
        if (
          previousVehicleId &&
          (newStatus === MissionStatus.COMPLETED || isTransporteurCancellation)
        ) {
          const vehicle = await Vehicle.query({ client: trx })
            .where('id', previousVehicleId)
            .first()

          if (vehicle && vehicle.status === VehicleStatus.IN_MISSION) {
            vehicle.status = VehicleStatus.AVAILABLE
            await vehicle.save()
            console.log(
              `✅ Véhicule ${vehicle.registration} libéré après ${isTransporteurCancellation ? 'annulation' : newStatus} de mission ${mission.id}`
            )
          }
        }
      })

      await mission.load('affreteur')
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')
      await mission.refresh() // Recharger pour avoir le véhicule mis à jour
      await mission.load('vehicle')

      // 📍 Créer des MissionUpdates pour le tracking
      try {
        if (isTransporteurCancellation) {
          // Événement 1 : Annulation par transporteur
          await MissionUpdate.createStatusUpdate(
            mission.id,
            previousTransporteurId!,
            oldStatus,
            'cancelled' as MissionStatus,
            `Mission annulée par le transporteur ${transporteur?.fullName}. ${validatedData.commentaire || 'Aucune raison fournie'}`
          )

          // Événement 2 : Republication automatique
          await MissionUpdate.createStatusUpdate(
            mission.id,
            previousTransporteurId!,
            'cancelled' as MissionStatus,
            newStatus,
            "Mission automatiquement republiée et disponible pour d'autres transporteurs"
          )
        } else {
          // Mise à jour normale
          await MissionUpdate.createStatusUpdate(
            mission.id,
            previousTransporteurId!,
            oldStatus,
            newStatus,
            validatedData.commentaire || 'Mise à jour de statut par le transporteur'
          )
        }
      } catch (updateError) {
        console.error('❌ Erreur création MissionUpdate:', updateError)
      }

      // Notification si mission assignée à un transporteur
      if (
        validatedData.status === MissionStatus.ASSIGNED &&
        mission.transporteurId &&
        oldStatus !== MissionStatus.ASSIGNED
      ) {
        console.log(
          `✅ Envoi notification d'assignation pour mission ${mission.id} → transporteur ${mission.transporteurId}`
        )
        await this.missionNotificationService.notifyMissionAssigned(mission, mission.transporteurId)
      }

      // Notification de changement de statut (pour affreteur et transporteur)
      if (oldStatus !== mission.status) {
        console.log(
          `✅ Envoi notification changement statut pour mission ${mission.id}: ${oldStatus} → ${mission.status}`
        )
        await this.missionNotificationService.notifyMissionStatusChanged(
          mission,
          oldStatus,
          mission.status
        )
      }

      return response.json({
        success: true,
        message: `Mission status updated from ${oldStatus} to ${validatedData.status}`,
        data: {
          mission,
          oldStatus,
          newStatus: validatedData.status,
          comment: validatedData.commentaire || null,
        },
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).json({
        success: false,
        message: 'Failed to update mission status',
        error: error.message,
      })
    }
  }

  async getFeedback({ params, response }: HttpContext) {
    try {
      const feedbackModule = await import('#models/feedback')
      const Feedback = feedbackModule.default

      // Vérifier que la mission appartient à cet affreteur
      const mission = await Mission.query().where('id', params.id).first()

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

  async getHistory({ params, request, response }: HttpContext) {
    try {
      const mission = await Mission.query().where('id', params.id).first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found',
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

  async stats({ response }: HttpContext) {
    try {
      const stats = await db.from('missions').select('status').count('* as total').groupBy('status')

      const totalMissions = await Mission.query().count('* as total')
      const totalAffreteurs = await User.query()
        .where('role', UserRole.AFFRETEUR)
        .count('* as total')
      const totalTransporteurs = await User.query()
        .where('role', UserRole.TRANSPORTEUR)
        .count('* as total')

      const statusStats = stats.reduce(
        (acc, item) => {
          acc[item.status] = Number.parseInt(item.total)
          return acc
        },
        {} as Record<string, number>
      )

      const recentMissions = await Mission.query()
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName')
        })
        .orderBy('created_at', 'desc')
        .limit(5)

      return response.json({
        success: true,
        message: 'Mission statistics retrieved successfully',
        data: {
          totals: {
            missions: Number.parseInt(totalMissions[0].$extras.total),
            affreteurs: Number.parseInt(totalAffreteurs[0].$extras.total),
            transporteurs: Number.parseInt(totalTransporteurs[0].$extras.total),
          },
          statusStats,
          recentMissions: recentMissions.map((mission) => ({
            id: mission.id,
            title: mission.title,
            status: mission.status,
            affreteur: mission.affreteur
              ? `${mission.affreteur.firstName} ${mission.affreteur.lastName}`
              : null,
            createdAt: mission.createdAt,
          })),
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve mission statistics',
        error: error.message,
      })
    }
  }
}
