import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Vehicle,
  VehicleStore,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleStatus,
  VehicleStats,
  VehicleFiltersQuery,
} from '../types/vehicle.types';
import { vehicleService } from '../services/vehicle.service';

interface VehicleStoreState extends VehicleStore {
  // Additional computed state
  availableVehicles: Vehicle[];
  vehicleStats: VehicleStats | null;
}

const initialState = {
  vehicles: [],
  currentVehicle: null,
  availableVehicles: [],
  vehicleStats: null,
  isLoading: false,
  error: null,
};

export const useVehicleStore = create<VehicleStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      fetchVehicles: async (filters?: VehicleFiltersQuery) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehicleService.getVehicles(filters);
          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          const vehicles = response.data?.vehicles?.data || [];
          set({
            vehicles,
            availableVehicles: vehicles.filter((v) => v.status === 'available'),
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch vehicles',
            isLoading: false,
          });
        }
      },

      fetchVehicle: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehicleService.getVehicle(id);
          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          set({ currentVehicle: response.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch vehicle',
            isLoading: false,
          });
        }
      },

      createVehicle: async (data: CreateVehicleRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehicleService.createVehicle(data);
          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          const newVehicle = response.data!;
          const { vehicles } = get();
          const updatedVehicles = [newVehicle, ...vehicles];

          set({
            vehicles: updatedVehicles,
            availableVehicles: updatedVehicles.filter((v) => v.status === 'available'),
            currentVehicle: newVehicle,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create vehicle',
            isLoading: false,
          });
        }
      },

      updateVehicle: async (id: string, data: UpdateVehicleRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehicleService.updateVehicle(id, data);
          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          const updatedVehicle = response.data!;
          const { vehicles, currentVehicle } = get();
          const updatedVehicles = vehicles.map((v) => (v.id === id ? updatedVehicle : v));

          set({
            vehicles: updatedVehicles,
            availableVehicles: updatedVehicles.filter((v) => v.status === 'available'),
            currentVehicle: currentVehicle?.id === id ? updatedVehicle : currentVehicle,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update vehicle',
            isLoading: false,
          });
        }
      },

      updateVehicleStatus: async (id: string, status: VehicleStatus) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehicleService.updateVehicleStatus(id, { status });
          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          const updatedVehicle = response.data!;
          const { vehicles, currentVehicle } = get();
          const updatedVehicles = vehicles.map((v) => (v.id === id ? updatedVehicle : v));

          set({
            vehicles: updatedVehicles,
            availableVehicles: updatedVehicles.filter((v) => v.status === 'available'),
            currentVehicle: currentVehicle?.id === id ? updatedVehicle : currentVehicle,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update vehicle status',
            isLoading: false,
          });
        }
      },

      deleteVehicle: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await vehicleService.deleteVehicle(id);
          if (response.error) {
            set({ error: response.error.message, isLoading: false });
            return;
          }

          const { vehicles, currentVehicle } = get();
          const updatedVehicles = vehicles.filter((v) => v.id !== id);

          set({
            vehicles: updatedVehicles,
            availableVehicles: updatedVehicles.filter((v) => v.status === 'available'),
            currentVehicle: currentVehicle?.id === id ? null : currentVehicle,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete vehicle',
            isLoading: false,
          });
        }
      },

      // Utility actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'vehicle-store',
      partialize: (state) => ({
        vehicles: state.vehicles,
        availableVehicles: state.availableVehicles,
        vehicleStats: state.vehicleStats,
      }),
    }
  )
);
