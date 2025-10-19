import { useCallback, useEffect } from 'react';
import { useVehicleStore } from '@/stores/vehicleStore';
import type { Vehicle, VehicleStatus, VehicleType } from '@/types/vehicle.types';
import { useAuth } from './useAuth';

/**
 * Main vehicles hook providing all vehicle functionality
 */
export const useVehicles = () => {
  const store = useVehicleStore();
  const { user } = useAuth();

  // Auto-fetch vehicles for transporteurs
  useEffect(() => {
    if (user && user.role === 'transporteur') {
      store.fetchVehicles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getVehicleById = useCallback(
    (id: string): Vehicle | undefined => {
      return store.vehicles.find((vehicle) => vehicle.id === id);
    },
    [store.vehicles]
  );

  const getVehiclesByStatus = useCallback(
    (status: VehicleStatus): Vehicle[] => {
      return store.vehicles.filter((vehicle) => vehicle.status === status);
    },
    [store.vehicles]
  );

  const getVehiclesByType = useCallback(
    (type: VehicleType): Vehicle[] => {
      return store.vehicles.filter((vehicle) => vehicle.type === type);
    },
    [store.vehicles]
  );

  const getAvailableVehicles = useCallback((): Vehicle[] => {
    return store.vehicles.filter((vehicle) => vehicle.status === 'available');
  }, [store.vehicles]);

  const getMaintenanceVehicles = useCallback((): Vehicle[] => {
    return store.vehicles.filter((vehicle) => vehicle.status === 'maintenance');
  }, [store.vehicles]);

  const getInUseVehicles = useCallback((): Vehicle[] => {
    return store.vehicles.filter((vehicle) => vehicle.status === 'in_mission');
  }, [store.vehicles]);

  const searchVehicles = useCallback(
    (query: string): Vehicle[] => {
      if (!query.trim()) return store.vehicles;

      const lowercaseQuery = query.toLowerCase();
      return store.vehicles.filter((vehicle) =>
        vehicle.type?.toLowerCase().includes(lowercaseQuery)
      );
    },
    [store.vehicles]
  );

  const getTotalVehicles = useCallback(() => {
    return store.vehicles.length;
  }, [store.vehicles]);

  const getAvailableCount = useCallback(() => {
    return store.vehicles.filter((vehicle) => vehicle.status === 'available').length;
  }, [store.vehicles]);

  const getInUseCount = useCallback(() => {
    return store.vehicles.filter((vehicle) => vehicle.status === 'in_mission').length;
  }, [store.vehicles]);

  const getMaintenanceCount = useCallback(() => {
    return store.vehicles.filter((vehicle) => vehicle.status === 'maintenance').length;
  }, [store.vehicles]);

  return {
    // State
    vehicles: store.vehicles,
    currentVehicle: store.currentVehicle,
    availableVehicles: store.availableVehicles,
    vehicleStats: store.vehicleStats,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    fetchVehicles: store.fetchVehicles,
    fetchVehicle: store.fetchVehicle,
    createVehicle: store.createVehicle,
    updateVehicle: store.updateVehicle,
    deleteVehicle: store.deleteVehicle,
    updateVehicleStatus: store.updateVehicleStatus,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    reset: store.reset,

    // Helper functions
    getVehicleById,
    getVehiclesByStatus,
    getVehiclesByType,
    getAvailableVehicles,
    getMaintenanceVehicles,
    getInUseVehicles,
    searchVehicles,
    getTotalVehicles,
    getAvailableCount,
    getInUseCount,
    getMaintenanceCount,
  };
};
