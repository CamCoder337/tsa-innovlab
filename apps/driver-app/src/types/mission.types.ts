/**
 * Types pour les missions des chauffeurs
 */

export enum MissionStatus {
  // eslint-disable-next-line no-unused-vars
  ASSIGNED = 'assigned', // Mission assignée au chauffeur
  // eslint-disable-next-line no-unused-vars
  ACCEPTED = 'accepted', // Acceptée par le chauffeur
  // eslint-disable-next-line no-unused-vars
  EN_ROUTE_PICKUP = 'en_route_pickup', // En route vers le pickup
  // eslint-disable-next-line no-unused-vars
  ARRIVED_PICKUP = 'arrived_pickup', // Arrivé au pickup
  // eslint-disable-next-line no-unused-vars
  LOADED = 'loaded', // Colis chargé
  // eslint-disable-next-line no-unused-vars
  EN_ROUTE_DELIVERY = 'en_route_delivery', // En route vers livraison
  // eslint-disable-next-line no-unused-vars
  ARRIVED_DELIVERY = 'arrived_delivery', // Arrivé à destination
  // eslint-disable-next-line no-unused-vars
  DELIVERED = 'delivered', // Livré avec succès
  // eslint-disable-next-line no-unused-vars
  FAILED = 'failed', // Échec de livraison
  // eslint-disable-next-line no-unused-vars
  CANCELLED = 'cancelled', // Annulé
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
  pickupTime: Date | string;

  // Informations de livraison
  delivery: Location;
  deliveryTime: Date | string;

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
    email?: string;
  };

  // Instructions spéciales
  specialInstructions?: string;

  // Raison d'annulation
  cancellationReason?: string;

  // Preuve de livraison
  proofOfDelivery?: {
    photo: string;
    signature: string;
    recipientName: string;
    notes?: string;
    deliveredAt: Date | string;
  };

  // Suivi
  progress: number; // Pourcentage de progression
  currentLocation?: Location;

  // Métadonnées
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SOSAlert {
  missionId: string;
  location: Location;
  timestamp: Date;
  type: 'accident' | 'breakdown' | 'security' | 'other';
  description?: string;
  isResolved: boolean;
}
