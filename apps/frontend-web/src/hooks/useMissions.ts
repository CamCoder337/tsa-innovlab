import { useMissionStore } from '@/stores/missionStore';
import { useAuth } from './useAuth';
import { missionService } from '@/services/mission.service';
import type { Mission, MissionFilterParams } from '@/types/mission.types';
import type { PaginatedMetaResponse } from '@/types/common.types';
import { useCallback, useEffect } from 'react';

export function useMissions() {
  const { isAuthenticated, user } = useAuth();

  const missions = useMissionStore((s) => s.missions);
  const currentMission = useMissionStore((s) => s.currentMission);
  const isLoading = useMissionStore((s) => s.isLoading);
  const error = useMissionStore((s) => s.error);
  const setMissions = useMissionStore((s) => s.setMissions);
  const addMission = useMissionStore((s) => s.addMission);
  const updateMission = useMissionStore((s) => s.updateMission);
  const deleteMission = useMissionStore((s) => s.deleteMission);
  const setCurrentMission = useMissionStore((s) => s.setCurrentMission);
  const setLoading = useMissionStore((s) => s.setLoading);
  const setError = useMissionStore((s) => s.setError);

  const handleGetAllMissions = useCallback(async () => {
    let page: number = 1;
    let next: boolean = true;
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
        const response =
          user?.role === 'admin'
            ? await missionService.adminGetMissions({ page })
            : user?.role === 'affreteur'
              ? await missionService.getAffreteurMissions({ page })
              : await missionService.getTransporteurMissions({ page });

        if (response.error) {
          console.error('API error:', response.error);
          next = false;
          break;
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

          setMissions(missionsList.missions.data);
          next = response.data.pagination.hasNext || false;
          if (next) page += 1;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [user?.role, setMissions]);

  const filterMissions = (filters: MissionFilterParams) => {
    return missions.filter((mission) => {
      const searchTerm = filters.search?.toLowerCase();
      const matchesName = searchTerm ? mission.titre.toLowerCase().includes(searchTerm) : true;
      const matchesDescription =
        searchTerm && mission.description
          ? mission.description.toLowerCase().includes(searchTerm)
          : true;
      const matchesCategory =
        searchTerm && mission.typeMarchandise
          ? mission.typeMarchandise.toLowerCase().includes(searchTerm)
          : true;

      return (
        (matchesName || matchesDescription || matchesCategory) &&
        (!filters.typeMarchandise ||
          filters.typeMarchandise.length === 0 ||
          filters.typeMarchandise.includes(mission.typeMarchandise)) &&
        (!filters.status ||
          filters.status.length === 0 ||
          filters.status.includes(mission.status)) &&
        (!filters.budgetMin || Number(mission.budgetMin) >= filters.budgetMin) &&
        (!filters.budgetMax || Number(mission.budgetMax) <= filters.budgetMax) &&
        (!filters.city ||
          mission.adresseDepart?.city.toLowerCase().includes(filters.city.toLowerCase()))
      );
    });
  };

  useEffect(() => {
    if (isAuthenticated) handleGetAllMissions();
  }, [handleGetAllMissions, isAuthenticated]);

  return {
    // State
    missions,
    currentMission,
    isLoading,
    error,

    // Actions
    setMissions,
    addMission,
    updateMission,
    deleteMission,
    setCurrentMission,
    setLoading,
    setError,
    filterMissions,
  };
}
