import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import Database from '@adonisjs/lucid/services/db'
import LocationUpdate from '#models/location_update'
import Mission, { MissionStatus } from '#models/mission'
import Vehicle, { VehicleStatus } from '#models/vehicle'
import MissionUpdate from '#models/mission_update'
import {
  missionQueryValidator,
  updateStatusValidator,
  deliveryProofValidator,
  locationUpdateValidator,
} from '#validators/mission_validator'
import { claimMissionValidator } from '#validators/vehicle_validator'
import NotificationManagerService from '#services/notification_manager_service'

@inject()
export default class MissionsController {
  constructor(private notificationManager: NotificationManagerService) {}

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
        // Exclure les missions déjà réclamées par un transporteur
        .whereNull('transporteur_id')
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'phone')
        })
        .preload('adresseDepart')
        .preload('adresseArrivee')

      if (search) {
        query.where((builder) => {
          builder
            .whereILike('title', `%${search}%`)
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

  async myMissions({ request, auth, response }: HttpContext) {
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

      // Récupérer les missions assignées à ce transporteur
      const query = Mission.query()
        .whereIn('status', [
          MissionStatus.ASSIGNED,
          MissionStatus.READY_TO_START,
          MissionStatus.IN_PROGRESS,
          MissionStatus.DELIVERED,
          MissionStatus.PAID,
          MissionStatus.COMPLETED,
        ])
        .where('transporteur_id', user.id)
        .preload('affreteur', (userQuery) => {
          userQuery.select('id', 'firstName', 'lastName', 'phone')
        })
        .preload('adresseDepart')
        .preload('adresseArrivee')
        .preload('vehicle') // ✅ Charger le véhicule assigné
        .preload('feedback')

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

  async updateStatus({ params, request, auth, response }: HttpContext) {
    try {
      const validatedData = await request.validateUsing(updateStatusValidator)

      const mission = await Mission.query()
        .where('id', params.id)
        .whereIn('status', [MissionStatus.ASSIGNED, MissionStatus.IN_PROGRESS])
        .preload('vehicle')
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found or not assigned to you',
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

      const user = auth.getUserOrFail()
      const oldStatus = mission.status
      const requestedStatus = validatedData.status as MissionStatus
      let newStatus = requestedStatus

      // 🔄 LOGIQUE INTELLIGENTE : Annulation transporteur = Republication automatique
      const isTransporteurCancellation = requestedStatus === MissionStatus.CANCELLED
      if (isTransporteurCancellation) {
        newStatus = MissionStatus.PUBLISHED
        console.log(`🔄 Transporteur ${user.fullName} annule mission ${mission.id} → PUBLISHED`)
      }

      // Sauvegarder les IDs avant désassignation
      const previousTransporteurId = mission.transporteurId
      const previousVehicleId = mission.vehicleId

      // Utiliser une transaction pour garantir la cohérence
      await Database.transaction(async (trx) => {
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
            user.id,
            oldStatus,
            'cancelled' as MissionStatus,
            `Mission annulée par le transporteur ${user.fullName}. ${validatedData.commentaire || 'Aucune raison fournie'}`
          )

          // Événement 2 : Republication automatique
          await MissionUpdate.createStatusUpdate(
            mission.id,
            user.id,
            'cancelled' as MissionStatus,
            newStatus,
            "Mission automatiquement republiée et disponible pour d'autres transporteurs"
          )
        } else {
          // Mise à jour normale
          await MissionUpdate.createStatusUpdate(
            mission.id,
            user.id,
            oldStatus,
            newStatus,
            validatedData.commentaire || 'Mise à jour de statut par le transporteur'
          )
        }
      } catch (updateError) {
        console.error('❌ Erreur création MissionUpdate:', updateError)
      }

      // 🔔 Notifier l'affreteur du changement de statut
      try {
        if (isTransporteurCancellation) {
          // Notification spéciale pour annulation + republication
          await this.notificationManager.notifyMissionCancelledByTransporteur(
            mission,
            user,
            previousTransporteurId!,
            validatedData.commentaire || 'Aucune raison fournie'
          )
          console.log(`✅ Affreteur notifié de l'annulation par ${user.fullName}`)
        } else {
          // Notification normale changement statut
          await this.notificationManager.notifyMissionStatusChanged(
            mission,
            oldStatus,
            newStatus,
            user
          )
          console.log(`✅ Affreteur notifié du changement de statut mission ${mission.id}`)
        }
      } catch (notificationError) {
        console.error('❌ Erreur notification changement statut:', notificationError)
        // Ne pas faire échouer la mise à jour si les notifications échouent
      }

      return response.json({
        success: true,
        message: isTransporteurCancellation
          ? `Mission cancelled and republished. Now available for other transporters.`
          : `Mission status updated from ${oldStatus} to ${newStatus}`,
        data: {
          mission,
          oldStatus,
          newStatus,
          republished: isTransporteurCancellation,
          comment: validatedData.commentaire || null,
          vehicleReleased:
            previousVehicleId &&
            (newStatus === MissionStatus.COMPLETED || isTransporteurCancellation),
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

  async updateLocation({ params, request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const validatedData = await request.validateUsing(locationUpdateValidator)

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

      // 📍 Créer un MissionUpdate avec la nouvelle position
      try {
        await MissionUpdate.createLocationUpdate(
          mission.id,
          user.id,
          validatedData.latitude,
          validatedData.longitude,
          undefined // No address field in validator
        )
      } catch (updateError) {
        console.error('❌ Erreur création MissionUpdate localisation:', updateError)
      }

      // 🔔 Diffuser la mise à jour de position en temps réel
      try {
        // Import WebSocket service for broadcasting
        const { default: WebSocketService } = await import('#services/websocket_service')
        const websocketService = WebSocketService.getInstance()

        await websocketService.broadcastToMission(mission.id, {
          type: 'location_update',
          data: {
            location: {
              latitude: validatedData.latitude,
              longitude: validatedData.longitude,
              timestamp: new Date().toISOString(),
            },
            transporteur: user.fullName,
            missionId: mission.id,
          },
        })
        console.log(`✅ Position mise à jour en temps réel pour mission ${mission.id}`)
      } catch (broadcastError) {
        console.error('❌ Erreur diffusion position temps réel:', broadcastError)
      }

      return response.json({
        success: true,
        message: 'Location updated successfully and broadcasted in real-time',
        data: {
          missionId: mission.id,
          location: {
            latitude: validatedData.latitude,
            longitude: validatedData.longitude,
            timestamp: new Date().toISOString(),
          },
          realTimeBroadcast: true,
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

  /**
   * Réclamer une mission publiée avec assignation d'un véhicule
   * Le transporteur devient assigné directement à la mission avec son véhicule
   */
  async claim({ params, request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { vehicleId } = await request.validateUsing(claimMissionValidator)

      // Utiliser une transaction pour garantir la cohérence
      const result = await Database.transaction(async (trx) => {
        // 1. Vérifier que la mission est disponible (avec lock pour éviter race condition)
        const mission = await Mission.query({ client: trx })
          .where('id', params.id)
          .where('status', MissionStatus.PUBLISHED)
          .whereNull('transporteur_id')
          .whereNull('vehicle_id')
          .forUpdate() // Lock optimiste
          .first()

        if (!mission) {
          throw new Error('Mission not found, not available, or already claimed')
        }

        // 2. Vérifier que le véhicule existe et appartient au transporteur
        const vehicle = await Vehicle.query({ client: trx })
          .where('id', vehicleId)
          .where('userId', user.id)
          .forUpdate()
          .first()

        if (!vehicle) {
          throw new Error('Vehicle not found or does not belong to you')
        }

        // 3. Vérifier que le véhicule est disponible
        if (vehicle.status !== VehicleStatus.AVAILABLE) {
          throw new Error(`Vehicle is not available (current status: ${vehicle.statusLabel})`)
        }

        // 4. Vérifier la compatibilité du type de véhicule si requis
        if (mission.requiredVehicleType && mission.requiredVehicleType !== vehicle.type) {
          throw new Error(
            `Vehicle type mismatch: mission requires ${mission.requiredVehicleType}, but vehicle is ${vehicle.type}`
          )
        }

        // 5. Assigner le transporteur, le véhicule et changer le statut
        mission.transporteurId = user.id
        mission.vehicleId = vehicleId
        mission.status = MissionStatus.ASSIGNED
        await mission.save()

        // 6. Passer le véhicule en mission
        vehicle.status = VehicleStatus.IN_MISSION
        await vehicle.save()

        return { mission, vehicle }
      })

      const { mission, vehicle } = result

      // Charger les relations pour la réponse
      await mission.load('affreteur')
      await mission.load('adresseDepart')
      await mission.load('adresseArrivee')
      await mission.load('vehicle')

      // 🔔 Notifier l'affreteur de l'assignation
      try {
        const { default: MissionNotificationService } = await import(
          '#services/mission_notification_service'
        )
        const notificationService = new MissionNotificationService()
        await notificationService.notifyMissionAssigned(mission, user.id)
        console.log(`✅ Affreteur notifié de l'assignation de la mission ${mission.id}`)
      } catch (notificationError) {
        console.error('❌ Erreur notification assignation:', notificationError)
        // Ne pas faire échouer l'assignation si les notifications échouent
      }

      // 📍 Créer des MissionUpdates pour le tracking
      await MissionUpdate.createStatusUpdate(
        mission.id,
        user.id,
        MissionStatus.PUBLISHED,
        MissionStatus.ASSIGNED,
        'Mission assigné à un transporteur'
      )

      return response.json({
        success: true,
        message: 'Mission claimed successfully with vehicle assignment',
        data: {
          mission,
          vehicle: vehicle.serialize(),
        },
      })
    } catch (error) {
      // Gérer les erreurs spécifiques
      if (error.message.includes('Mission not found')) {
        return response.status(404).json({
          success: false,
          message: error.message,
        })
      }

      if (
        error.message.includes('Vehicle not found') ||
        error.message.includes('not available') ||
        error.message.includes('mismatch')
      ) {
        return response.status(422).json({
          success: false,
          message: error.message,
        })
      }

      return response.status(500).json({
        success: false,
        message: 'Failed to claim mission',
        error: error.message,
      })
    }
  }

  async uploadProof({ params, request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const validatedData = await request.validateUsing(deliveryProofValidator)

      // Vérifier que la mission existe et est assignée à ce transporteur
      const mission = await Mission.query()
        .where('id', params.id)
        .whereIn('status', [MissionStatus.ASSIGNED, MissionStatus.COMPLETED])
        .where('transporteur_id', user.id)
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
            type: validatedData.proofType,
            description: validatedData.description,
            imageUrl: validatedData.imageUrl || null,
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

  /**
   * Récupérer l'historique d'une mission assignée
   */
  async getHistory({ params, request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Vérifier que la mission est assignée à ce transporteur
      const mission = await Mission.query()
        .where('id', params.id)
        .where('transporteur_id', user.id)
        .first()

      if (!mission) {
        return response.status(404).json({
          success: false,
          message: 'Mission not found or not assigned to you',
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
   * Get all active GPS locations for missions in progress
   * GET /api/transporteur/missions/active-locations
   */
  async getActiveLocations({ response, auth, logger }: HttpContext) {
    logger.info('🟢 DEBUT getActiveLocations')

    try {
      // Authentification
      const user = auth.getUserOrFail()

      logger.info('📍 Récupération des positions actives pour le transporteur', {
        transporteurId: user.id,
      })

      // Vérification de la connexion à la base de données
      try {
        await Database.rawQuery('SELECT 1')
        logger.info('✅ Connexion à la base de données OK')
      } catch (dbError) {
        logger.error('❌ Erreur de connexion à la base de données', {
          error: dbError.message,
          stack: dbError.stack,
        })
        throw new Error('Impossible de se connecter à la base de données')
      }

      // Récupération des missions actives
      logger.info('🔍 Récupération des missions actives...')
      const missions = await Mission.query()
        .where('transporteur_id', user.id)
        .whereIn('status', [
          MissionStatus.IN_PROGRESS,
          MissionStatus.ASSIGNED,
          MissionStatus.READY_TO_START,
        ])
        .preload('affreteur', (query) => {
          query.select('id', 'firstName', 'lastName')
        })
        .preload('adresseDepart')
        .preload('adresseArrivee')
        .preload('transporteur', (query) => {
          query.select('id', 'firstName', 'lastName')
        })

      logger.info(`✅ ${missions.length} missions trouvées`, {
        missionIds: missions.map((m) => m.id),
      })

      logger.info(`🔍 Traitement de ${missions.length} missions`)

      // Pour chaque mission, on récupère la dernière position
      const locationsPromises = missions.map(async (mission) => {
        const missionId = mission.id
        logger.info(`🔍 Traitement de la mission ${missionId} (${mission.status})`)

        try {
          // Récupération de la dernière position
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

          // Vérification de la date de la position (5 dernières minutes)
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

          // Construction de l'objet de retour
          const locationData = {
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

          logger.debug(`📍 Données de position pour la mission ${missionId}:`, locationData)
          return locationData
        } catch (error) {
          logger.error(`❌ Erreur lors du traitement de la mission ${missionId}:`, {
            error: error.message,
            stack: error.stack,
          })
          return null
        }
      })

      // Traitement des résultats
      logger.info('🔍 Traitement des positions...')
      const locationsResults = await Promise.all(locationsPromises)
      const locations = locationsResults.filter(Boolean)

      logger.info(`✅ ${locations.length} positions actives trouvées`)

      return response.ok({
        success: true,
        data: { locations },
      })
    } catch (error) {
      logger.error('❌ ERREUR CRITIQUE dans getActiveLocations', {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
          code: error.code,
          sql: error.sql,
          sqlMessage: error.sqlMessage,
          sqlState: error.sqlState,
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
      logger.info('🔴 FIN getActiveLocations')
    }
  }

  /**
   * Récupérer l'historique des positions GPS d'une mission
   * Utilisé par le transporteur pour afficher le trajet complet avec polyline
   */
  async getLocationUpdates({ params, request, auth, response, logger }: HttpContext) {
    try {
      logger.info('🟢 DEBUT getLocationUpdates pour mission', params.id)

      const user = auth.getUserOrFail()
      const trackingServiceModule = await import('#services/mission_tracking_service')
      const trackingService = trackingServiceModule.default

      // Vérifier que la mission appartient au transporteur
      const mission = await Mission.query()
        .where('id', params.id)
        .where('transporteur_id', user.id)
        .first()

      if (!mission) {
        logger.warn(
          `❌ Mission ${params.id} non trouvée ou n'appartient pas au transporteur ${user.id}`
        )
        return response.status(404).json({
          success: false,
          message: 'Mission not found or access denied',
        })
      }

      // Récupérer l'historique des positions (par défaut 50, max 200)
      const limit = Math.min(request.input('limit', 50), 200)
      const locations = await trackingService.getRecentLocations(mission.id, limit)

      logger.info(`✅ ${locations.length} positions récupérées pour la mission ${mission.id}`)

      return response.json({
        success: true,
        message: 'Location updates retrieved successfully',
        data: locations,
      })
    } catch (error) {
      logger.error('❌ ERREUR dans getLocationUpdates', {
        error: error.message,
        stack: error.stack,
        missionId: params.id,
      })

      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve location updates',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    } finally {
      logger.info('🔴 FIN getLocationUpdates')
    }
  }
}
