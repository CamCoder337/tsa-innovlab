import type {
  ShipmentDetails,
  TrackingPoint,
  RouteSegment,
  TrackingAlert,
  RoadCheckpoint,
  PredictiveETA,
  DriverProximity,
} from '@/types/tracking.types';

/**
 * Enhanced Mock Tracking Data with Omniscient Features
 * Includes weather, traffic, predictive ETA, and real-time proximity
 */

// Generate enhanced route segments with traffic and weather
function generateEnhancedRoute(): RouteSegment[] {
  return [
    {
      id: 'segment-1',
      start: {
        lat: 4.0511,
        lng: 9.7679,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      end: {
        lat: 3.8,
        lng: 10.135,
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      },
      distance: 87000,
      duration: 5400,
      trafficDelay: 300,
      weatherConditions: {
        condition: 'partly_cloudy',
        description: 'Partiellement nuageux',
        temperature: 28,
        feelsLike: 30,
        windSpeed: 12,
        windDirection: 180,
        precipitation: 0,
        humidity: 65,
        visibility: 10,
        uvIndex: 7,
        icon: '⛅',
        riskLevel: 'low',
        impactOnDelivery: 'Conditions favorables',
      },
      trafficData: {
        severity: 'light',
        speedKmh: 65,
        averageSpeedKmh: 70,
        delayMinutes: 5,
        alternativeRoutesAvailable: false,
      },
      terrainType: 'highway',
      roadQuality: 'good',
    },
    {
      id: 'segment-2',
      start: {
        lat: 3.8,
        lng: 10.135,
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      },
      end: {
        lat: 3.95,
        lng: 10.85,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      distance: 95000,
      duration: 6000,
      trafficDelay: 600,
      weatherConditions: {
        condition: 'rain',
        description: 'Pluie légère',
        temperature: 24,
        feelsLike: 23,
        windSpeed: 18,
        windDirection: 220,
        precipitation: 8,
        humidity: 85,
        visibility: 6,
        uvIndex: 3,
        icon: '🌧️',
        riskLevel: 'moderate',
        impactOnDelivery: 'Pluie légère - Léger ralentissement',
      },
      trafficData: {
        severity: 'moderate',
        speedKmh: 45,
        averageSpeedKmh: 60,
        delayMinutes: 10,
        incidentType: 'congestion',
        incidentDescription: 'Trafic modéré dû à la pluie',
        alternativeRoutesAvailable: true,
      },
      terrainType: 'highway',
      roadQuality: 'fair',
    },
    {
      id: 'segment-3',
      start: {
        lat: 3.95,
        lng: 10.85,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      end: {
        lat: 3.8667,
        lng: 11.5167,
        timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
      distance: 68000,
      duration: 4800,
      trafficDelay: 0,
      weatherConditions: {
        condition: 'clear',
        description: 'Temps clair',
        temperature: 26,
        feelsLike: 27,
        windSpeed: 10,
        windDirection: 90,
        precipitation: 0,
        humidity: 60,
        visibility: 12,
        uvIndex: 8,
        icon: '☀️',
        riskLevel: 'low',
        impactOnDelivery: 'Conditions optimales',
      },
      trafficData: {
        severity: 'free_flow',
        speedKmh: 70,
        averageSpeedKmh: 70,
        delayMinutes: 0,
        alternativeRoutesAvailable: false,
      },
      terrainType: 'highway',
      roadQuality: 'excellent',
    },
  ];
}

// Generate road checkpoints
function generateRoadCheckpoints(): RoadCheckpoint[] {
  return [
    {
      id: 'checkpoint-police-1',
      type: 'police',
      name: 'Contrôle Police Edéa',
      location: {
        lat: 3.8,
        lng: 10.135,
        address: 'Route Nationale N3, Edéa',
      },
      averageWaitTime: 8,
      currentWaitTime: 5,
      operatingHours: '06:00 - 22:00',
      requirements: ['Permis de conduire', 'Carte grise', 'Assurance'],
      isPassed: true,
      passedTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'checkpoint-toll-1',
      type: 'toll',
      name: 'Péage Dibombari',
      location: {
        lat: 3.92,
        lng: 11.2,
        address: 'Autoroute Douala-Yaoundé',
      },
      averageWaitTime: 5,
      currentWaitTime: 3,
      operatingHours: '24/7',
      requirements: ['Paiement du péage'],
      isPassed: false,
    },
    {
      id: 'checkpoint-police-2',
      type: 'police',
      name: 'Contrôle Police Yaoundé Entrée',
      location: {
        lat: 3.85,
        lng: 11.48,
        address: 'Entrée de Yaoundé',
      },
      averageWaitTime: 12,
      currentWaitTime: 15,
      operatingHours: '06:00 - 22:00',
      requirements: ['Permis de conduire', 'Carte grise', 'Assurance', 'Lettre de transport'],
      isPassed: false,
    },
  ];
}

// Generate predictive ETA
function generatePredictiveETA(): PredictiveETA {
  const now = new Date();
  const baseMinutes = 120; // 2 hours base
  const delayMinutes = 25; // total delays

  return {
    baseETA: new Date(now.getTime() + baseMinutes * 60000).toISOString(),
    currentETA: new Date(now.getTime() + (baseMinutes + delayMinutes) * 60000).toISOString(),
    optimisticETA: new Date(now.getTime() + (baseMinutes + 10) * 60000).toISOString(),
    pessimisticETA: new Date(now.getTime() + (baseMinutes + 40) * 60000).toISOString(),
    confidence: 78,
    delayRisk: {
      probability: 75,
      primaryReasons: [
        {
          reason: 'Pluie légère sur le trajet',
          impact: 10,
          probability: 80,
        },
        {
          reason: "Contrôle police à Yaoundé (temps d'attente actuel: 15 min)",
          impact: 15,
          probability: 90,
        },
      ],
      totalEstimatedDelay: 25,
    },
    factors: [
      {
        type: 'weather',
        description: 'Pluie légère - Ralentissement du trafic',
        impact: 'negative',
        impactMinutes: 10,
      },
      {
        type: 'checkpoint',
        description: 'Contrôle police à venir - Attente prévue',
        impact: 'negative',
        impactMinutes: 15,
      },
      {
        type: 'traffic',
        description: 'Trafic fluide sur la dernière partie',
        impact: 'positive',
        impactMinutes: -5,
      },
      {
        type: 'driver',
        description: 'Chauffeur expérimenté (note 4.7/5)',
        impact: 'positive',
        impactMinutes: -5,
      },
    ],
  };
}

// Generate driver proximity data
function generateDriverProximity(): DriverProximity {
  const distanceMeters = 15000; // 15 km
  return {
    distanceToDestination: distanceMeters,
    estimatedArrivalMinutes: 22,
    isNearby: false,
    isApproaching: true, // within 5km threshold
    currentSpeed: 65,
    lastLocationUpdate: new Date().toISOString(),
    bearing: 95, // heading East
  };
}

// Generate enhanced alerts
function generateEnhancedAlerts(): TrackingAlert[] {
  return [
    {
      id: 'alert-delay-weather',
      type: 'weather',
      severity: 'warning',
      title: '🌧️ Pluie sur le trajet',
      message:
        'Pluie légère détectée. Le chauffeur ralentit pour la sécurité. Retard estimé: 10 minutes.',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      estimatedDelay: 10,
      delayProbability: 80,
      location: {
        lat: 3.9,
        lng: 10.7,
        name: 'Route N3 - Km 145',
      },
      icon: '🌧️',
      isRead: false,
      canDismiss: true,
    },
    {
      id: 'alert-approaching',
      type: 'delivery_soon',
      severity: 'info',
      title: '🚚 Votre livreur approche',
      message: 'Votre colis sera livré dans environ 22 minutes. Distance restante: 15 km',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      icon: '🚚',
      isRead: false,
      canDismiss: true,
    },
    {
      id: 'alert-checkpoint-ahead',
      type: 'checkpoint',
      severity: 'info',
      title: '🚧 Contrôle routier à venir',
      message: "Contrôle Police Yaoundé Entrée - Temps d'attente actuel: 15 min",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      estimatedDelay: 15,
      location: {
        lat: 3.85,
        lng: 11.48,
        name: 'Contrôle Police Yaoundé Entrée',
      },
      icon: '🚧',
      isRead: false,
      canDismiss: true,
    },
  ];
}

// Generate enhanced history with more detail
function generateEnhancedHistory(): TrackingPoint[] {
  return [
    {
      lat: 4.0511,
      lng: 9.7679,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'TSA Douala Hub, Boulevard de la Liberté',
      city: 'Douala',
      country: 'Cameroon',
      speed: 0,
      batteryLevel: 100,
      eventDescription: '📦 Colis récupéré et chargé dans le véhicule',
    },
    {
      lat: 4.0234,
      lng: 9.8123,
      timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Sortie de Douala - Route N3',
      city: 'Douala',
      country: 'Cameroon',
      speed: 45,
      batteryLevel: 96,
      eventDescription: '🚚 Départ vers Yaoundé',
    },
    {
      lat: 3.8,
      lng: 10.135,
      timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Route Nationale N3, Edéa',
      city: 'Edéa',
      country: 'Cameroon',
      speed: 50,
      batteryLevel: 89,
      eventDescription: "✅ Passage contrôle police Edéa (8 min d'attente)",
    },
    {
      lat: 3.85,
      lng: 10.4,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Route N3 - Km 95',
      city: 'En route',
      country: 'Cameroon',
      speed: 65,
      batteryLevel: 84,
      eventDescription: '🚚 En cours de livraison',
    },
    {
      lat: 3.9,
      lng: 10.7,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Route N3 - Km 145',
      city: 'En route',
      country: 'Cameroon',
      speed: 40,
      batteryLevel: 78,
      eventDescription: '🌧️ Pluie légère - Vitesse réduite pour la sécurité',
    },
    {
      lat: 3.95,
      lng: 10.85,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Route N3 - Km 165',
      city: 'En route',
      country: 'Cameroon',
      speed: 65,
      batteryLevel: 72,
      eventDescription: '☀️ Conditions météo améliorées - Vitesse normale',
    },
  ];
}

// Enhanced mock shipment with all omniscient features
export const enhancedMockShipment: ShipmentDetails = {
  trackingNumber: 'TSA2025001234',
  status: 'in_transit',

  origin: {
    name: 'TSA Douala Hub',
    address: '123 Boulevard de la Liberté',
    city: 'Douala',
    country: 'Cameroon',
    coordinates: {
      lat: 4.0511,
      lng: 9.7679,
    },
  },

  destination: {
    name: 'Centre Commercial Bastos',
    address: '45 Avenue Charles de Gaulle',
    city: 'Yaoundé',
    country: 'Cameroon',
    coordinates: {
      lat: 3.8667,
      lng: 11.5167,
    },
  },

  currentLocation: {
    lat: 3.95,
    lng: 10.85,
    address: 'Route Nationale N3, Km 165',
    timestamp: new Date().toISOString(),
  },

  estimatedDelivery: {
    earliest: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    latest: new Date(Date.now() + 2.7 * 60 * 60 * 1000).toISOString(),
    confidence: 78,
  },

  carrier: {
    name: 'TSA Logistics',
    contact: '+237 233 42 00 00',
    vehicle: 'Mercedes-Benz Sprinter',
    driver: {
      name: 'Jean-Paul Mbarga',
      phone: '+237 677 89 45 23',
      rating: 4.7,
    },
  },

  history: generateEnhancedHistory(),
  route: generateEnhancedRoute(),
  alerts: generateEnhancedAlerts(),

  packageInfo: {
    weight: 25.5,
    dimensions: {
      length: 80,
      width: 60,
      height: 40,
    },
    description: 'Équipement électronique et accessoires',
    value: 450000,
    items: [
      {
        description: 'Ordinateur portable Dell XPS 15',
        quantity: 1,
        value: 350000,
      },
      {
        description: 'Accessoires informatiques',
        quantity: 3,
        value: 100000,
      },
    ],
  },

  lastUpdated: new Date().toISOString(),
  estimatedRouteDuration: 14400, // 4 hours
  distanceTraveled: 182000, // 182 km
  distanceRemaining: 68000, // 68 km
  progress: 73,
  speed: 65,

  nextCheckpoint: {
    name: 'Contrôle Police Yaoundé Entrée',
    type: 'customs',
    estimatedArrival: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
    address: 'Entrée de Yaoundé',
    contact: '+237 222 23 45 67',
  },

  // Enhanced omniscient features
  predictiveETA: generatePredictiveETA(),
  driverProximity: generateDriverProximity(),
  currentWeather: {
    condition: 'clear',
    description: 'Temps clair',
    temperature: 26,
    feelsLike: 27,
    windSpeed: 10,
    windDirection: 90,
    precipitation: 0,
    humidity: 60,
    visibility: 12,
    uvIndex: 8,
    icon: '☀️',
    riskLevel: 'low',
    impactOnDelivery: 'Conditions optimales',
  },
  currentTraffic: {
    severity: 'light',
    speedKmh: 65,
    averageSpeedKmh: 70,
    delayMinutes: 2,
    alternativeRoutesAvailable: false,
  },
  roadCheckpoints: generateRoadCheckpoints(),
};

// Database with enhanced shipments
export const enhancedMockShipmentsDatabase: Record<string, ShipmentDetails> = {
  TSA2025001234: enhancedMockShipment,
};
