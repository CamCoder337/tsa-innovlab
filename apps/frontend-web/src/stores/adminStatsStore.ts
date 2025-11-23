import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { adminService } from '@/services/admin.service';
import type {
  OverviewStats,
  AdminMissionStats,
  AdminProductStats,
  UserStats as AdminUserStats,
  FeedbackStats,
} from '@/types/admin-stats.types';

interface StatState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface AdminStatsState {
  overview: StatState<OverviewStats>;
  users: StatState<AdminUserStats>;
  missions: StatState<AdminMissionStats>;
  products: StatState<AdminProductStats>;
  feedbacks: StatState<FeedbackStats>;

  // Actions
  fetchOverviewStats: () => Promise<void>;
  fetchUserStats: () => Promise<void>;
  fetchMissionStats: () => Promise<void>;
  fetchProductStats: () => Promise<void>;
  fetchFeedbackStats: () => Promise<void>;
  fetchAllStats: () => Promise<void>;
  reset: () => void;
}

export function getPersistedData(): Partial<AdminStatsState> | null {
  try {
    const persistedData = localStorage.getItem('tsa_admin_stats');
    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      return parsed.state || null;
    }
  } catch (error) {
    console.error('Error loading persisted admin stats data:', error);
  }
  return null;
}

const initialStatState = {
  data: null,
  isLoading: false,
  error: null,
};

const initialState = {
  overview: getPersistedData()?.overview || { ...initialStatState },
  users: getPersistedData()?.users || { ...initialStatState },
  missions: getPersistedData()?.missions || { ...initialStatState },
  products: getPersistedData()?.products || { ...initialStatState },
  feedbacks: getPersistedData()?.feedbacks || { ...initialStatState },
};

export const useAdminStatsStore = create<AdminStatsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchOverviewStats: async () => {
        set((state) => ({
          overview: {
            ...state.overview,
            isLoading: true,
            error: null,
          },
        }));

        try {
          const response = await adminService.getOverviewStats();

          if (response.error) {
            set((state) => ({
              overview: {
                ...state.overview,
                isLoading: false,
                error: response.error!.message,
              },
            }));
          } else if (response.data) {
            set((state) => ({
              overview: {
                ...state.overview,
                isLoading: false,
                error: null,
                data: response.data!,
              },
            }));
          }
        } catch (err) {
          set((state) => ({
            overview: {
              ...state.overview,
              isLoading: false,
              error: err instanceof Error ? err.message : 'Failed to fetch overview stats',
            },
          }));
        }
      },

      fetchUserStats: async () => {
        set((state) => ({
          users: { ...state.users, isLoading: true, error: null },
        }));
        try {
          const response = await adminService.getAdminUserStats();
          if (response.error) {
            set((state) => ({
              users: { ...state.users, isLoading: false, error: response.error!.message },
            }));
          } else if (response.data) {
            set((state) => ({
              users: { ...state.users, isLoading: false, data: response.data!, error: null },
            }));
          }
        } catch (err) {
          set((state) => ({
            users: {
              ...state.users,
              isLoading: false,
              error: err instanceof Error ? err.message : 'Failed to fetch user stats',
            },
          }));
        }
      },

      fetchMissionStats: async () => {
        set((state) => ({ missions: { ...state.missions, isLoading: true, error: null } }));
        try {
          const response = await adminService.getAdminMissionStats();
          if (response.error) {
            set((state) => ({
              missions: { ...state.missions, isLoading: false, error: response.error!.message },
            }));
          } else if (response.data) {
            set((state) => ({
              missions: { ...state.missions, isLoading: false, data: response.data!, error: null },
            }));
          }
        } catch (err) {
          set((state) => ({
            missions: {
              ...state.missions,
              isLoading: false,
              error: err instanceof Error ? err.message : 'Failed to fetch mission stats',
            },
          }));
        }
      },

      fetchProductStats: async () => {
        set((state) => ({ products: { ...state.products, isLoading: true, error: null } }));
        try {
          const response = await adminService.getAdminProductsStats();
          if (response.error) {
            set((state) => ({
              products: { ...state.products, isLoading: false, error: response.error!.message },
            }));
          } else if (response.data) {
            set((state) => ({
              products: { ...state.products, isLoading: false, data: response.data!, error: null },
            }));
          }
        } catch (err) {
          set((state) => ({
            products: {
              ...state.products,
              isLoading: false,
              error: err instanceof Error ? err.message : 'Failed to fetch product stats',
            },
          }));
        }
      },

      fetchFeedbackStats: async () => {
        set((state) => ({ feedbacks: { ...state.feedbacks, isLoading: true, error: null } }));
        try {
          const response = await adminService.getFeedbackStats();
          if (response.error) {
            set((state) => ({
              feedbacks: { ...state.feedbacks, isLoading: false, error: response.error!.message },
            }));
          } else if (response.data) {
            set((state) => ({
              feedbacks: {
                ...state.feedbacks,
                isLoading: false,
                data: response.data!,
                error: null,
              },
            }));
          }
        } catch (err) {
          set((state) => ({
            feedbacks: {
              ...state.feedbacks,
              isLoading: false,
              error: err instanceof Error ? err.message : 'Failed to fetch feedback stats',
            },
          }));
        }
      },

      fetchAllStats: async () => {
        const {
          fetchOverviewStats,
          fetchUserStats,
          fetchMissionStats,
          fetchProductStats,
          fetchFeedbackStats,
        } = get();
        await Promise.all([
          fetchOverviewStats(),
          fetchUserStats(),
          fetchMissionStats(),
          fetchProductStats(),
          fetchFeedbackStats(),
        ]);
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'tsa_admin_stats',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        overview: state.overview,
        users: state.users,
        missions: state.missions,
        products: state.products,
        feedbacks: state.feedbacks,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset loading states on rehydrate to avoid stuck spinners
          state.overview.isLoading = false;
          state.users.isLoading = false;
          state.missions.isLoading = false;
          state.products.isLoading = false;
          state.feedbacks.isLoading = false;
        }
      },
    }
  )
);
