import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UpdateUserRequest } from '@/types/auth.types';
import type {
  UserFilterParams,
  UserStatusUpdateRequest,
  UserStore,
  UserState,
  UserWithStats,
} from '@/types/user.types';
import { adminService } from '@/services/admin.service';

const initialState: UserState = {
  users: [],
  currentUser: null,
  userStats: null,
  isLoading: false,
  error: null,
  pagination: null,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Data fetching actions
      fetchUsers: async (params?: UserFilterParams) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.getUsers(params);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              users: response.data.users,
              pagination: response.data.pagination,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch users',
            isLoading: false,
          });
        }
      },

      fetchUser: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.getUser(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const userWithStats: UserWithStats = {
              ...response.data.user,
              stats: response.data.stats,
            };

            set({
              currentUser: userWithStats,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch user',
            isLoading: false,
          });
        }
      },

      fetchUserStats: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.getUserStats();

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              userStats: response.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch user statistics',
            isLoading: false,
          });
        }
      },

      updateUser: async (id: string, userData: UpdateUserRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.updateUser(id, userData);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const updatedUser = Object.values(response.data)[0];
            const currentUsers = get().users;

            set({
              users: currentUsers.map((user) => (user.id === id ? updatedUser : user)),
              currentUser:
                get().currentUser?.id === id
                  ? { ...get().currentUser!, ...updatedUser }
                  : get().currentUser,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update user',
            isLoading: false,
          });
        }
      },

      suspendUser: async (id: string, data: UserStatusUpdateRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.suspendUser(id, data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const updatedUser = Object.values(response.data)[0];
            const currentUsers = get().users;

            set({
              users: currentUsers.map((user) => (user.id === id ? updatedUser : user)),
              currentUser:
                get().currentUser?.id === id
                  ? { ...get().currentUser!, ...updatedUser }
                  : get().currentUser,
              isLoading: false,
              error: null,
            });

            // Refresh stats after status change
            get().fetchUserStats();
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to suspend user',
            isLoading: false,
          });
        }
      },

      activateUser: async (id: string, data: UserStatusUpdateRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.activateUser(id, data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const updatedUser = Object.values(response.data)[0];
            const currentUsers = get().users;

            set({
              users: currentUsers.map((user) => (user.id === id ? updatedUser : user)),
              currentUser:
                get().currentUser?.id === id
                  ? { ...get().currentUser!, ...updatedUser }
                  : get().currentUser,
              isLoading: false,
              error: null,
            });

            // Refresh stats after status change
            get().fetchUserStats();
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to activate user',
            isLoading: false,
          });
        }
      },

      deleteUser: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.deleteUser(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const currentUsers = get().users;

            set({
              users: currentUsers.filter((user) => user.id !== id),
              currentUser: get().currentUser?.id === id ? null : get().currentUser,
              isLoading: false,
              error: null,
            });

            // Refresh stats after deletion
            get().fetchUserStats();
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete user',
            isLoading: false,
          });
        }
      },

      // Utility actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'users',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        users: state.users,
        stats: state.userStats,
      }),
    }
  )
);
