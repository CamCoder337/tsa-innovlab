import { create } from 'zustand';
import type { Mission, MissionStatus, MissionFilterParams } from '@/types/mission.types';
import type { MissionState, MissionActions } from '@/types/store.types';

// Extended store interface with API and utility methods
export interface MissionStoreExtended extends MissionState, MissionActions {
  // Filter methods
  filterMissions: (filters: MissionFilterParams) => Mission[];
  searchMissions: (query: string) => Mission[];
}

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
  filterMissions: (filters: MissionFilterParams) => {
    const missions = get().missions;
    return missions.filter((mission) => {
      if (filters.status && !filters.status.includes(mission.status)) return false;
      if (filters.affreteurId && mission.affreteurId !== filters.affreteurId) return false;
      if (
        filters.typeMarchandise &&
        !filters.typeMarchandise.includes(mission.typeMarchandise || '')
      )
        return false;
      if (filters.minBudget && mission.budgetMin && mission.budgetMin < filters.minBudget)
        return false;
      if (filters.maxBudget && mission.budgetMax && mission.budgetMax > filters.maxBudget)
        return false;
      if (filters.dateFrom && mission.dateDepartEstime !== filters.dateFrom) return false;
      if (filters.dateTo && mission.dateArriveePrevue !== filters.dateTo) return false;
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
