import type { ShipmentDetails, RouteSegment } from '@/types/tracking.types';

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
