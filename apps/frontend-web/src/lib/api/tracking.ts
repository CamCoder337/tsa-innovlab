import type { ShipmentDetails } from '@/types/tracking.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Fetch shipment tracking data by tracking number
 */
export async function getShipmentByTrackingNumber(
  trackingNumber: string
): Promise<ShipmentDetails> {
  const response = await fetch(`${API_BASE_URL}/tracking/${encodeURIComponent(trackingNumber)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch shipment data');
  }

  return response.json();
}

/**
 * Simulate real-time tracking updates using WebSocket or Server-Sent Events (SSE)
 */
export function subscribeToTrackingUpdates(onUpdate: (update: Partial<ShipmentDetails>) => void) {
  // In a real app, this would connect to a WebSocket or SSE endpoint
  // For now, we'll simulate updates with setInterval
  const interval = setInterval(() => {
    // Simulate occasional updates (20% chance)
    if (Math.random() < 0.2) {
      onUpdate({
        lastUpdated: new Date().toISOString(),
        // Simulate minor position changes
        currentLocation: {
          lat: 4.12 + (Math.random() * 0.01 - 0.005),
          lng: 10.08 + (Math.random() * 0.01 - 0.005),
          address: 'En transit vers Yaoundé',
          timestamp: new Date().toISOString(),
        },
        // Simulate occasional alerts (5% chance)
        alerts:
          Math.random() < 0.05
            ? [
                {
                  id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  type: 'custom',
                  severity: Math.random() > 0.7 ? 'warning' : 'info',
                  title: Math.random() > 0.5 ? 'Alerte Trafic' : 'Pause Déjeuner',
                  message:
                    Math.random() > 0.5
                      ? 'Trafic dense sur le trajet, légère augmentation du temps de trajet prévu.'
                      : 'Arrêt prévu pour la pause déjeuner dans 30 minutes.',
                  timestamp: new Date().toISOString(),
                  isRead: false,
                  canDismiss: true,
                },
              ]
            : [],
      });
    }
  }, 30000); // Update every 30 seconds

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Get the estimated time of arrival (ETA) with traffic conditions
 */
export async function getTrafficAwareETA(): Promise<{
  /** Estimated duration in seconds */
  duration: number;
  /** Duration in traffic in seconds */
  durationInTraffic: number;
  /** Distance in meters */
  distance: number;
}> {
  // In a real app, this would call the Google Maps Distance Matrix API
  // or a similar service to get real traffic data

  // For now, return mock data
  return {
    duration: 3600, // 1 hour in seconds
    durationInTraffic: 3900, // 1h05 with traffic
    distance: 50000, // 50 km
  };
}

/**
 * Get weather conditions for a specific location
 */
export async function getWeatherConditions(): Promise<{
  condition: string;
  temperature: number;
  windSpeed: number;
  precipitation: number;
  icon: string;
}> {
  // In a real app, this would call a weather API
  // For now, return mock data
  const conditions = [
    { condition: 'clear', icon: '☀️' },
    { condition: 'partly_cloudy', icon: '⛅' },
    { condition: 'cloudy', icon: '☁️' },
    { condition: 'rain', icon: '🌧️' },
    { condition: 'storm', icon: '⛈️' },
  ];

  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

  return {
    ...randomCondition,
    temperature: Math.round(20 + Math.random() * 15), // 20-35°C
    windSpeed: Math.round(5 + Math.random() * 15), // 5-20 km/h
    precipitation: Math.round(Math.random() * 100), // 0-100%
  };
}
