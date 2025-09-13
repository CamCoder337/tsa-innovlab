import { create } from 'zustand';
import type { Mission, MissionStatus, MissionFilters } from '@/types/mission.types';
import type { MissionState, MissionActions } from '@/types/store.types';

// Extended store interface with API and utility methods
export interface MissionStoreExtended extends MissionState, MissionActions {
  // Filter methods
  filterMissions: (filters: MissionFilters) => Mission[];
  searchMissions: (query: string) => Mission[];
}

// Mock missions data - Updated to match proper schema
const mockMissions: Mission[] = [
  {
    id: 'TSA-001',
    affreteurId: 'user-aff-1',
    titre: 'Transport Électronique Douala → Yaoundé',
    description: 'Transport de matériel électronique de Douala à Yaoundé',
    typeMarchandise: 'electronics',
    poids: 800,
    volume: 2,
    dateDepartEstime: '2025-01-25T08:00:00Z',
    dateArriveePrevue: '2025-01-25T18:00:00Z',
    adresseDepartId: 'addr-1',
    adresseArriveeId: 'addr-2',
    budgetMin: 400000,
    budgetMax: 500000,
    status: 'assigned',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-22T14:30:00Z',
  },
  {
    id: 'TSA-002',
    affreteurId: 'user-aff-1',
    titre: 'Matériaux de Construction Bafoussam → Bamenda',
    description: 'Transport de matériaux de construction de Bafoussam à Bamenda',
    typeMarchandise: 'construction',
    poids: 2500,
    volume: 15,
    dateDepartEstime: '2025-01-28T06:00:00Z',
    dateArriveePrevue: '2025-01-28T16:00:00Z',
    adresseDepartId: 'addr-3',
    adresseArriveeId: 'addr-4',
    budgetMin: 250000,
    budgetMax: 300000,
    status: 'published',
    createdAt: '2025-01-21T09:00:00Z',
    updatedAt: '2025-01-21T09:00:00Z',
  },
  {
    id: 'TSA-003',
    affreteurId: 'user-aff-1',
    titre: 'Export Produits Alimentaires vers le Tchad',
    description: "Export de produits alimentaires de Garoua à N'Djamena",
    typeMarchandise: 'food',
    poids: 1200,
    volume: 8,
    dateDepartEstime: '2025-01-30T05:00:00Z',
    dateArriveePrevue: '2025-01-30T20:00:00Z',
    adresseDepartId: 'addr-5',
    adresseArriveeId: 'addr-6',
    budgetMin: 600000,
    budgetMax: 750000,
    status: 'published',
    createdAt: '2025-01-22T11:00:00Z',
    updatedAt: '2025-01-22T11:00:00Z',
  },
  {
    id: 'TSA-004',
    affreteurId: 'user-aff-1',
    titre: 'Transport Matériel Médical Yaoundé → Garoua',
    description: 'Transport de matériel médical de Yaoundé à Garoua',
    typeMarchandise: 'medical',
    poids: 2500,
    volume: 12,
    dateDepartEstime: '2025-01-30T07:00:00Z',
    dateArriveePrevue: '2025-01-31T19:00:00Z',
    adresseDepartId: 'addr-7',
    adresseArriveeId: 'addr-8',
    budgetMin: 800000,
    budgetMax: 900000,
    status: 'assigned',
    createdAt: '2025-01-23T08:00:00Z',
    updatedAt: '2025-01-23T08:00:00Z',
  },
  {
    id: 'TSA-005',
    affreteurId: 'user-aff-1',
    titre: 'Livraison Produits Alimentaires Douala → Bamenda',
    description: 'Livraison de produits alimentaires de Douala à Bamenda',
    typeMarchandise: 'food',
    poids: 1800,
    volume: 10,
    dateDepartEstime: '2025-01-27T06:00:00Z',
    dateArriveePrevue: '2025-01-27T16:00:00Z',
    adresseDepartId: 'addr-9',
    adresseArriveeId: 'addr-10',
    budgetMin: 300000,
    budgetMax: 350000,
    status: 'assigned',
    createdAt: '2025-01-22T12:00:00Z',
    updatedAt: '2025-01-22T12:00:00Z',
  },
  {
    id: 'TSA-006',
    affreteurId: 'user-aff-1',
    titre: 'Transport Textiles Kribi → Bertoua',
    description: 'Transport de textiles de Kribi à Bertoua',
    typeMarchandise: 'textiles',
    poids: 500,
    volume: 6,
    dateDepartEstime: '2025-01-20T08:00:00Z',
    dateArriveePrevue: '2025-01-20T18:00:00Z',
    adresseDepartId: 'addr-11',
    adresseArriveeId: 'addr-12',
    budgetMin: 230000,
    budgetMax: 270000,
    status: 'completed',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T18:30:00Z',
  },
];

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
  return mockMissions;
}

export const useMissionStore = create<MissionStoreExtended>((set, get) => ({
  // State
  missions: loadMissionsFromLocalStorage(),
  currentMission: null,
  isLoading: false,
  error: null,

  // Basic actions
  setMissions: (missions: Mission[]) => {
    persistMissionsToLocalStorage(missions);
    set({ missions });
  },

  addMission: (mission: Mission) => {
    const missions = get().missions;
    const newMission = {
      ...mission,
      createdAt: mission.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedMissions = [...missions, newMission];
    persistMissionsToLocalStorage(updatedMissions);
    set({ missions: updatedMissions });
  },

  updateMission: (id: string, updates: Partial<Mission>) => {
    const missions = get().missions;
    const updatedMissions = missions.map((mission) =>
      mission.id === id ? { ...mission, ...updates, updatedAt: new Date().toISOString() } : mission
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

  // Filter methods
  filterMissions: (filters: MissionFilters) => {
    const missions = get().missions;
    return missions.filter((mission) => {
      if (filters.status && !filters.status.includes(mission.status)) return false;
      if (filters.affreteurId && mission.affreteurId !== filters.affreteurId) return false;
      if (
        filters.typeMarchandise &&
        !filters.typeMarchandise.includes(mission.typeMarchandise || '')
      )
        return false;
      if (filters.budgetMin && mission.budgetMin && mission.budgetMin < filters.budgetMin)
        return false;
      if (filters.budgetMax && mission.budgetMax && mission.budgetMax > filters.budgetMax)
        return false;
      if (filters.dateDepartEstime && mission.dateDepartEstime !== filters.dateDepartEstime)
        return false;
      if (filters.dateArriveePrevue && mission.dateArriveePrevue !== filters.dateArriveePrevue)
        return false;
      return true;
    });
  },

  searchMissions: (query: string) => {
    const missions = get().missions;
    const lowercaseQuery = query.toLowerCase();
    return missions.filter(
      (mission) =>
        mission.titre.toLowerCase().includes(lowercaseQuery) ||
        mission.description?.toLowerCase().includes(lowercaseQuery) ||
        mission.typeMarchandise?.toLowerCase().includes(lowercaseQuery)
    );
  },
}));

// Selector hooks for common use cases
export const useMissionsByStatus = (status: MissionStatus) => {
  return useMissionStore((state) => state.missions.filter((mission) => mission.status === status));
};

export const useMissionsByAffreteur = (affreteurId: string) => {
  return useMissionStore((state) =>
    state.missions.filter((mission) => mission.affreteurId === affreteurId)
  );
};

export const usePublishedMissions = () => {
  return useMissionStore((state) =>
    state.missions.filter((mission) => mission.status === 'published')
  );
};

export const useAssignedMissions = () => {
  return useMissionStore((state) =>
    state.missions.filter((mission) => mission.status === 'assigned')
  );
};

export const useCompletedMissions = () => {
  return useMissionStore((state) =>
    state.missions.filter((mission) => mission.status === 'completed')
  );
};

export const useDraftMissions = () => {
  return useMissionStore((state) => state.missions.filter((mission) => mission.status === 'draft'));
};
