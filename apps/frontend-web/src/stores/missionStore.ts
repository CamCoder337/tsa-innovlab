import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  Mission,
  MissionStats,
  CreateMissionDto,
  UpdateMissionDto,
  MissionFeedback,
  FeedbackFilterParams,
  FeedbackStats,
} from '@/types/mission.types';
import type { MissionStoreExtended } from '@/types/mission.types';
import { missionService } from '@/services/mission.service';
import type { PaginatedMetaResponse } from '@/types/common.types';
import { adminService } from '@/services/admin.service';
import { getPersistedUser } from './authStore';

function getPersistedData(): Partial<MissionStoreExtended> | null {
  try {
    const persistedData = localStorage.getItem('tsa_missions');
    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      return parsed.state || null;
    }
  } catch (error) {
    console.error('Error loading persisted mission data:', error);
  }
  return null;
}

const user = getPersistedUser() || null;

const initialState = {
  missions: getPersistedData()?.missions || [],
  myMissions: getPersistedData()?.myMissions || [],
  currentMission: null,
  feedbacks: getPersistedData()?.feedbacks || [],
  currentFeedback: null,
  feedbackStats: getPersistedData()?.feedbackStats || null,
  isLoading: false,
  error: null,
  stats: getPersistedData()?.stats || {
    totals: {
      missions: 0,
      affreteurs: 0,
      transporteurs: 0,
    },
    statusStats: {},
    recentMissions: [],
  },
};

export const useMissionStore = create<MissionStoreExtended>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Basic actions
      setMissions: (missions: Mission[]) => {
        set({ missions });
      },

      setMyMissions: (missions: Mission[]) => {
        set({ myMissions: missions });
      },

      setCurrentMission: (mission: Mission | null) => {
        set({ currentMission: mission });
      },

      setStats: (stats: MissionStats) => {
        set({ stats });
      },

      // Data fetching actions
      fetchAllMissions: async () => {
        let page: number = 1;
        let next: boolean = true;
        let retryAttempts: number = 0;
        let missionsList: PaginatedMetaResponse<Mission, 'missions'> = {
          missions: {
            data: [],
            meta: {
              total: 0,
              perPage: 20,
              currentPage: 1,
              lastPage: 1,
              firstPage: 1,
              firstPageUrl: null,
              lastPageUrl: null,
              nextPageUrl: null,
              previousPageUrl: null,
            },
          },
          pagination: {
            currentPage: 1,
            hasNext: false,
            hasPrev: false,
            perPage: 20,
            total: 0,
            lastPage: 1,
          },
        };

        while (next) {
          try {
            set({ isLoading: true, error: null });

            const response =
              user?.role === 'admin'
                ? await adminService.adminGetMissions({ page })
                : await missionService.getAvailableMissions({ page });

            if (response.error) {
              retryAttempts += 1;
              if (retryAttempts > 3) {
                next = false;
              }
              set({
                error: response.error.message,
                isLoading: false,
              });
              return;
            }

            if (response.data) {
              if (page === 1) {
                missionsList = response.data;
              } else {
                missionsList = {
                  missions: {
                    data: [...missionsList.missions.data, ...response.data.missions.data],
                    meta: response.data.missions.meta,
                  },
                  pagination: { ...response.data.pagination },
                };
              }

              set({
                missions: missionsList.missions.data,
                isLoading: false,
                error: null,
              });

              next = response.data.pagination.hasNext || false;
              if (next) page += 1;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch missions',
              isLoading: false,
            });
          }
        }
      },

      fetchMyMissions: async () => {
        let page: number = 1;
        let next: boolean = true;
        let retryAttempts: number = 0;
        let missionsList: PaginatedMetaResponse<Mission, 'missions'> = {
          missions: {
            data: [],
            meta: {
              total: 0,
              perPage: 20,
              currentPage: 1,
              lastPage: 1,
              firstPage: 1,
              firstPageUrl: null,
              lastPageUrl: null,
              nextPageUrl: null,
              previousPageUrl: null,
            },
          },
          pagination: {
            currentPage: 1,
            hasNext: false,
            hasPrev: false,
            perPage: 20,
            total: 0,
            lastPage: 1,
          },
        };

        while (next) {
          try {
            set({ isLoading: true, error: null });

            const response =
              user?.role === 'affreteur'
                ? await missionService.getAffreteurMissions({ page })
                : await missionService.getTransporteurMissions({ page });

            if (response.error) {
              retryAttempts += 1;
              if (retryAttempts > 3) {
                next = false;
              }
              set({
                error: response.error.message,
                isLoading: false,
              });
              return;
            }

            if (response.data) {
              if (page === 1) {
                missionsList = response.data;
              } else {
                missionsList = {
                  missions: {
                    data: [...missionsList.missions.data, ...response.data.missions.data],
                    meta: response.data.missions.meta,
                  },
                  pagination: { ...response.data.pagination },
                };
              }

              set({
                myMissions: missionsList.missions.data,
                isLoading: false,
                error: null,
              });

              next = response.data.pagination.hasNext || false;
              if (next) page += 1;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch missions',
              isLoading: false,
            });
          }
        }
      },

      fetchMission: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response =
            user?.role === 'affreteur'
              ? await missionService.getAffreteurMission(id)
              : user?.role === 'transporteur'
                ? await missionService.getTransporteurMission(id)
                : await adminService.adminGetMission(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              currentMission: response.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch mission',
            isLoading: false,
          });
        }
      },

      fetchMissionsStats: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.getMissionStats();

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              stats: response.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch mission',
            isLoading: false,
          });
        }
      },

      createMission: async (data: CreateMissionDto) => {
        try {
          set({ isLoading: true, error: null });

          const response = await missionService.createMission(data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return null;
          }

          if (response.data) {
            const currentMissions = get().missions;
            set({
              missions: [response.data, ...currentMissions],
              currentMission: response.data,
              isLoading: false,
              error: null,
            });
            return response.data;
          }

          return null;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create mission',
            isLoading: false,
          });
          return null;
        }
      },

      updateMission: async (id: string, data: Partial<UpdateMissionDto>) => {
        try {
          set({ isLoading: true, error: null });

          const response = await missionService.updateMission(id, data);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const currentMissions = get().missions;
            const currentMyMissions = get().myMissions;

            set({
              missions: currentMissions.map((mission) =>
                mission.id === id ? response.data! : mission
              ),
              myMissions: currentMyMissions.map((mission) =>
                mission.id === id ? response.data! : mission
              ),
              currentMission:
                get().currentMission?.id === id ? response.data : get().currentMission,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update mission',
            isLoading: false,
          });
        }
      },

      deleteMission: async (id: string) => {
        try {
          set({ error: null });

          const response = await missionService.deleteMission(id);

          if (response.error) {
            set({
              error: response.error.message || 'Erreur de connexion internet',
            });
            return;
          }

          if (response.data) {
            set((state) => ({
              missions: state.missions.filter((mission) => mission.id !== id),
              myMissions: state.myMissions.filter((mission) => mission.id !== id),
              currentMission: state.currentMission?.id === id ? null : state.currentMission,
              isLoading: false,
              error: null,
            }));
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete mission',
            isLoading: false,
          });
        }
      },

      publishMission: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await missionService.publishMission(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const currentMissions = get().missions;
            const currentMyMissions = get().myMissions;

            set({
              missions: currentMissions.map((mission) =>
                mission.id === id ? response.data! : mission
              ),
              myMissions: currentMyMissions.map((mission) =>
                mission.id === id ? response.data! : mission
              ),
              currentMission:
                get().currentMission?.id === id ? response.data : get().currentMission,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to publish mission',
            isLoading: false,
          });
        }
      },

      unpublishMission: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await missionService.unpublishMission(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const currentMissions = get().missions;
            const currentMyMissions = get().myMissions;

            set({
              missions: currentMissions.map((mission) =>
                mission.id === id ? response.data! : mission
              ),
              myMissions: currentMyMissions.map((mission) =>
                mission.id === id ? response.data! : mission
              ),
              currentMission:
                get().currentMission?.id === id ? response.data : get().currentMission,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to cancel mission',
            isLoading: false,
          });
        }
      },

      applyForMission: async (id: string, vehicleId: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await missionService.applyForMission(id, vehicleId);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            const currentMissions = get().missions;

            set({
              missions: currentMissions.map((mission) =>
                mission.id === id ? response.data! : mission
              ),
              currentMission:
                get().currentMission?.id === id ? response.data : get().currentMission,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to apply for mission',
            isLoading: false,
          });
        }
      },

      // Utility Actions

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),

      // Feedback Management Actions
      fetchFeedbacks: async (params?: FeedbackFilterParams) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.getFeedbacks(params);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              feedbacks: response.data.feedbacks.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch feedbacks',
            isLoading: false,
          });
        }
      },

      fetchFeedback: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.getFeedback(id);

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              currentFeedback: response.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch feedback',
            isLoading: false,
          });
        }
      },

      fetchFeedbackStats: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await adminService.getFeedbackStats();

          if (response.error) {
            set({
              error: response.error.message,
              isLoading: false,
            });
            return;
          }

          if (response.data) {
            set({
              feedbackStats: response.data,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch feedback stats',
            isLoading: false,
          });
        }
      },

      setCurrentFeedback: (feedback: MissionFeedback | null) => {
        set({ currentFeedback: feedback });
      },

      setFeedbacks: (feedbacks: MissionFeedback[]) => {
        set({ feedbacks });
      },

      setFeedbackStats: (feedbackStats: FeedbackStats) => {
        set({ feedbackStats });
      },
    }),
    {
      name: 'tsa_missions',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        missions: state.missions,
        myMissions: state.myMissions,
        stats: state.stats,
        feedbacks: state.feedbacks,
        feedbackStats: state.feedbackStats,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);
