import { useMissionStore } from '@/stores/missionStore';
import { useAuth } from './useAuth';
import { missionService } from '@/services/mission.service';
import type { Mission, MissionFilterParams } from '@/types/mission.types';
import type { PaginatedMetaResponse } from '@/types/common.types';
import { useCallback, useEffect } from 'react';
import { adminService } from '@/services/admin.service';

export function useMissions() {
  const { isAuthenticated, user } = useAuth();

  const missions = useMissionStore((s) => s.missions);
  const myMissions = useMissionStore((s) => s.myMissions);
  const currentMission = useMissionStore((s) => s.currentMission);
  const stats = useMissionStore((s) => s.stats);
  const isLoading = useMissionStore((s) => s.isLoading);
  const error = useMissionStore((s) => s.error);
  const setMissions = useMissionStore((s) => s.setMissions);
  const setMyMissions = useMissionStore((s) => s.setMyMissions);
  const setStats = useMissionStore((s) => s.setStats);
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
            ? await adminService.adminGetMissions({ page })
            : user?.role === 'affreteur'
              ? await missionService.getAffreteurMissions({ page })
              : await missionService.getAvailableMissions({ page });

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

          if (user?.role === 'affreteur') setMyMissions(missionsList.missions.data);
          else setMissions(missionsList.missions.data);

          next = response.data.pagination.hasNext || false;
          if (next) page += 1;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [user?.role, setMyMissions, setMissions]);

  const handleGetMyMissions = useCallback(async () => {
    let page: number = 1;
    let myNext: boolean = true;
    let myMissionsList: PaginatedMetaResponse<Mission, 'missions'> = {
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

    while (myNext) {
      try {
        const response = await missionService.getTransporteurMissions({ page });

        if (response.error) {
          console.error('API error:', response.error);
          myNext = false;
          break;
        }

        if (response.data) {
          if (page === 1) {
            myMissionsList = response.data;
          } else {
            myMissionsList = {
              missions: {
                data: [...myMissionsList.missions.data, ...response.data.missions.data],
                meta: response.data.missions.meta,
              },
              pagination: { ...response.data.pagination },
            };
          }

          setMyMissions(myMissionsList.missions.data);
          myNext = response.data.pagination.hasNext || false;
          if (myNext) page += 1;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [setMyMissions]);

  const handleGetMissionsStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getMissionStats();

      if (response.error) {
        setError(response.error.message);
        return;
      }

      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mission stats');
    } finally {
      setLoading(false);
    }
  }, [setStats, setError, setLoading]);

  const filterMissions = (filters: MissionFilterParams) => {
    return missions.filter((mission) => {
      const searchTerm = filters.search?.toLowerCase();
      const matchesName = searchTerm ? mission.title.toLowerCase().includes(searchTerm) : true;
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
    if (isAuthenticated) {
      handleGetAllMissions();
      if (user?.role === 'transporteur') handleGetMyMissions();
      if (user?.role === 'admin') handleGetMissionsStats();
    }
  }, [
    handleGetAllMissions,
    handleGetMyMissions,
    handleGetMissionsStats,
    isAuthenticated,
    user?.role,
  ]);

  return {
    // State
    missions,
    myMissions,
    currentMission,
    stats,
    isLoading,
    error,

    // Actions
    setMissions,
    setMyMissions,
    setStats,
    addMission,
    updateMission,
    deleteMission,
    setCurrentMission,
    setLoading,
    setError,
    filterMissions,
  };
}
