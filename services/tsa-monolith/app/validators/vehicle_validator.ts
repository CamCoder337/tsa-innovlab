import vine from '@vinejs/vine'
import { VehicleType, VehicleStatus } from '#models/vehicle'

/**
 * Validator for creating a new vehicle
 */
export const createVehicleValidator = vine.compile(
  vine.object({
    type: vine.enum(Object.values(VehicleType)),
    registration: vine
      .string()
      .minLength(3)
      .maxLength(50)
      .trim()
      .regex(/^[A-Z0-9-]+$/i),
    description: vine.string().trim().optional().nullable(),
    status: vine.enum(Object.values(VehicleStatus)).optional(),
  })
)

/**
 * Validator for updating an existing vehicle
 */
export const updateVehicleValidator = vine.compile(
  vine.object({
    type: vine.enum(Object.values(VehicleType)).optional(),
    registration: vine
      .string()
      .minLength(3)
      .maxLength(50)
      .trim()
      .regex(/^[A-Z0-9-]+$/i)
      .optional(),
    description: vine.string().trim().optional().nullable(),
    status: vine.enum(Object.values(VehicleStatus)).optional(),
  })
)

/**
 * Validator for updating vehicle status
 */
export const updateVehicleStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(Object.values(VehicleStatus)),
  })
)

/**
 * Validator for vehicle listing with filters
 */
export const vehiclesListValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    type: vine.enum(Object.values(VehicleType)).optional(),
    status: vine.enum(Object.values(VehicleStatus)).optional(),
    search: vine.string().trim().optional(),
    sortBy: vine.enum(['type', 'registration', 'status', 'createdAt', 'updatedAt']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)

/**
 * Validator for claiming a mission with a vehicle
 */
export const claimMissionValidator = vine.compile(
  vine.object({
    vehicleId: vine.string().uuid(),
  })
)
