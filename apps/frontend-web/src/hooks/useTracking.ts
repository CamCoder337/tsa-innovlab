import { useTrackingStore } from '@/stores/trackingStore';
import { useCallback } from 'react';
import { mockShipmentsDatabase, generateMockShipment } from '@/mocks/trackingData';
import { enhancedMockShipmentsDatabase } from '@/mocks/enhancedTrackingData';
import type { ShipmentDetails } from '@/types/tracking.types';

export function useTracking() {
  const currentTracking = useTrackingStore((s) => s.currentTracking);
  const isLoading = useTrackingStore((s) => s.isLoading);
  const error = useTrackingStore((s) => s.error);
  const lastUpdated = useTrackingStore((s) => s.lastUpdated);
  const setCurrentTracking = useTrackingStore((s) => s.setCurrentTracking);
  const setLoading = useTrackingStore((s) => s.setLoading);
  const setError = useTrackingStore((s) => s.setError);
  const clearTracking = useTrackingStore((s) => s.clearTracking);

  // API functions
  const fetchTrackingInfo = async (trackingNumber: string): Promise<ShipmentDetails> => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.get(`/tracking/${trackingNumber}`);
      // return response.data;

      // Mock response for development using ShipmentDetails
      return new Promise((resolve) => {
        setTimeout(() => {
          // Check enhanced database first (with omniscient features)
          const enhancedShipment = enhancedMockShipmentsDatabase[trackingNumber];
          if (enhancedShipment) {
            resolve(enhancedShipment);
            return;
          }

          // Fallback to regular mock database
          const mockShipment = mockShipmentsDatabase[trackingNumber];
          if (mockShipment) {
            resolve(mockShipment);
          } else {
            // Generate a new mock shipment if tracking number not found
            resolve(generateMockShipment(trackingNumber, 'in_transit'));
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Error fetching tracking info:', error);
      throw new Error('Failed to fetch tracking information');
    }
  };

  const trackShipment = useCallback(
    async (trackingNumber: string) => {
      try {
        setLoading(true);
        setError(null);

        const trackingInfo = await fetchTrackingInfo(trackingNumber);
        console.log(trackingInfo);
        setCurrentTracking(trackingInfo);

        return trackingInfo;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to track shipment';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setCurrentTracking, setError, setLoading]
  );

  return {
    tracking: currentTracking as ShipmentDetails | null,
    isLoading,
    error,
    lastUpdated,
    trackShipment,
    clearTracking,
  };
}
