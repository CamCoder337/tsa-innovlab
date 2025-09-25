import { create } from 'zustand';
import type { Mission, MissionStats } from '@/types/mission.types';
import type { MissionStoreExtended } from '@/types/mission.types';

// const mockMissions: Mission[] = [
//     {
//         id: 'm1',
//         affreteurId: 'a79d4cd6-f26c-405b-9db1-53e6fee1bcc5',
//         titre: 'Transport de matériaux de construction',
//         description: 'Transport de sacs de ciment et de briques de Douala à Yaoundé',
//         typeMarchandise: 'Matériaux de construction',
//         poids: 2500, // kg
//         volume: 10, // m³
//         dateDepartEstime: '2025-10-01T08:00:00Z',
//         dateArriveePrevue: '2025-10-01T14:00:00Z',
//         adresseDepartId: 'addr1',
//         adresseArriveeId: 'addr2',
//         budgetMin: 150000,
//         budgetMax: 200000,
//         status: 'published',
//         isFlexibleDates: true,
//         isFlexibleRoute: false,
//         notesComplementaires: 'Fragile - Manipuler avec soin',
//         documents: ['/documents/contrat1.pdf'],
//         createdAt: '2025-09-20T10:00:00Z',
//         updatedAt: '2025-09-20T10:00:00Z',
//     },
//     {
//         id: 'm2',
//         affreteurId: 'a79d4cd6-f26c-405b-9db1-53e6fee1bcc5',
//         titre: 'Livraison de produits électroniques',
//         description: 'Transport de téléphones et ordinateurs de Douala à Bafoussam',
//         typeMarchandise: 'Électronique',
//         poids: 500, // kg
//         volume: 5, // m³
//         dateDepartEstime: '2025-10-05T09:00:00Z',
//         dateArriveePrevue: '2025-10-05T16:00:00Z',
//         adresseDepartId: 'addr3',
//         adresseArriveeId: 'addr4',
//         budgetMin: 180000,
//         budgetMax: 220000,
//         status: 'draft',
//         isFlexibleDates: false,
//         isFlexibleRoute: true,
//         notesComplementaires: 'Véhicule sécurisé requis',
//         documents: ['/documents/contrat2.pdf', '/documents/assurance.pdf'],
//         createdAt: '2025-09-18T14:30:00Z',
//         updatedAt: '2025-09-19T11:15:00Z',
//     },
//     {
//         id: 'm3',
//         affreteurId: 'a79d4cd6-f26c-405b-9db1-53e6fee1bcc5',
//         titre: 'Transport de meubles',
//         description: 'Déménagement de meubles de maison de Yaoundé à Kribi',
//         typeMarchandise: 'Meubles',
//         poids: 1200, // kg
//         volume: 15, // m³
//         dateDepartEstime: '2025-10-10T07:00:00Z',
//         dateArriveePrevue: '2025-10-10T18:00:00Z',
//         adresseDepartId: 'addr5',
//         adresseArriveeId: 'addr6',
//         budgetMin: 250000,
//         budgetMax: 300000,
//         status: 'assigned',
//         isFlexibleDates: true,
//         isFlexibleRoute: false,
//         notesComplementaires: 'Prévoir des couvertures de protection',
//         documents: [],
//         createdAt: '2025-09-15T09:20:00Z',
//         updatedAt: '2025-09-17T16:45:00Z',
//         dateDebutReelle: '2025-10-10T07:30:00Z',
//     },
//     {
//         id: 'm4',
//         affreteurId: 'a79d4cd6-f26c-405b-9db1-53e6fee1bcc5',
//         titre: 'Transport de produits alimentaires',
//         description: 'Livraison de denrées périssables de Douala à Bafang',
//         typeMarchandise: 'Alimentaire',
//         poids: 2000, // kg
//         volume: 8, // m³
//         dateDepartEstime: '2025-09-25T06:00:00Z',
//         dateArriveePrevue: '2025-09-25T12:00:00Z',
//         adresseDepartId: 'addr7',
//         adresseArriveeId: 'addr8',
//         budgetMin: 120000,
//         budgetMax: 150000,
//         status: 'completed',
//         isFlexibleDates: false,
//         isFlexibleRoute: false,
//         notesComplementaires: 'Camion frigorifique obligatoire',
//         documents: ['/documents/contrat3.pdf'],
//         createdAt: '2025-09-10T11:00:00Z',
//         updatedAt: '2025-09-26T10:20:00Z',
//         dateDebutReelle: '2025-09-25T06:15:00Z',
//         dateFinReelle: '2025-09-25T13:30:00Z',
//         ratingAffreteur: 4,
//         ratingTransporteur: 5,
//         commentaireAffreteur: 'Livraison effectuée avec un léger retard mais dans de bonnes conditions',
//         commentaireTransporteur: 'Client réactif et professionnel',
//     },
//     {
//         id: 'm5',
//         affreteurId: 'a79d4cd6-f26c-405b-9db1-53e6fee1bcc5',
//         titre: 'Transport de machines industrielles',
//         description: "Transport d'équipements lourds de Douala à Kribi",
//         typeMarchandise: 'Machines',
//         poids: 5000, // kg
//         volume: 20, // m³
//         dateDepartEstime: '2025-10-15T07:00:00Z',
//         dateArriveePrevue: '2025-10-15T17:00:00Z',
//         adresseDepartId: 'addr9',
//         adresseArriveeId: 'addr10',
//         budgetMin: 350000,
//         budgetMax: 400000,
//         status: 'cancelled',
//         isFlexibleDates: true,
//         isFlexibleRoute: false,
//         notesComplementaires: 'Chargement par grue nécessaire',
//         documents: ['/documents/contrat4.pdf', '/documents/plan-chargement.pdf'],
//         createdAt: '2025-09-05T09:00:00Z',
//         updatedAt: '2025-09-12T14:30:00Z',
//     },
// ];

function persistMissionsToLocalStorage(missions: Mission[]) {
  try {
    localStorage.setItem('tsa_missions', JSON.stringify(missions));
  } catch (error) {
    console.error('Failed to persist missions to localStorage:', error);
  }
}

function loadMissionsFromLocalStorage(): Mission[] {
  try {
    const raw = localStorage.getItem('tsa_missions');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load missions from localStorage:', error);
  }
  return [];
}

function persistMyMissionsToLocalStorage(missions: Mission[]) {
  try {
    localStorage.setItem('tsa_my_missions', JSON.stringify(missions));
  } catch (error) {
    console.error('Failed to persist my missions to localStorage:', error);
  }
}

function loadMyMissionsFromLocalStorage(): Mission[] {
  try {
    const raw = localStorage.getItem('tsa_my_missions');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load my missions from localStorage:', error);
  }
  return [];
}

function persistMissionsStatsToLocalStorage(stats: MissionStats) {
  try {
    localStorage.setItem('tsa_missions_stats', JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to persist missions to localStorage:', error);
  }
}

function loadMissionsStatsFromLocalStorage(): MissionStats {
  try {
    const raw = localStorage.getItem('tsa_missions_stats');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load missions from localStorage:', error);
  }
  return {
    totals: {
      missions: 0,
      affreteurs: 0,
      transporteurs: 0,
    },
    statusStats: {},
    recentMissions: [],
  };
}

export const useMissionStore = create<MissionStoreExtended>((set, get) => ({
  // State
  missions: loadMissionsFromLocalStorage(),
  myMissions: loadMyMissionsFromLocalStorage(),
  currentMission: null,
  isLoading: false,
  error: null,
  stats: loadMissionsStatsFromLocalStorage(),

  // Basic actions
  setMissions: (missions: Mission[]) => {
    persistMissionsToLocalStorage(missions);
    set({ missions });
  },

  setMyMissions: (missions: Mission[]) => {
    persistMyMissionsToLocalStorage(missions);
    set({ myMissions: missions });
  },

  addMission: (mission: Mission) => {
    const missions = get().missions;
    const updatedMissions = [...missions, mission];
    persistMissionsToLocalStorage(updatedMissions);
    set({ missions: updatedMissions });
  },

  updateMission: (id: string, update: Mission) => {
    const missions = get().missions;
    const updatedMissions = missions.map((mission) =>
      mission.id === id ? { ...mission, ...update } : mission
    );
    persistMissionsToLocalStorage(updatedMissions);
    set({ missions: updatedMissions });
  },

  deleteMission: (id: string) => {
    const missions = get().missions;
    const updatedMissions = missions.filter((mission) => mission.id !== id);
    persistMissionsToLocalStorage(updatedMissions);
    set({ missions: updatedMissions });
  },

  setCurrentMission: (mission: Mission | null) => {
    set({ currentMission: mission });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setStats: (stats: MissionStats) => {
    persistMissionsStatsToLocalStorage(stats);
    set({ stats });
  },
}));
