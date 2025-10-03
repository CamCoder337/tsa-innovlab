import type { ShipmentDetails } from '@/types/tracking.types';
import type { PositionUpdate } from '@/services/tracking.service';

// Données de test pour Yaoundé, Cameroun
export const MOCK_TRACKING_DATA: ShipmentDetails = {
  trackingNumber: 'TSA-2024-001',
  status: 'in_transit',
  origin: {
    name: 'Entrepôt TSA Douala',
    address: 'Zone Industrielle Bassa, Douala',
    city: 'Douala',
    country: 'Cameroun',
    coordinates: {
      lat: 4.0511,
      lng: 9.7679,
    },
  },
  destination: {
    name: 'Client Yaoundé Centre',
    address: 'Avenue Kennedy, Centre-ville',
    city: 'Yaoundé',
    country: 'Cameroun',
    coordinates: {
      lat: 3.848,
      lng: 11.5021,
    },
  },
  currentLocation: {
    lat: 4.2634,
    lng: 10.4089,
    address: 'Edéa, Région du Centre',
    timestamp: new Date().toISOString(),
  },
  estimatedDelivery: {
    earliest: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2h
    latest: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // +4h
    confidence: 85,
  },
  carrier: {
    name: 'TSA Logistics',
    contact: '+237 6XX XXX XXX',
    vehicle: 'Camion Mercedes Actros - CM-1234-AB',
    driver: {
      name: 'Jean-Paul Mbarga',
      phone: '+237 6XX XXX XXX',
      rating: 4.8,
      photo:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
  },
  history: [
    {
      lat: 4.0511,
      lng: 9.7679,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Douala - Départ entrepôt',
      eventDescription: 'Colis chargé et départ confirmé',
    },
    {
      lat: 4.1547,
      lng: 9.9348,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Sortie Douala',
      eventDescription: 'Passage checkpoint sortie ville',
    },
    {
      lat: 4.2634,
      lng: 10.4089,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      address: 'Edéa',
      eventDescription: 'Arrêt technique - Contrôle véhicule',
    },
  ],
  route: [
    {
      id: 'segment-1',
      start: {
        lat: 4.0511,
        lng: 9.7679,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      end: {
        lat: 4.2634,
        lng: 10.4089,
        timestamp: new Date().toISOString(),
      },
      distance: 85000, // 85km
      duration: 3600, // 1h
      terrainType: 'highway',
      roadQuality: 'good',
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      type: 'traffic',
      severity: 'warning',
      title: 'Trafic Dense',
      message: 'Embouteillages signalés sur la route Edéa-Yaoundé. Retard estimé: 30 minutes.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      estimatedDelay: 30,
      isRead: false,
      canDismiss: true,
    },
  ],
  packageInfo: {
    weight: 150,
    dimensions: {
      length: 120,
      width: 80,
      height: 60,
    },
    description: 'Équipements électroniques',
    value: 2500000, // 2.5M FCFA
    items: [
      {
        description: 'Ordinateurs portables',
        quantity: 5,
        value: 1500000,
      },
      {
        description: 'Imprimantes',
        quantity: 2,
        value: 500000,
      },
      {
        description: 'Accessoires divers',
        quantity: 1,
        value: 500000,
      },
    ],
  },
  lastUpdated: new Date().toISOString(),
  estimatedRouteDuration: 14400, // 4h
  distanceTraveled: 85000, // 85km
  distanceRemaining: 165000, // 165km
  progress: 34, // 34%
  speed: 65, // 65 km/h
  nextCheckpoint: {
    name: 'Poste de contrôle Mbalmayo',
    type: 'customs',
    estimatedArrival: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    address: 'Mbalmayo, Route Nationale N°2',
    contact: '+237 6XX XXX XXX',
  },
};

// Véhicules simulés pour la carte
export const MOCK_VEHICLES: Array<{
  id: string;
  position: { lat: number; lng: number };
  speed: number;
  bearing: number;
  batteryLevel: number;
  driver: string;
  status: 'active' | 'inactive' | 'maintenance';
}> = [
  {
    id: 'vehicle-001',
    position: { lat: 4.2634, lng: 10.4089 },
    speed: 65,
    bearing: 45,
    batteryLevel: 78,
    driver: 'Jean-Paul Mbarga',
    status: 'active',
  },
  {
    id: 'vehicle-002',
    position: { lat: 3.9547, lng: 11.3489 },
    speed: 0,
    bearing: 0,
    batteryLevel: 92,
    driver: 'Marie Nguema',
    status: 'inactive',
  },
  {
    id: 'vehicle-003',
    position: { lat: 4.1234, lng: 9.8567 },
    speed: 45,
    bearing: 180,
    batteryLevel: 45,
    driver: 'Paul Essomba',
    status: 'active',
  },
];

// Destinations communes
export const MOCK_DESTINATIONS = [
  {
    id: 'dest-1',
    name: 'Centre Commercial Yaoundé',
    position: { lat: 3.848, lng: 11.5021 },
    type: 'delivery_point' as const,
  },
  {
    id: 'dest-2',
    name: 'Port de Douala',
    position: { lat: 4.0511, lng: 9.7679 },
    type: 'warehouse' as const,
  },
  {
    id: 'dest-3',
    name: 'Aéroport Nsimalen',
    position: { lat: 3.7222, lng: 11.5533 },
    type: 'distribution_center' as const,
  },
];

// Fonction pour simuler des mises à jour de position
export function generateMockPositionUpdate(vehicleId: string): PositionUpdate {
  const vehicle = MOCK_VEHICLES.find((v) => v.id === vehicleId);
  if (!vehicle) {
    throw new Error(`Vehicle ${vehicleId} not found`);
  }

  // Simuler un petit déplacement
  const latOffset = (Math.random() - 0.5) * 0.001; // ~100m
  const lngOffset = (Math.random() - 0.5) * 0.001;

  return {
    vehicleId,
    position: {
      lat: vehicle.position.lat + latOffset,
      lng: vehicle.position.lng + lngOffset,
    },
    speed: vehicle.speed + (Math.random() - 0.5) * 10,
    bearing: vehicle.bearing + (Math.random() - 0.5) * 20,
    accuracy: 5 + Math.random() * 10,
    batteryLevel: Math.max(0, vehicle.batteryLevel - Math.random() * 2),
    timestamp: new Date().toISOString(),
  };
}

// Configuration par défaut pour les tests
export const DEFAULT_MAP_CONFIG = {
  center: { lat: 4.0511, lng: 9.7679 }, // Douala
  zoom: 8,
};

export const CAMEROON_BOUNDS = {
  north: 13.0833,
  south: 1.6667,
  east: 16.1833,
  west: 8.5,
};
