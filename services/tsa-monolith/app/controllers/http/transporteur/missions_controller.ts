import type { HttpContext } from '@adonisjs/core/http'
import Mission, { MissionStatus } from '#models/mission'
import { missionQueryValidator, updateStatusValidator } from '#validators/mission_validator'

export default class MissionsController {
  async available({ request, response }: HttpContext) {
    try {
      const validatedData = await request.validateUsing(missionQueryValidator)

      const {
        page = 1,
        limit = 15,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
        city,
        budgetMin,
        budgetMax,
        typeMarchandise,
      } = validatedData

      const query = Mission.query()
        .where('status', MissionStatus.PUBLISHED)
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'phone')
        })
        .preload('adresseDepart')
        .preload('adresseArrivee')

      if (search) {
        query.where((builder) => {
          builder
            .whereILike('titre', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
            .orWhereILike('type_marchandise', `%${search}%`)
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
        query.where((builder) => {
          builder.where('budget_min', '>=', budgetMin).orWhereNull('budget_min')
        })
      }

      if (budgetMax) {
        query.where((builder) => {
          builder.where('budget_max', '<=', budgetMax).orWhereNull('budget_max')
        })
      }

      if (typeMarchandise) {
        query.whereILike('type_marchandise', `%${typeMarchandise}%`)
      }

      query.orderBy(sortBy === 'created_at' ? 'created_at' : sortBy, sortOrder)

      const missions = await query.paginate(page, limit)

      return response.json({
        success: true,
        message: 'Available missions retrieved successfully',
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
        message: 'Failed to retrieve available missions',
        error: error.message,
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const mission = await Mission.query()
        .where('id', params.id)
        .where('status', MissionStatus.PUBLISHED)
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'phone', 'email')
        })
        .preload('adresseDepart')
        .preload('adresseArrivee')
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found or not available',
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

  async myMissions({ request, response }: HttpContext) {
    try {
      const validatedData = await request.validateUsing(missionQueryValidator)

      const {
        page = 1,
        limit = 15,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = validatedData

      // Pour l'instant, on liste les missions assignées (quand le système de propositions sera implémenté)
      // Temporairement, on filtre par les missions où le transporteur pourrait être assigné
      const query = Mission.query()
        .whereIn('status', [MissionStatus.ASSIGNED, MissionStatus.COMPLETED])
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'phone')
        })
        .preload('adresseDepart')
        .preload('adresseArrivee')

      if (status) {
        query.where('status', status)
      }

      if (search) {
        query.where((builder) => {
          builder
            .whereILike('titre', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
            .orWhereILike('type_marchandise', `%${search}%`)
        })
      }

      query.orderBy(sortBy === 'created_at' ? 'created_at' : sortBy, sortOrder)

      const missions = await query.paginate(page, limit)

      return response.json({
        success: true,
        message: 'My missions retrieved successfully',
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
        message: 'Failed to retrieve my missions',
        error: error.message,
      })
    }
  }

  async updateStatus({ params, request, response }: HttpContext) {
    try {
      const validatedData = await request.validateUsing(updateStatusValidator)

      const mission = await Mission.query()
        .where('id', params.id)
        .where('status', MissionStatus.ASSIGNED)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found or not assigned to you',
        })
      }

      // Vérifier les transitions de statut autorisées pour les transporteurs
      const allowedTransitions: Record<MissionStatus, MissionStatus[]> = {
        [MissionStatus.ASSIGNED]: [MissionStatus.COMPLETED, MissionStatus.CANCELLED],
      } as Record<MissionStatus, MissionStatus[]>

      const currentAllowedStatuses = allowedTransitions[mission.status] || []

      if (!currentAllowedStatuses.includes(validatedData.status as MissionStatus)) {
        return response.status(422).json({
          success: false,
          message: `Cannot transition from ${mission.status} to ${validatedData.status}`,
          allowedStatuses: currentAllowedStatuses,
        })
      }

      const oldStatus = mission.status
      mission.status = validatedData.status as MissionStatus

      await mission.save()

      await mission.load('affreteur')
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')

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
      return response.status(500).json({
        success: false,
        message: 'Failed to update mission status',
        error: error.message,
      })
    }
  }

  async updateLocation({ params, request, response }: HttpContext) {
    try {
      const { latitude, longitude, timestamp } = request.only([
        'latitude',
        'longitude',
        'timestamp',
      ])

      if (!latitude || !longitude) {
        return response.status(422).json({
          success: false,
          message: 'Latitude and longitude are required',
          errors: ['latitude et longitude sont requis'],
        })
      }

      const mission = await Mission.query()
        .where('id', params.id)
        .where('status', MissionStatus.ASSIGNED)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found or not assigned to you',
        })
      }

      // TODO: Implémenter le système de suivi de localisation en temps réel
      // Pour l'instant, on confirme la réception des coordonnées

      return response.json({
        success: true,
        message: 'Location updated successfully',
        data: {
          missionId: mission.id,
          location: {
            latitude: Number.parseFloat(latitude),
            longitude: Number.parseFloat(longitude),
            timestamp: timestamp || new Date().toISOString(),
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to update location',
        error: error.message,
      })
    }
  }

  async uploadProof({ params, request, response }: HttpContext) {
    try {
      const { proofType, description, imageUrl } = request.only([
        'proofType',
        'description',
        'imageUrl',
      ])

      if (!proofType) {
        return response.status(422).json({
          success: false,
          message: 'Proof type is required',
          errors: ['Type de preuve requis'],
        })
      }

      const mission = await Mission.query()
        .where('id', params.id)
        .where('status', MissionStatus.ASSIGNED)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found or not assigned to you',
        })
      }

      // TODO: Implémenter le système de preuves de livraison (photos, signatures)
      // Pour l'instant, on confirme la réception de la preuve

      return response.json({
        success: true,
        message: 'Delivery proof uploaded successfully',
        data: {
          missionId: mission.id,
          proof: {
            type: proofType,
            description: description || null,
            imageUrl: imageUrl || null,
            timestamp: new Date().toISOString(),
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to upload delivery proof',
        error: error.message,
      })
    }
  }
}
