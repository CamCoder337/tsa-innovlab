// ============================================================================
// STORE TYPES
// ============================================================================

import type { User } from './user.types';
import type { Mission } from './mission.types';

export interface AuthState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (user: User, token?: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setToken: (token: string, expiresIn?: number) => void;
}

export interface MissionState {
  missions: Mission[];
  currentMission: Mission | null;
  isLoading: boolean;
  error: string | null;
}

export interface MissionActions {
  setMissions: (missions: Mission[]) => void;
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  setCurrentMission: (mission: Mission | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
