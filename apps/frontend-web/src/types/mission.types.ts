import type { Timestamps } from './common.types';
import type { Address } from './address.types';
import type { User } from './auth.types';

export type MissionStatus = 'draft' | 'published' | 'assigned' | 'completed' | 'cancelled';

export interface Mission extends Timestamps {
  id: string;
  affreteurId: string;
  affreteur?: User;
  title: string;
  description: string;
  typeMarchandise: string;
  poids: number;
  volume: number;
  dateDepartEstime: string;
  dateArriveePrevue: string;
  adresseDepartId: string;
  adresseDepart?: Address;
  adresseArriveeId: string;
  adresseArrivee?: Address;
  budgetMin: number;
  budgetMax: number;
  status: MissionStatus;
  isFlexibleDates?: boolean;
  isFlexibleRoute?: boolean;
  notesComplementaires?: string;
  documents?: string[];
  transporteurId?: string;
  transporteur?: User;
  dateDebutReelle?: string;
  dateFinReelle?: string;
  ratingAffreteur?: number;
  commentaireAffreteur?: string;
  ratingTransporteur?: number;
  commentaireTransporteur?: string;
  // Position actuelle du transporteur pour le tracking en temps réel
  currentPosition?: { lat: number; lng: number };
  lastPositionUpdate?: string;
}

export interface CreateMissionDto {
  title: string;
  affreteurId: string;
  description?: string;
  typeMarchandise?: string;
  poids?: number;
  volume?: number;
  dateDepartEstime?: string;
  dateArriveePrevue?: string;
  adresseDepart?: Address;
  adresseArrivee?: Address;
  budgetMin?: number;
  budgetMax?: number;
}

export interface UpdateMissionDto extends Partial<CreateMissionDto> {
  status?: MissionStatus;
  transporteurId?: string | null;
  dateDebutReelle?: string | null;
  dateFinReelle?: string | null;
  ratingAffreteur?: number | null;
  commentaireAffreteur?: string | null;
  ratingTransporteur?: number | null;
  commentaireTransporteur?: string | null;
}

export interface MissionStats {
  totals: {
    missions: number;
    affreteurs: number;
    transporteurs: number;
  };
  statusStats: Record<string, number>;
  recentMissions: Array<{
    id: string;
    title: string;
    status: MissionStatus;
    affreteur: string | null;
    createdAt: string;
  }>;
}

export interface MissionFilterParams {
  search?: string;
  status?: MissionStatus[];
  affreteurId?: string;
  transporteurId?: string;
  dateFrom?: string;
  dateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
  typeMarchandise?: string;
  city?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'titre' | 'budgetMin' | 'budgetMax';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MissionState {
  missions: Mission[];
  myMissions: Mission[];
  currentMission: Mission | null;
  isLoading: boolean;
  error: string | null;
  stats: MissionStats;
}

export interface MissionActions {
  setMissions: (missions: Mission[]) => void;
  setMyMissions: (missions: Mission[]) => void;
  setStats: (stats: MissionStats) => void;
  addMission: (mission: Mission) => void;
  updateMission: (id: string, update: Mission) => void;
  deleteMission: (id: string) => void;
  setCurrentMission: (mission: Mission | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Extended store interface with API and utility methods
export type MissionStoreExtended = MissionState & MissionActions;
