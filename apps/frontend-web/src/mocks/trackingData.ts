import type {
  ShipmentDetails,
  TrackingPoint,
  RouteSegment,
  TrackingAlert,
} from '@/types/tracking.types';

// Mock tracking data for development
export const mockShipmentDetails: ShipmentDetails = {
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
    address: "Route Nationale N3, près d'Edéa",
    timestamp: new Date().toISOString(),
  },

  estimatedDelivery: {
    earliest: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    latest: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
    confidence: 85,
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

  history: [
    {
      lat: 4.0511,
      lng: 9.7679,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'TSA Douala Hub',
      city: 'Douala',
      country: 'Cameroon',
      speed: 0,
      batteryLevel: 100,
      eventDescription: 'Colis récupéré et chargé',
    },
    {
      lat: 4.0234,
      lng: 9.8123,
      timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Sortie de Douala',
      city: 'Douala',
      country: 'Cameroon',
      speed: 45,
      batteryLevel: 95,
      eventDescription: 'En route vers Yaoundé',
    },
    {
      lat: 3.8,
      lng: 10.135,
      timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Edéa',
      city: 'Edéa',
      country: 'Cameroon',
      speed: 50,
      batteryLevel: 88,
      eventDescription: 'Passage par Edéa',
    },
    {
      lat: 3.95,
      lng: 10.85,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Route Nationale N3',
      city: 'En route',
      country: 'Cameroon',
      speed: 55,
      batteryLevel: 75,
      eventDescription: 'Position actuelle',
    },
  ] as TrackingPoint[],

  route: [
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
      distance: 87000, // 87 km
      duration: 5400, // 1.5 hours
      trafficDelay: 300, // 5 minutes
      weatherConditions: {
        condition: 'partly_cloudy',
        description: 'Partly cloudy with light breeze',
        temperature: 28,
        feelsLike: 30,
        windSpeed: 12,
        windDirection: 145,
        precipitation: 0,
        humidity: 65,
        visibility: 10,
        uvIndex: 7,
        icon: 'partly-cloudy',
        riskLevel: 'moderate',
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
        lat: 3.8667,
        lng: 11.5167,
        timestamp: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      },
      distance: 158000, // 158 km
      duration: 10800, // 3 hours
      trafficDelay: 600, // 10 minutes expected
      weatherConditions: {
        condition: 'clear',
        description: 'Clear skies with light wind',
        temperature: 26,
        feelsLike: 27,
        windSpeed: 8,
        windDirection: 120,
        precipitation: 0,
        humidity: 60,
        visibility: 15,
        uvIndex: 8,
        icon: 'clear-day',
        riskLevel: 'low',
      },
      terrainType: 'rural',
      roadQuality: 'fair',
    },
  ] satisfies RouteSegment[],

  alerts: [
    {
      type: 'checkpoint',
      severity: 'info',
      message: "Le colis a passé le point de contrôle d'Edéa",
      timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      location: {
        lat: 3.8,
        lng: 10.135,
        name: 'Edéa Checkpoint',
      },
      actionRequired: false,
    },
    {
      type: 'delay',
      severity: 'warning',
      message: 'Léger retard dû au trafic routier',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      estimatedDelay: 15,
      location: {
        lat: 3.9,
        lng: 10.5,
      },
      actionRequired: false,
    },
  ] as TrackingAlert[],

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
  estimatedRouteDuration: 16200, // 4.5 hours total
  distanceTraveled: 145000, // 145 km traveled
  distanceRemaining: 100000, // 100 km remaining
  progress: 59, // 59% complete
  speed: 55, // current speed in km/h

  nextCheckpoint: {
    name: 'Centre de Distribution Yaoundé',
    type: 'distribution_center',
    estimatedArrival: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
    address: '12 Rue de Bastos, Yaoundé',
    contact: '+237 222 23 45 67',
  },
};

// Generate multiple mock shipments with different statuses
export const generateMockShipment = (
  trackingNumber: string,
  status?: ShipmentDetails['status']
): ShipmentDetails => {
  const baseShipment = { ...mockShipmentDetails };
  baseShipment.trackingNumber = trackingNumber;

  if (status) {
    baseShipment.status = status;

    // Adjust data based on status
    switch (status) {
      case 'delivered':
        baseShipment.currentLocation = {
          ...baseShipment.destination.coordinates,
          address: baseShipment.destination.address,
          timestamp: new Date().toISOString(),
        };
        baseShipment.progress = 100;
        baseShipment.distanceRemaining = 0;
        baseShipment.speed = 0;
        baseShipment.estimatedDelivery = {
          earliest: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          latest: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          confidence: 100,
        };
        break;

      case 'exception':
        baseShipment.alerts = [
          ...baseShipment.alerts,
          {
            type: 'custom',
            severity: 'critical',
            message: 'Problème détecté avec la livraison',
            timestamp: new Date().toISOString(),
            actionRequired: true,
            actionLabel: 'Contacter le support',
            actionUrl: '/support',
          } as TrackingAlert,
        ];
        break;

      case 'delayed':
        baseShipment.progress = 95;
        baseShipment.distanceRemaining = 5000; // 5 km
        baseShipment.currentLocation = {
          lat: 3.85,
          lng: 11.5,
          address: 'Près de Bastos, Yaoundé',
          timestamp: new Date().toISOString(),
        };
        break;
    }
  }

  return baseShipment;
};

// Mock database of shipments
export const mockShipmentsDatabase: Record<string, ShipmentDetails> = {
  TSA2025001234: mockShipmentDetails,
  TSA2025001235: generateMockShipment('TSA2025001235', 'delivered'),
  TSA2025001236: generateMockShipment('TSA2025001236', 'delayed'),
  TSA2025001237: generateMockShipment('TSA2025001237', 'exception'),
};
