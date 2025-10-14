import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import Mission, { MissionStatus } from '#models/mission'
import User, { UserRole } from '#models/user'
import Address from '#models/address'
import {
  createMissionValidator,
  missionQueryValidator,
  updateStatusValidator,
} from '#validators/mission_validator'
import db from '@adonisjs/lucid/services/db'
import MissionNotificationService from '#services/mission_notification_service'

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

  async updateStatus({ params, request, response }: HttpContext) {
    const trx = await db.transaction()

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

      // Si on assigne un transporteur
      if (validatedData.transporteurId) {
        const transporteur = await User.query({ client: trx })
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
      mission.status = validatedData.status as MissionStatus

      await mission.save()
      await trx.commit()

      await mission.load('affreteur')
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')

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
