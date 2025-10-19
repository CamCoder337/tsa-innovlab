import type { Timestamps } from './common.types';
import type { User } from './auth.types';
import type { Mission } from './mission.types';

// Vehicle Enums
export enum VehicleType {
  TRUCK = 'truck', // Camion (poids lourd)
  VAN = 'van', // Camionnette/Fourgon
  MOTORCYCLE = 'motorcycle', // Moto/Scooter
  CAR = 'car', // Voiture
}

export enum VehicleStatus {
  AVAILABLE = 'available', // Disponible pour missions
  IN_MISSION = 'in_mission', // Actuellement en mission
  MAINTENANCE = 'maintenance', // En maintenance
  INACTIVE = 'inactive', // Inactif (retiré temporairement)
}

// Vehicle Interface
export interface Vehicle extends Partial<Timestamps> {
  id: string;
  userId: string;
  type: VehicleType;
  registration: string;
  description: string | null;
  status: VehicleStatus;

  // Optional relations
  user?: User;
  missions?: Mission[];

  // Computed properties (from backend getters)
  typeLabel?: string;
  statusLabel?: string;
}

// API Request DTOs (matching validators)
export interface CreateVehicleRequest {
  type: VehicleType;
  registration: string;
  description?: string | null;
  status?: VehicleStatus;
}

export interface UpdateVehicleRequest {
  type?: VehicleType;
  registration?: string;
  description?: string | null;
  status?: VehicleStatus;
}

export interface UpdateVehicleStatusRequest {
  status: VehicleStatus;
}

// Vehicle Filters (matching vehiclesListValidator)
export interface VehicleFilters {
  page?: number;
  limit?: number;
  type?: VehicleType;
  status?: VehicleStatus;
  search?: string;
  sortBy?: 'type' | 'registration' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Query params version (string values for URL)
export interface VehicleFiltersQuery {
  page?: string;
  limit?: string;
  type?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

// API Response Types
export interface VehicleApiResponse {
  success: boolean;
  message: string;
  data: {
    vehicle: Vehicle;
  };
}

export interface VehiclesListApiResponse {
  success: boolean;
  message: string;
  data: {
    vehicles: {
      meta: {
        total: number;
        perPage: number;
        currentPage: number;
        lastPage: number;
        firstPage: number;
        firstPageUrl: string;
        lastPageUrl: string;
        nextPageUrl: string | null;
        previousPageUrl: string | null;
      };
      data: Vehicle[];
    };
    pagination: {
      currentPage: number;
      perPage: number;
      total: number;
      lastPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// Store Interface
export interface VehicleStore {
  // State
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchVehicles: (filters?: VehicleFiltersQuery) => Promise<void>;
  fetchVehicle: (id: string) => Promise<void>;
  createVehicle: (data: CreateVehicleRequest) => Promise<void>;
  updateVehicle: (id: string, data: UpdateVehicleRequest) => Promise<void>;
  updateVehicleStatus: (id: string, status: VehicleStatus) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Utility Types
export interface VehicleStats {
  total: number;
  available: number;
  inMission: number;
  maintenance: number;
  inactive: number;
  byType: Record<VehicleType, number>;
}

export interface VehicleSummary {
  id: string;
  type: VehicleType;
  registration: string;
  status: VehicleStatus;
  typeLabel: string;
  statusLabel: string;
}

// Form validation schemas data
export interface VehicleFormData {
  type: VehicleType | '';
  registration: string;
  description: string;
  status: VehicleStatus;
}

// Vehicle Type Labels (for UI)
export const VehicleTypeLabels: Record<VehicleType, string> = {
  [VehicleType.TRUCK]: 'Camion',
  [VehicleType.VAN]: 'Camionnette',
  [VehicleType.MOTORCYCLE]: 'Moto',
  [VehicleType.CAR]: 'Voiture',
};

// Vehicle Status Labels (for UI)
export const VehicleStatusLabels: Record<VehicleStatus, string> = {
  [VehicleStatus.AVAILABLE]: 'Disponible',
  [VehicleStatus.IN_MISSION]: 'En mission',
  [VehicleStatus.MAINTENANCE]: 'En maintenance',
  [VehicleStatus.INACTIVE]: 'Inactif',
};

// Vehicle Status Colors (for UI)
export const VehicleStatusColors: Record<VehicleStatus, string> = {
  [VehicleStatus.AVAILABLE]: 'green',
  [VehicleStatus.IN_MISSION]: 'blue',
  [VehicleStatus.MAINTENANCE]: 'orange',
  [VehicleStatus.INACTIVE]: 'gray',
};

// Vehicle Type Icons (for UI)
export const VehicleTypeIcons: Record<VehicleType, string> = {
  [VehicleType.TRUCK]: '🚛',
  [VehicleType.VAN]: '🚐',
  [VehicleType.MOTORCYCLE]: '🏍️',
  [VehicleType.CAR]: '🚗',
};
