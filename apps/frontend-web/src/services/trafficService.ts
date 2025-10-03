import type {
  TrafficData,
  RoadCheckpoint,
  GoogleMapsTrafficResponse,
} from '@/types/tracking.types';

/**
 * Traffic Service - Integrates traffic conditions, road incidents, and checkpoints
 * Uses Google Maps Traffic API for real-time traffic data
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key is not set. Traffic data will be mocked.');
}

/**
 * Map Google Maps API response to our TrafficData type
 */
function mapTrafficResponse(data: GoogleMapsTrafficResponse): TrafficData {
  if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) {
    throw new Error('Invalid traffic data received from Google Maps API');
  }

  const leg = data.routes[0].legs[0];

  // Calculate delay in minutes (difference between traffic and free flow duration)
  const freeFlowDuration = leg.steps.reduce(
    (sum: number, step: { duration: { value: number } }) => sum + step.duration.value,
    0
  );
  const trafficDuration = leg.duration_in_traffic?.value || freeFlowDuration;
  const delaySeconds = Math.max(0, trafficDuration - freeFlowDuration);
  const delayMinutes = Math.round(delaySeconds / 60);

  // Estimate speed based on distance and duration (distance in meters, duration in seconds)
  const distanceKm =
    leg.steps.reduce(
      (sum: number, step: { distance: { value: number } }) => sum + step.distance.value,
      0
    ) / 1000;
  const durationHours = trafficDuration / 3600;
  const averageSpeedKmh = durationHours > 0 ? Math.round(distanceKm / durationHours) : 0;

  // Determine severity based on delay percentage
  const delayPercentage = freeFlowDuration > 0 ? (delaySeconds / freeFlowDuration) * 100 : 0;
  let severity: TrafficData['severity'] = 'free_flow';

  if (delayPercentage > 50) severity = 'blocked';
  else if (delayPercentage > 25) severity = 'heavy';
  else if (delayPercentage > 10) severity = 'moderate';
  else if (delayPercentage > 0) severity = 'light';

  return {
    severity,
    speedKmh: averageSpeedKmh,
    averageSpeedKmh,
    delayMinutes,
    incidentType: undefined, // Google Maps doesn't provide this directly
    incidentDescription: undefined,
    alternativeRoutesAvailable: true, // Assume true as we don't have this info
    estimatedClearanceTime: undefined, // Google Maps doesn't provide this
  };
}

/**
 * Get current traffic conditions for a location
 */
export async function getTrafficConditions(lat: number, lng: number): Promise<TrafficData> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Using mock traffic data as no API key is configured');
      return generateMockTraffic(lat, lng);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${lng}&destination=${lat + 0.01},${lng + 0.01}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return mapTrafficResponse(data);
  } catch (error) {
    console.error('Error fetching traffic conditions:', error);
    throw new Error('Failed to fetch traffic data');
  }
}

/**
 * Get traffic incidents along a route
 */
export async function getRouteTrafficIncidents(
  waypoints: Array<{ lat: number; lng: number }>
): Promise<
  Array<{
    type: TrafficData['incidentType'];
    description: string;
    location: { lat: number; lng: number };
    severity: TrafficData['severity'];
  }>
> {
  try {
    // In production, query traffic incident APIs
    return generateMockIncidents(waypoints);
  } catch (error) {
    console.error('Error fetching traffic incidents:', error);
    return [];
  }
}

/**
 * Get road checkpoints (police, customs, tolls) along route
 */
export async function getRoadCheckpoints(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RoadCheckpoint[]> {
  // In production, query checkpoint database or API
  return generateMockCheckpoints(origin, destination);
}

/**
 * Calculate traffic-aware ETA
 */
export async function calculateTrafficAwareETA(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{
  duration: number; // seconds without traffic
  durationInTraffic: number; // seconds with current traffic
  distance: number; // meters
  trafficDelay: number; // seconds
}> {
  try {
    // In production, use Google Maps Distance Matrix API with traffic
    // const response = await fetch(
    //   `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`
    // );

    // Mock calculation
    const distance = calculateDistance(origin, destination);
    const baseDuration = (distance / 60) * 1000; // 60 km/h average
    const traffic = await getTrafficConditions(origin.lat, origin.lng);

    const trafficFactor = {
      free_flow: 1.0,
      light: 1.1,
      moderate: 1.3,
      heavy: 1.6,
      blocked: 2.5,
    }[traffic.severity];

    const durationInTraffic = baseDuration * trafficFactor;
    const trafficDelay = durationInTraffic - baseDuration;

    return {
      duration: Math.round(baseDuration),
      durationInTraffic: Math.round(durationInTraffic),
      distance: Math.round(distance * 1000),
      trafficDelay: Math.round(trafficDelay),
    };
  } catch (error) {
    console.error('Error calculating ETA:', error);
    throw error;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Generate mock traffic data
 */
function generateMockTraffic(lat: number, lng: number): TrafficData {
  const seed = Math.abs(Math.sin(lat * lng));
  const hour = new Date().getHours();

  // Simulate rush hours (7-9 AM, 5-7 PM)
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

  const severities: Array<TrafficData['severity']> = [
    'free_flow',
    'light',
    'moderate',
    'heavy',
    'blocked',
  ];

  const severityIndex = isRushHour
    ? Math.floor(seed * 3) + 2 // moderate to blocked during rush hour
    : Math.floor(seed * 3); // free_flow to moderate otherwise

  const severity = severities[Math.min(severityIndex, 4)];

  const incidents: Array<TrafficData['incidentType']> = [
    'congestion',
    'accident',
    'roadwork',
    'checkpoint',
  ];

  const hasIncident = seed > 0.7;
  const incidentType = hasIncident ? incidents[Math.floor(seed * incidents.length)] : undefined;

  const baseSpeed = 80;
  const speedReduction = {
    free_flow: 0,
    light: 10,
    moderate: 25,
    heavy: 40,
    blocked: 70,
  }[severity];

  const currentSpeed = baseSpeed - speedReduction;
  const delayMinutes = {
    free_flow: 0,
    light: 2,
    moderate: 8,
    heavy: 20,
    blocked: 45,
  }[severity];

  const descriptions: Record<string, string> = {
    congestion: 'Embouteillage important sur la voie',
    accident: 'Accident de circulation signalé',
    roadwork: 'Travaux routiers en cours',
    checkpoint: 'Contrôle routier en cours',
  };

  return {
    severity,
    speedKmh: currentSpeed,
    averageSpeedKmh: baseSpeed,
    delayMinutes,
    incidentType,
    incidentDescription: incidentType ? descriptions[incidentType] : undefined,
    alternativeRoutesAvailable: severity === 'heavy' || severity === 'blocked',
    estimatedClearanceTime: hasIncident
      ? new Date(Date.now() + delayMinutes * 60000).toISOString()
      : undefined,
  };
}

/**
 * Generate mock traffic incidents
 */
function generateMockIncidents(waypoints: Array<{ lat: number; lng: number }>): Array<{
  type: TrafficData['incidentType'];
  description: string;
  location: { lat: number; lng: number };
  severity: TrafficData['severity'];
}> {
  const incidents: Array<{
    type: TrafficData['incidentType'];
    description: string;
    location: { lat: number; lng: number };
    severity: TrafficData['severity'];
  }> = [];
  const incidentProbability = 0.3;

  waypoints.forEach((point, index) => {
    if (Math.random() < incidentProbability && index > 0 && index < waypoints.length - 1) {
      const types: Array<TrafficData['incidentType']> = [
        'accident',
        'roadwork',
        'congestion',
        'checkpoint',
        'closure',
      ];

      const descriptions = {
        accident: 'Accident de la route - 2 véhicules impliqués',
        roadwork: 'Réfection de la chaussée - Circulation alternée',
        congestion: 'Trafic dense suite à un événement',
        checkpoint: 'Contrôle routier en cours',
        closure: 'Fermeture de route exceptionnelle',
      };

      const type = types[Math.floor(Math.random() * types.length)] as NonNullable<
        TrafficData['incidentType']
      >;

      incidents.push({
        type,
        description: descriptions[type],
        location: point,
        severity: type === 'accident' ? 'heavy' : 'moderate',
      });
    }
  });

  return incidents;
}

/**
 * Generate mock checkpoints
 */
function generateMockCheckpoints(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): RoadCheckpoint[] {
  const checkpoints: RoadCheckpoint[] = [];

  // Calculate route distance
  const distance = calculateDistance(origin, destination);
  const numCheckpoints = Math.floor(distance / 100) + 1; // 1 checkpoint per 100km

  for (let i = 0; i < numCheckpoints; i++) {
    const ratio = (i + 1) / (numCheckpoints + 1);
    const lat = origin.lat + (destination.lat - origin.lat) * ratio;
    const lng = origin.lng + (destination.lng - origin.lng) * ratio;

    const types: Array<RoadCheckpoint['type']> = ['police', 'toll', 'weighstation'];
    const type = types[Math.floor(Math.random() * types.length)];

    const cities = ['Yaoundé', 'Douala', 'Bafoussam', 'Bertoua', 'Garoua'];
    const city = cities[Math.floor(Math.random() * cities.length)];

    checkpoints.push({
      id: `checkpoint-${i}`,
      type,
      name: `${type === 'police' ? 'Contrôle Police' : type === 'toll' ? 'Péage' : 'Poste de pesage'} ${city}`,
      location: {
        lat,
        lng,
        address: `Route nationale, ${city}`,
      },
      averageWaitTime: type === 'toll' ? 5 : type === 'police' ? 10 : 15,
      currentWaitTime: Math.floor(Math.random() * 20) + 5,
      operatingHours: type === 'toll' ? '24/7' : '06:00 - 22:00',
      requirements:
        type === 'police'
          ? ['Permis de conduire', 'Carte grise', 'Assurance']
          : type === 'weighstation'
            ? ['Autorisation de transport', 'Certificat de pesage']
            : ['Paiement du péage'],
      isPassed: ratio < 0.3, // First 30% already passed
      passedTime: ratio < 0.3 ? new Date(Date.now() - 3600000).toISOString() : undefined,
    });
  }

  return checkpoints;
}

/**
 * Analyze traffic impact on delivery
 */
export function analyzeTrafficImpact(traffic: TrafficData): {
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  estimatedDelay: number;
  recommendation: string;
} {
  const impactMap = {
    free_flow: { riskLevel: 'low' as const, delay: 0, rec: 'Trafic fluide' },
    light: { riskLevel: 'low' as const, delay: 2, rec: "Trafic léger, pas d'impact" },
    moderate: {
      riskLevel: 'moderate' as const,
      delay: 10,
      rec: 'Trafic modéré, léger retard possible',
    },
    heavy: { riskLevel: 'high' as const, delay: 25, rec: 'Trafic dense, retard probable' },
    blocked: {
      riskLevel: 'severe' as const,
      delay: 60,
      rec: 'Route bloquée, considérer itinéraire alternatif',
    },
  };

  const impact = impactMap[traffic.severity];

  return {
    riskLevel: impact.riskLevel,
    estimatedDelay: impact.delay + (traffic.delayMinutes || 0),
    recommendation: impact.rec,
  };
}
