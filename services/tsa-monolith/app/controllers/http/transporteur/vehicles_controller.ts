import type { HttpContext } from '@adonisjs/core/http'
import Vehicle from '#models/vehicle'
import Mission from '#models/mission'
import { VehicleStatus } from '#models/vehicle'
import {
  createVehicleValidator,
  updateVehicleValidator,
  updateVehicleStatusValidator,
  vehiclesListValidator,
} from '#validators/vehicle_validator'
import AuditLog from '#models/audit_log'

export default class VehiclesController {
  /**
   * Liste des véhicules du transporteur avec filtres
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const filters = await request.validateUsing(vehiclesListValidator)

      const {
        page = 1,
        limit = 20,
        type,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters

      // Le transporteur ne voit que SES véhicules
      const query = Vehicle.query().where('userId', user.id)

      // Filtre par type
      if (type) {
        query.where('type', type)
      }

      // Filtre par statut
      if (status) {
        query.where('status', status)
      }

      // Recherche par immatriculation ou description
      if (search) {
        query.where((builder) => {
          builder
            .whereILike('registration', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
        })
      }

      // Tri
      query.orderBy(sortBy, sortOrder)

      // Pagination
      const vehicles = await query.paginate(page, limit)

      return response.json({
        success: true,
        message: 'Vehicles retrieved successfully',
        data: {
          vehicles: vehicles.serialize(),
          pagination: {
            currentPage: vehicles.currentPage,
            perPage: vehicles.perPage,
            total: vehicles.total,
            lastPage: vehicles.lastPage,
            hasNext: vehicles.currentPage < vehicles.lastPage,
            hasPrev: vehicles.currentPage > 1,
          },
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicles',
        errors: [error.message],
      })
    }
  }

  /**
   * Afficher un véhicule spécifique
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const vehicle = await Vehicle.findOrFail(params.id)

      // Vérifier que le véhicule appartient au transporteur
      if (vehicle.userId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Unauthorized access',
          errors: ['You can only view your own vehicles'],
        })
      }

      // Charger les missions associées (optionnel)
      await vehicle.load('missions')

      return response.json({
        success: true,
        message: 'Vehicle retrieved successfully',
        data: { vehicle: vehicle.serialize() },
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        message: 'Vehicle not found',
        errors: [error.message],
      })
    }
  }

  /**
   * Créer un nouveau véhicule
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = await request.validateUsing(createVehicleValidator)

      // Vérifier l'unicité de l'immatriculation
      const existingVehicle = await Vehicle.findBy('registration', data.registration)
      if (existingVehicle) {
        return response.status(422).json({
          success: false,
          message: 'Vehicle registration already exists',
          errors: ['A vehicle with this registration already exists'],
        })
      }

      // Créer le véhicule pour ce transporteur
      const vehicle = await Vehicle.create({
        ...data,
        userId: user.id,
        status: data.status ?? VehicleStatus.AVAILABLE,
      })

      // Log de l'audit
      await AuditLog.create({
        action: 'vehicle.create',
        entityType: 'vehicles',
        entityId: vehicle.id,
        userId: user.id,
        newValues: vehicle.serialize(),
      })

      return response.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: { vehicle: vehicle.serialize() },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to create vehicle',
        errors: [error.message],
      })
    }
  }

  /**
   * Mettre à jour un véhicule existant
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const vehicle = await Vehicle.findOrFail(params.id)

      // Vérifier que le véhicule appartient au transporteur
      if (vehicle.userId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Unauthorized access',
          errors: ['You can only update your own vehicles'],
        })
      }

      const data = await request.validateUsing(updateVehicleValidator)

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = vehicle.serialize()

      // Vérifier l'unicité de l'immatriculation si modifiée
      if (data.registration && data.registration !== vehicle.registration) {
        const existingVehicle = await Vehicle.findBy('registration', data.registration)
        if (existingVehicle) {
          return response.status(422).json({
            success: false,
            message: 'Vehicle registration already exists',
            errors: ['A vehicle with this registration already exists'],
          })
        }
      }

      // Mettre à jour le véhicule
      vehicle.merge(data)
      await vehicle.save()

      // Log de l'audit
      await AuditLog.create({
        action: 'vehicle.update',
        entityType: 'vehicles',
        entityId: vehicle.id,
        userId: user.id,
        oldValues,
        newValues: vehicle.serialize(),
      })

      return response.json({
        success: true,
        message: 'Vehicle updated successfully',
        data: { vehicle: vehicle.serialize() },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to update vehicle',
        errors: [error.message],
      })
    }
  }

  /**
   * Supprimer un véhicule
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const vehicle = await Vehicle.findOrFail(params.id)

      // Vérifier que le véhicule appartient au transporteur
      if (vehicle.userId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Unauthorized access',
          errors: ['You can only delete your own vehicles'],
        })
      }

      // Empêcher la suppression si le véhicule est en mission
      if (vehicle.status === VehicleStatus.IN_MISSION) {
        return response.status(422).json({
          success: false,
          message: 'Cannot delete vehicle in mission',
          errors: ['This vehicle is currently assigned to a mission and cannot be deleted'],
        })
      }

      // Sauvegarder les données pour l'audit
      const oldValues = vehicle.serialize()

      // Supprimer le véhicule
      await vehicle.delete()

      // Log de l'audit
      await AuditLog.create({
        action: 'vehicle.delete',
        entityType: 'vehicles',
        entityId: params.id,
        userId: user.id,
        oldValues,
      })

      return response.json({
        success: true,
        message: 'Vehicle deleted successfully',
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to delete vehicle',
        errors: [error.message],
      })
    }
  }

  /**
   * Changer le statut d'un véhicule
   */
  async updateStatus({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const vehicle = await Vehicle.findOrFail(params.id)

      // Vérifier que le véhicule appartient au transporteur
      if (vehicle.userId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Unauthorized access',
          errors: ['You can only update your own vehicles'],
        })
      }

      const { status } = await request.validateUsing(updateVehicleStatusValidator)

      // Sauvegarder l'ancien statut
      const oldStatus = vehicle.status

      // Empêcher de changer le statut si le véhicule est en mission
      // (sauf si on veut le passer en maintenance d'urgence)
      if (vehicle.status === VehicleStatus.IN_MISSION && status !== VehicleStatus.MAINTENANCE) {
        // Vérifier qu'il n'y a pas de mission active
        const activeMission = await Mission.query()
          .where('vehicleId', vehicle.id)
          .whereIn('status', ['assigned'])
          .first()

        if (activeMission) {
          return response.status(422).json({
            success: false,
            message: 'Cannot change status while in active mission',
            errors: ['This vehicle is currently assigned to an active mission'],
          })
        }
      }

      // Mettre à jour le statut
      vehicle.status = status
      await vehicle.save()

      // Log de l'audit
      await AuditLog.create({
        action: 'vehicle.status_update',
        entityType: 'vehicles',
        entityId: vehicle.id,
        userId: user.id,
        oldValues: { status: oldStatus },
        newValues: { status },
      })

      return response.json({
        success: true,
        message: 'Vehicle status updated successfully',
        data: { vehicle: vehicle.serialize() },
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to update vehicle status',
        errors: [error.message],
      })
    }
  }
}
