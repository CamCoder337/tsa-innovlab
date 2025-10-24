import type { UpdateUserRequest, User, UserRole } from './auth.types';

export type UserStatus = 'pending' | 'active' | 'suspended';

export interface UserStatusUpdateRequest {
  status: UserStatus;
  reason?: string;
}

export interface UserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserStats {
  total: number;
  byRole: {
    admin: number;
    transporteur: number;
    affreteur: number;
    client: number;
  };
  byStatus: {
    active: number;
    suspended: number;
    pending: number;
  };
  security: {
    mfaEnabled: number;
  };
}

export interface UserWithStats extends User {
  stats?: {
    // Common stats
    totalOrders?: number;
    totalMissions?: number;
    totalPropositions?: number;

    // Client-specific stats
    totalSpent?: number;
    pendingOrders?: number;
    completedOrders?: number;

    // Affreteur-specific stats
    publishedMissions?: number;
    completedMissions?: number;

    // Transporteur-specific stats
    totalVehicles?: number;
    availableVehicles?: number;
    totalAssignedMissions?: number;
    activeMissions?: number;

    // Admin-specific stats
    totalActions?: number;
  };
}

export interface UserState {
  users: User[];
  selectedUser: UserWithStats | null;
  userStats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
}

export interface UserActions {
  // Data fetching
  fetchUsers: (params?: UserFilterParams) => Promise<void>;
  fetchUser: (id: string) => Promise<void>;
  fetchUserStats: () => Promise<void>;

  // CRUD operations
  updateUser: (id: string, userData: UpdateUserRequest) => Promise<void>;
  suspendUser: (id: string, data: UserStatusUpdateRequest) => Promise<void>;
  activateUser: (id: string, data: UserStatusUpdateRequest) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export type UserStore = UserState & UserActions;
