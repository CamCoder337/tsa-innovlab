import { Mission, MissionStatus } from '../types/mission.types';

/**
 * Mock data pour les missions des chauffeurs
 * Données réalistes basées sur des villes du Cameroun
 */
// Tableau pour stocker les missions en mémoire
let missions: Mission[] = [
  {
    id: '1',
    missionNumber: 'TSA-M-2025-001',
    status: MissionStatus.ASSIGNED,
    pickup: {
      latitude: 4.0511,
      longitude: 9.7679,
      address: 'Rue de la Réunification, Akwa',
      city: 'Douala',
    },
    delivery: {
      latitude: 3.848,
      longitude: 11.5021,
      address: 'Avenue Kennedy, Centre Ville',
      city: 'Yaoundé',
    },
    pickupTime: new Date('2025-11-16T08:00:00'),
    deliveryTime: new Date('2025-11-16T13:00:00'),
    description: 'Livraison de matériel électronique',
    cargoType: 'Électronique',
    weight: 250,
    estimatedDuration: 240,
    distance: 245,
    shipper: {
      name: 'Jean Mbarga',
      phone: '+237 677 12 34 56',
      company: 'TechDistrib SARL',
    },
    recipient: {
      name: 'Marie Nguema',
      phone: '+237 699 87 65 43',
    },
    specialInstructions: 'Fragile - Manipuler avec précaution. Appeler 30min avant arrivée.',
    progress: 0,
    createdAt: new Date('2025-11-15T18:00:00'),
    updatedAt: new Date('2025-11-16T10:30:00'),
  },
  {
    id: '2',
    missionNumber: 'TSA-M-2025-002',
    status: MissionStatus.ASSIGNED,
    pickup: {
      latitude: 3.848,
      longitude: 11.5021,
      address: 'Marché Central, Mfoundi',
      city: 'Yaoundé',
    },
    delivery: {
      latitude: 5.9631,
      longitude: 10.1591,
      address: 'Quartier Commercial, Bamenda',
      city: 'Bamenda',
    },
    pickupTime: new Date('2025-11-16T14:00:00'),
    deliveryTime: new Date('2025-11-16T19:00:00'),
    description: 'Transport de produits alimentaires secs',
    cargoType: 'Denrées alimentaires',
    weight: 480,
    estimatedDuration: 300,
    distance: 370,
    shipper: {
      name: 'Paul Tchoumba',
      phone: '+237 650 11 22 33',
      company: 'AgroDistrib',
    },
    recipient: {
      name: 'Samuel Nkeng',
      phone: '+237 677 44 55 66',
    },
    progress: 0,
    createdAt: new Date('2025-11-16T08:00:00'),
    updatedAt: new Date('2025-11-16T08:00:00'),
  },
  {
    id: '3',
    missionNumber: 'TSA-M-2025-003',
    status: MissionStatus.ASSIGNED,
    pickup: {
      latitude: 4.0511,
      longitude: 9.7679,
      address: 'Zone Industrielle, Bonabéri',
      city: 'Douala',
    },
    delivery: {
      latitude: 4.156,
      longitude: 9.2455,
      address: 'Port de Limbé',
      city: 'Limbé',
    },
    pickupTime: new Date('2025-11-17T06:00:00'),
    deliveryTime: new Date('2025-11-17T09:30:00'),
    description: 'Livraison de pièces détachées automobiles',
    cargoType: 'Pièces automobiles',
    weight: 320,
    estimatedDuration: 210,
    distance: 180,
    shipper: {
      name: 'AutoParts Plus',
      phone: '+237 677 99 88 77',
      company: 'AutoParts Plus',
    },
    recipient: {
      name: 'Garage Central',
      phone: '+237 699 11 22 33',
    },
    specialInstructions: "Livraison à l'entrepôt arrière",
    progress: 0,
    createdAt: new Date('2025-11-16T10:00:00'),
    updatedAt: new Date('2025-11-16T10:00:00'),
  },
  {
    id: '4',
    missionNumber: 'TSA-M-2025-004',
    status: MissionStatus.DELIVERED,
    pickup: {
      latitude: 4.0511,
      longitude: 9.7679,
      address: 'Aéroport International de Douala',
      city: 'Douala',
    },
    delivery: {
      latitude: 3.848,
      longitude: 11.5021,
      address: 'Hilton Yaoundé',
      city: 'Yaoundé',
    },
    pickupTime: new Date('2025-11-15T10:00:00'),
    deliveryTime: new Date('2025-11-15T14:30:00'),
    description: 'Transport de passagers VIP',
    cargoType: 'Passagers',
    weight: 0,
    estimatedDuration: 240,
    distance: 245,
    shipper: {
      name: 'Aéroport de Douala',
      phone: '+237 677 00 11 22',
      company: 'Aéroport International de Douala',
    },
    recipient: {
      name: 'Hilton Yaoundé',
      phone: '+237 222 23 05 55',
    },
    specialInstructions: "Accueillir les passagers avec des bouteilles d'eau",
    progress: 100,
    proofOfDelivery: {
      photo: 'https://example.com/proofs/photo-4.jpg',
      signature: 'https://example.com/signatures/signature-4.png',
      recipientName: 'Réception Hilton',
      notes: 'Livraison effectuée à 14h15',
      deliveredAt: new Date('2025-11-15T14:15:00').toISOString(),
    },
    createdAt: new Date('2025-11-14T15:00:00'),
    updatedAt: new Date('2025-11-15T14:15:00'),
  },
  {
    id: '5',
    missionNumber: 'TSA-M-2025-005',
    status: MissionStatus.CANCELLED,
    pickup: {
      latitude: 3.8667,
      longitude: 11.5167,
      address: 'Carrefour Etoa-Meki',
      city: 'Yaoundé',
    },
    delivery: {
      latitude: 5.4667,
      longitude: 10.4167,
      address: 'Marché Central',
      city: 'Bafoussam',
    },
    pickupTime: new Date('2025-11-14T16:00:00'),
    deliveryTime: new Date('2025-11-14T20:00:00'),
    description: 'Transport de marchandises diverses',
    cargoType: 'Divers',
    weight: 150,
    estimatedDuration: 240,
    distance: 280,
    shipper: {
      name: 'Entreprise Générale',
      phone: '+237 677 33 44 55',
      company: 'Entreprise Générale SARL',
    },
    recipient: {
      name: 'Boutique Moderne',
      phone: '+237 699 77 66 55',
    },
    cancellationReason: 'Annulée par le client',
    progress: 0,
    createdAt: new Date('2025-11-13T09:00:00'),
    updatedAt: new Date('2025-11-13T15:30:00'),
  },
];

/**
 * Fonction utilitaire pour obtenir les missions en cours
 */
export const getActiveMissions = (): Mission[] => {
  return missions.filter(
    (mission) =>
      mission.status === MissionStatus.ASSIGNED ||
      mission.status === MissionStatus.ACCEPTED ||
      mission.status === MissionStatus.EN_ROUTE_PICKUP ||
      mission.status === MissionStatus.ARRIVED_PICKUP ||
      mission.status === MissionStatus.LOADED ||
      mission.status === MissionStatus.EN_ROUTE_DELIVERY ||
      mission.status === MissionStatus.ARRIVED_DELIVERY
  );
};

/**
 * Fonction utilitaire pour obtenir l'historique des missions
 */
export const getCompletedMissions = (): Mission[] => {
  return missions.filter(
    (mission) =>
      mission.status === MissionStatus.DELIVERED ||
      mission.status === MissionStatus.CANCELLED ||
      mission.status === MissionStatus.FAILED
  );
};

/**
 * Fonction utilitaire pour obtenir une mission par ID
 */
export const getMissionById = (id: string): Mission | undefined => {
  return missions.find((mission) => mission.id === id);
};

/**
 * Fonction pour mettre à jour une mission
 */
export const updateMission = (updatedMission: Mission): Mission | undefined => {
  const index = missions.findIndex((m) => m.id === updatedMission.id);
  if (index !== -1) {
    missions[index] = {
      ...missions[index],
      ...updatedMission,
      updatedAt: new Date().toISOString(),
    };
    return missions[index];
  }
  return undefined;
};

/**
 * Fonction pour obtenir toutes les missions
 */
export const getAllMissions = (): Mission[] => {
  return [...missions];
};

/**
 * Réinitialiser les missions (pour les tests)
 */
export const resetMissions = (): void => {
  missions = [...mockMissionsData];
};

/**
 * Données de base des missions (lecture seule)
 */
const mockMissionsData: Mission[] = [
  {
    id: '1',
    missionNumber: 'TSA-M-2025-001',
    status: MissionStatus.ASSIGNED,
    pickup: {
      latitude: 4.0511,
      longitude: 9.7679,
      address: 'Rue de la Réunification, Akwa',
      city: 'Douala',
    },
    delivery: {
      latitude: 3.848,
      longitude: 11.5021,
      address: 'Avenue Kennedy, Centre Ville',
      city: 'Yaoundé',
    },
    pickupTime: new Date('2025-11-16T08:00:00'),
    deliveryTime: new Date('2025-11-16T13:00:00'),
    description: 'Livraison de matériel électronique',
    cargoType: 'Électronique',
    weight: 250,
    estimatedDuration: 240,
    distance: 245,
    shipper: {
      name: 'Jean Mbarga',
      phone: '+237 677 12 34 56',
      company: 'TechDistrib SARL',
    },
    recipient: {
      name: 'Marie Nguema',
      phone: '+237 699 87 65 43',
    },
    specialInstructions: 'Fragile - Manipuler avec précaution. Appeler 30min avant arrivée.',
    progress: 0,
    createdAt: new Date('2025-11-15T18:00:00'),
    updatedAt: new Date('2025-11-16T10:30:00'),
  },
  {
    id: '2',
    missionNumber: 'TSA-M-2025-002',
    status: MissionStatus.ASSIGNED,
    pickup: {
      latitude: 3.848,
      longitude: 11.5021,
      address: 'Marché Central, Mfoundi',
      city: 'Yaoundé',
    },
    delivery: {
      latitude: 5.9631,
      longitude: 10.1591,
      address: 'Quartier Commercial, Bamenda',
      city: 'Bamenda',
    },
    pickupTime: new Date('2025-11-16T14:00:00'),
    deliveryTime: new Date('2025-11-16T19:00:00'),
    description: 'Transport de produits alimentaires secs',
    cargoType: 'Denrées alimentaires',
    weight: 480,
    estimatedDuration: 300,
    distance: 370,
    shipper: {
      name: 'Paul Tchoumba',
      phone: '+237 650 11 22 33',
      company: 'AgroDistrib',
    },
    recipient: {
      name: 'Samuel Nkeng',
      phone: '+237 677 44 55 66',
    },
    progress: 0,
    createdAt: new Date('2025-11-16T08:00:00'),
    updatedAt: new Date('2025-11-16T08:00:00'),
  },
  {
    id: '3',
    missionNumber: 'TSA-M-2025-003',
    status: MissionStatus.ASSIGNED,
    pickup: {
      latitude: 4.0511,
      longitude: 9.7679,
      address: 'Zone Industrielle, Bonabéri',
      city: 'Douala',
    },
    delivery: {
      latitude: 4.156,
      longitude: 9.2455,
      address: 'Port de Limbé',
      city: 'Limbé',
    },
    pickupTime: new Date('2025-11-17T06:00:00'),
    deliveryTime: new Date('2025-11-17T09:30:00'),
    description: 'Livraison de pièces détachées automobiles',
    cargoType: 'Pièces automobiles',
    weight: 320,
    estimatedDuration: 210,
    distance: 180,
    shipper: {
      name: 'AutoParts Plus',
      phone: '+237 677 99 88 77',
      company: 'AutoParts Plus',
    },
    recipient: {
      name: 'Garage Central',
      phone: '+237 699 11 22 33',
    },
    specialInstructions: "Livraison à l'entrepôt arrière",
    progress: 0,
    createdAt: new Date('2025-11-16T10:00:00'),
    updatedAt: new Date('2025-11-16T10:00:00'),
  },
  {
    id: '4',
    missionNumber: 'TSA-M-2025-004',
    status: MissionStatus.DELIVERED,
    pickup: {
      latitude: 4.0511,
      longitude: 9.7679,
      address: 'Aéroport International de Douala',
      city: 'Douala',
    },
    delivery: {
      latitude: 3.848,
      longitude: 11.5021,
      address: 'Hilton Yaoundé',
      city: 'Yaoundé',
    },
    pickupTime: new Date('2025-11-15T10:00:00'),
    deliveryTime: new Date('2025-11-15T14:30:00'),
    description: 'Transport de passagers VIP',
    cargoType: 'Passagers',
    weight: 0,
    estimatedDuration: 240,
    distance: 245,
    shipper: {
      name: 'Aéroport de Douala',
      phone: '+237 677 00 11 22',
      company: 'Aéroport International de Douala',
    },
    recipient: {
      name: 'Hilton Yaoundé',
      phone: '+237 222 23 05 55',
    },
    specialInstructions: "Accueillir les passagers avec des bouteilles d'eau",
    progress: 100,
    proofOfDelivery: {
      photo: 'https://example.com/proofs/photo-4.jpg',
      signature: 'https://example.com/signatures/signature-4.png',
      recipientName: 'Réception Hilton',
      notes: 'Livraison effectuée à 14h15',
      deliveredAt: new Date('2025-11-15T14:15:00').toISOString(),
    },
    createdAt: new Date('2025-11-14T15:00:00'),
    updatedAt: new Date('2025-11-15T14:15:00'),
  },
  {
    id: '5',
    missionNumber: 'TSA-M-2025-005',
    status: MissionStatus.CANCELLED,
    pickup: {
      latitude: 3.8667,
      longitude: 11.5167,
      address: 'Carrefour Etoa-Meki',
      city: 'Yaoundé',
    },
    delivery: {
      latitude: 5.4667,
      longitude: 10.4167,
      address: 'Marché Central',
      city: 'Bafoussam',
    },
    pickupTime: new Date('2025-11-14T16:00:00'),
    deliveryTime: new Date('2025-11-14T20:00:00'),
    description: 'Transport de marchandises diverses',
    cargoType: 'Divers',
    weight: 150,
    estimatedDuration: 240,
    distance: 280,
    shipper: {
      name: 'Entreprise Générale',
      phone: '+237 677 33 44 55',
      company: 'Entreprise Générale SARL',
    },
    recipient: {
      name: 'Boutique Moderne',
      phone: '+237 699 77 66 55',
    },
    cancellationReason: 'Annulée par le client',
    progress: 0,
    createdAt: new Date('2025-11-13T09:00:00'),
    updatedAt: new Date('2025-11-13T15:30:00'),
  },
];

// Initialiser les missions avec les données de base
resetMissions();
