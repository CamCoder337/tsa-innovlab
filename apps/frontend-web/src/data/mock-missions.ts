import type { Mission } from '@/types/mission.types';

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'mission-1',
    affreteurId: 'affreteur-1',
    titre: 'Transport Électronique Douala-Yaoundé',
    description: "Transport d'ordinateurs portables pour TechCorp Cameroun",
    typeMarchandise: 'Électronique',
    poids: 250,
    volume: 2.5,
    dateDepartEstime: '2024-10-04T08:00:00Z',
    dateArriveePrevue: '2024-10-04T14:00:00Z',
    adresseDepartId: 'addr-douala-port',
    adresseArriveeId: 'addr-yaounde-centre',
    budgetMin: 140000,
    budgetMax: 160000,
    status: 'assigned',
    transporteurId: 'transporteur-1',
    isFlexibleDates: false,
    isFlexibleRoute: false,
    notesComplementaires: 'Matériel fragile - manipulation avec précaution',
    createdAt: '2024-10-03T10:00:00Z',
    updatedAt: '2024-10-03T12:00:00Z',
  },
  {
    id: 'mission-2',
    affreteurId: 'affreteur-2',
    titre: 'Transport Textile Yaoundé-Bafoussam',
    description: 'Vêtements de mode pour Fashion Store',
    typeMarchandise: 'Textile',
    poids: 180,
    volume: 3.2,
    dateDepartEstime: '2024-10-05T09:00:00Z',
    dateArriveePrevue: '2024-10-05T15:00:00Z',
    adresseDepartId: 'addr-yaounde-textile',
    adresseArriveeId: 'addr-bafoussam-centre',
    budgetMin: 80000,
    budgetMax: 90000,
    status: 'published',
    isFlexibleDates: true,
    isFlexibleRoute: false,
    createdAt: '2024-10-03T11:00:00Z',
    updatedAt: '2024-10-03T11:30:00Z',
  },
  {
    id: 'mission-3',
    affreteurId: 'affreteur-1',
    titre: 'Transport Médical Urgent Douala-Garoua',
    description: 'Équipements médicaux urgents pour hôpital régional',
    typeMarchandise: 'Médical',
    poids: 120,
    volume: 1.8,
    dateDepartEstime: '2024-10-04T06:00:00Z',
    dateArriveePrevue: '2024-10-04T16:00:00Z',
    adresseDepartId: 'addr-douala-medical',
    adresseArriveeId: 'addr-garoua-hopital',
    budgetMin: 200000,
    budgetMax: 240000,
    status: 'assigned',
    transporteurId: 'transporteur-2',
    isFlexibleDates: false,
    isFlexibleRoute: false,
    notesComplementaires: 'URGENT - Équipements critiques pour urgences médicales',
    createdAt: '2024-10-03T09:00:00Z',
    updatedAt: '2024-10-03T13:00:00Z',
  },
  {
    id: 'mission-4',
    affreteurId: 'affreteur-3',
    titre: 'Transport Alimentaire Yaoundé-Bamenda',
    description: 'Produits alimentaires périssables',
    typeMarchandise: 'Alimentaire',
    poids: 500,
    volume: 4.0,
    dateDepartEstime: '2024-10-06T05:00:00Z',
    dateArriveePrevue: '2024-10-06T12:00:00Z',
    adresseDepartId: 'addr-yaounde-marche',
    adresseArriveeId: 'addr-bamenda-depot',
    budgetMin: 120000,
    budgetMax: 140000,
    status: 'completed',
    transporteurId: 'transporteur-1',
    dateDebutReelle: '2024-10-06T05:15:00Z',
    dateFinReelle: '2024-10-06T11:45:00Z',
    ratingAffreteur: 5,
    commentaireAffreteur: 'Excellent service, livraison rapide et soignée',
    ratingTransporteur: 4,
    commentaireTransporteur: 'Client très organisé, chargement efficace',
    isFlexibleDates: false,
    isFlexibleRoute: true,
    createdAt: '2024-10-05T15:00:00Z',
    updatedAt: '2024-10-06T12:00:00Z',
  },
  {
    id: 'mission-5',
    affreteurId: 'affreteur-2',
    titre: 'Transport Construction Douala-Kribi',
    description: 'Matériaux de construction pour projet immobilier',
    typeMarchandise: 'Construction',
    poids: 800,
    volume: 6.5,
    dateDepartEstime: '2024-10-07T07:00:00Z',
    dateArriveePrevue: '2024-10-07T11:00:00Z',
    adresseDepartId: 'addr-douala-depot',
    adresseArriveeId: 'addr-kribi-chantier',
    budgetMin: 95000,
    budgetMax: 110000,
    status: 'draft',
    isFlexibleDates: true,
    isFlexibleRoute: true,
    notesComplementaires: 'Matériaux lourds - vérifier capacité du véhicule',
    createdAt: '2024-10-03T16:00:00Z',
    updatedAt: '2024-10-03T16:30:00Z',
  },
];

// Fonctions utilitaires pour les missions
export const getMissionsByStatus = (status: Mission['status']) => {
  return MOCK_MISSIONS.filter((mission) => mission.status === status);
};

export const getMissionsByTransporteur = (transporteurId: string) => {
  return MOCK_MISSIONS.filter((mission) => mission.transporteurId === transporteurId);
};

export const getMissionsByAffreteur = (affreteurId: string) => {
  return MOCK_MISSIONS.filter((mission) => mission.affreteurId === affreteurId);
};

export const getHighPriorityMissions = () => {
  return MOCK_MISSIONS.filter((mission) => mission.budgetMax > 200000);
};

export const getActiveMissions = () => {
  return MOCK_MISSIONS.filter((mission) => ['assigned', 'published'].includes(mission.status));
};

export const getCompletedMissions = () => {
  return MOCK_MISSIONS.filter((mission) => mission.status === 'completed');
};

// Statistiques des missions
export const getMissionStats = () => {
  const total = MOCK_MISSIONS.length;
  const byStatus = MOCK_MISSIONS.reduce(
    (acc, mission) => {
      acc[mission.status] = (acc[mission.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalBudget = MOCK_MISSIONS.reduce((sum, mission) => sum + mission.budgetMax, 0);
  const avgBudget = totalBudget / total;

  return {
    total,
    byStatus,
    totalBudget,
    avgBudget,
    highPriority: getHighPriorityMissions().length,
    active: getActiveMissions().length,
    completed: getCompletedMissions().length,
  };
};
