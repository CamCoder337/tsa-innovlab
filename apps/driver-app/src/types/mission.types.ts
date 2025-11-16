/**
 * Types pour les missions des chauffeurs
 */

export enum MissionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

export interface Mission {
  id: string;
  missionNumber: string;
  status: MissionStatus;

  // Informations de pickup
  pickup: Location;
  pickupTime: Date;

  // Informations de livraison
  delivery: Location;
  deliveryTime: Date;

  // Détails de la mission
  description: string;
  cargoType: string;
  weight: number; // en kg
  estimatedDuration: number; // en minutes
  distance: number; // en km

  // Affreteur (client)
  shipper: {
    name: string;
    phone: string;
    company: string;
  };

  // Destinataire
  recipient: {
    name: string;
    phone: string;
  };

  // Instructions spéciales
  specialInstructions?: string;

  // Tracking
  currentLocation?: Location;
  progress: number; // 0-100%

  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
}

export interface SOSAlert {
  missionId: string;
  location: Location;
  timestamp: Date;
  type: 'accident' | 'breakdown' | 'security' | 'other';
  description?: string;
  isResolved: boolean;
}
