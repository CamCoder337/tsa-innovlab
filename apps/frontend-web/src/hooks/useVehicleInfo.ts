import { useState, useCallback } from 'react';
import { useVehicleStore } from '@/stores/vehicleStore';
import type { Vehicle } from '@/types/vehicle.types';

export const useVehicleInfo = () => {
  const { vehicles, fetchVehicles } = useVehicleStore();
  const [isLoading, setIsLoading] = useState(false);

  const getVehicleById = useCallback(
    async (vehicleId: string): Promise<Vehicle | null> => {
      // First check if vehicle is already in store
      const cachedVehicle = vehicles.find((v) => v.id === vehicleId);
      if (cachedVehicle) {
        return cachedVehicle;
      }

      // If not found, fetch vehicles to update store
      setIsLoading(true);
      try {
        await fetchVehicles();
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        return vehicle || null;
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [vehicles, fetchVehicles]
  );

  const getVehicleRegistration = useCallback(
    async (vehicleId: string): Promise<string> => {
      const vehicle = await getVehicleById(vehicleId);
      return vehicle?.registration || 'Véhicule inconnu';
    },
    [getVehicleById]
  );

  return {
    getVehicleById,
    getVehicleRegistration,
    isLoading,
  };
};
