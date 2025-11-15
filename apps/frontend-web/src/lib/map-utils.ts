import type { ShipmentDetails, RouteSegment } from '@/types/tracking.types';
import type { Address } from '@/types/address.types';
import { toast } from 'sonner';
import GoogleMapsService from '@/services/google-maps.service';

export const calculateDistance = async (
  origin: Address,
  destination: Address,
  tErrors: (key: string) => string
) => {
  if (!origin || !destination) {
    toast.error(tErrors('missions.fillAddressesForPricing'));
    return;
  }

  // Validate that addresses have coordinates
  if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
    toast.error(tErrors('missions.addressesNeedCoordinates'));
    return;
  }

  try {
    // Calculate distance using Google Maps API
    const googleMapsService = new GoogleMapsService();
    const distanceResult = await googleMapsService.calculateDistanceWithDirections(
      {
        lat: Number(origin.latitude),
        lng: Number(origin.longitude),
      },
      {
        lat: Number(destination.latitude),
        lng: Number(destination.longitude),
      }
    );

    if (!distanceResult) {
      // Fallback to straight-line distance if directions fail
      const straightLineDistance = await googleMapsService.calculateDistance(
        {
          lat: Number(origin.latitude),
          lng: Number(origin.longitude),
        },
        {
          lat: Number(destination.latitude),
          lng: Number(destination.longitude),
        }
      );

      if (!straightLineDistance) {
        toast.error(tErrors('missions.cannotCalculateDistance'));
        return;
      }

      // Use straight-line distance with a 1.3 multiplier for road distance estimation
      const estimatedDistance = Math.round(straightLineDistance * 1.3);

      return estimatedDistance;
    } else {
      return distanceResult.distance;
    }
  } catch (error) {
    console.error('Error calculating dynamic pricing:', error);
  }
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours}h ${minutes}min`;
};

export const calculateProgress = (shipment: ShipmentDetails): number => {
  if (!shipment.history?.length) return 0;

  const totalDistance = shipment.distanceTraveled + shipment.distanceRemaining;
  if (totalDistance === 0) return 0;

  return Math.min(100, Math.round((shipment.distanceTraveled / totalDistance) * 100));
};

export const getCurrentLocation = (shipment: ShipmentDetails) => {
  if (!shipment.history?.length) return null;
  return shipment.history[shipment.history.length - 1];
};

export const getEstimatedTimeOfArrival = (shipment: ShipmentDetails): Date => {
  return new Date(shipment.estimatedDelivery.latest);
};

export const getTimeInTransit = (shipment: ShipmentDetails): number => {
  if (!shipment.history?.length) return 0;

  const firstPoint = new Date(shipment.history[0].timestamp).getTime();
  const lastPoint = new Date(shipment.history[shipment.history.length - 1].timestamp).getTime();

  return (lastPoint - firstPoint) / 1000; // in seconds
};

export const getRoutePolyline = (route: RouteSegment[]) => {
  if (!route?.length) return [];

  const points: { lat: number; lng: number }[] = [];

  // Add the starting point of the first segment
  if (route[0].start) {
    points.push({ lat: route[0].start.lat, lng: route[0].start.lng });
  }

  // Add the end point of each segment
  route.forEach((segment) => {
    if (segment.end) {
      points.push({ lat: segment.end.lat, lng: segment.end.lng });
    }
  });

  return points;
};

export const getActiveAlerts = (shipment: ShipmentDetails) => {
  if (!shipment.alerts?.length) return [];

  // Filter out resolved alerts (older than 24 hours)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  return shipment.alerts.filter((alert) => new Date(alert.timestamp) > twentyFourHoursAgo);
};

export const getNextCheckpoint = (shipment: ShipmentDetails) => {
  if (shipment.nextCheckpoint) return shipment.nextCheckpoint;

  // If no explicit next checkpoint, use the destination
  return {
    name: 'Destination',
    type: 'delivery_point' as const,
    estimatedArrival: shipment.estimatedDelivery.latest,
    address: `${shipment.destination.address}, ${shipment.destination.city}, ${shipment.destination.country}`,
    contact: shipment.carrier.contact,
  };
};
