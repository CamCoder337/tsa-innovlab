import { Mission, MissionStatus } from '../types/mission.types';

/**
 * Mock data pour les missions des chauffeurs
 * Données réalistes basées sur des villes du Cameroun
 */
export const mockMissions: Mission[] = [
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
      latitude: 3.8480,
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
    status: MissionStatus.EN_ROUTE_DELIVERY,
    pickup: {
      latitude: 3.8480,
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
    estimatedDuration: 300, // 5 heures
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
    status: MissionStatus.PENDING,
    pickup: {
      latitude: 4.0511,
      longitude: 9.7679,
      address: 'Zone Industrielle, Bonabéri',
      city: 'Douala',
    },
    delivery: {
      latitude: 4.1560,
      longitude: 9.2455,
      address: 'Port de Limbé',
      city: 'Limbé',
    },
    pickupTime: new Date('2025-11-17T06:00:00'),
    deliveryTime: new Date('2025-11-17T09:30:00'),
    description: 'Livraison de pièces détachées automobiles',
    cargoType: 'Pièces automobiles',
    weight: 350,
    estimatedDuration: 210, // 3h30
    distance: 75,
    shipper: {
      name: 'Emmanuel Fotso',
      phone: '+237 696 77 88 99',
      company: 'AutoParts Cameroun',
    },
    recipient: {
      name: 'David Ebogo',
      phone: '+237 677 22 33 44',
    },
    specialInstructions: 'Vérifier toutes les pièces avant signature du BL',
    progress: 0,
    createdAt: new Date('2025-11-16T12:00:00'),
    updatedAt: new Date('2025-11-16T12:00:00'),
  },
  {
    id: '4',
    missionNumber: 'TSA-M-2025-004',
    status: MissionStatus.COMPLETED,
    pickup: {
      latitude: 4.0511,
      longitude: 9.7679,
      address: 'Carrefour Bessengue',
      city: 'Douala',
    },
    delivery: {
      latitude: 4.1548,
      longitude: 9.2765,
      address: 'Quartier Administratif',
      city: 'Buea',
    },
    pickupTime: new Date('2025-11-15T07:00:00'),
    deliveryTime: new Date('2025-11-15T11:00:00'),
    description: 'Documents administratifs urgents',
    cargoType: 'Documents',
    weight: 15,
    estimatedDuration: 180, // 3 heures
    distance: 70,
    shipper: {
      name: 'Claire Atangana',
      phone: '+237 655 99 00 11',
      company: 'Ministère du Commerce',
    },
    recipient: {
      name: 'Thomas Ndongo',
      phone: '+237 699 22 33 44',
    },
    progress: 100,
    createdAt: new Date('2025-11-14T16:00:00'),
    updatedAt: new Date('2025-11-15T11:30:00'),
  },
];

/**
 * Fonction utilitaire pour obtenir les missions en cours
 */
export const getActiveMissions = (): Mission[] => {
  return mockMissions.filter(
    (m) =>
      m.status === MissionStatus.IN_PROGRESS || m.status === MissionStatus.PENDING
  );
};

/**
 * Fonction utilitaire pour obtenir l'historique des missions
 */
export const getCompletedMissions = (): Mission[] => {
  return mockMissions.filter(
    (m) =>
      m.status === MissionStatus.COMPLETED || m.status === MissionStatus.CANCELLED
  );
};

/**
 * Fonction utilitaire pour obtenir une mission par ID
 */
export const getMissionById = (id: string): Mission | undefined => {
  return mockMissions.find((m) => m.id === id);
};
