import { useCallback } from 'react';
import { useMissionStore } from '@/stores/missionStore';
import type { Mission, MissionStatus } from '@/types/mission.types';

/**
 * Main missions hook providing all mission functionality
 */
export const useMissions = () => {
  const store = useMissionStore();

  const getMissionById = useCallback(
    (id: string): Mission | undefined => {
      return (
        store.missions.find((mission) => mission.id === id) ||
        store.myMissions.find((mission) => mission.id === id)
      );
    },
    [store.missions, store.myMissions]
  );

  const getMissionsByStatus = useCallback(
    (status: MissionStatus): Mission[] => {
      return [...store.missions, ...store.myMissions].filter(
        (mission) => mission.status === status
      );
    },
    [store.missions, store.myMissions]
  );

  const getActiveMissions = useCallback((): Mission[] => {
    return [...store.missions, ...store.myMissions].filter(
      (mission) => mission.status === 'published' || mission.status === 'assigned'
    );
  }, [store.missions, store.myMissions]);

  const getCompletedMissions = useCallback((): Mission[] => {
    return [...store.missions, ...store.myMissions].filter(
      (mission) => mission.status === 'completed'
    );
  }, [store.missions, store.myMissions]);

  const getDraftMissions = useCallback((): Mission[] => {
    return store.missions.filter((mission) => mission.status === 'draft');
  }, [store.missions]);

  const searchMissions = useCallback(
    (query: string): Mission[] => {
      if (!query.trim()) return [...store.missions, ...store.myMissions];

      const lowercaseQuery = query.toLowerCase();
      return [...store.missions, ...store.myMissions].filter(
        (mission) =>
          mission.title?.toLowerCase().includes(lowercaseQuery) ||
          mission.description?.toLowerCase().includes(lowercaseQuery) ||
          mission.typeMarchandise?.toLowerCase().includes(lowercaseQuery)
      );
    },
    [store.missions, store.myMissions]
  );

  const getTotalMissions = useCallback(() => {
    return [...store.missions, ...store.myMissions].length;
  }, [store.missions, store.myMissions]);

  const getPublishedMissions = useCallback(() => {
    return [...store.missions, ...store.myMissions].filter(
      (mission) => mission.status === 'published'
    ).length;
  }, [store.missions, store.myMissions]);

  const getInProgressMissions = useCallback(() => {
    return [...store.missions, ...store.myMissions].filter(
      (mission) => mission.status === 'assigned'
    ).length;
  }, [store.missions, store.myMissions]);

  // Memoize fetchMission to prevent infinite loops
  const fetchMissionMemoized = useCallback(
    (id: string) => {
      store.fetchMission(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.currentMission]
  );

  return {
    // State
    missions: store.missions,
    myMissions: store.myMissions,
    currentMission: store.currentMission,
    isLoading: store.isLoading,
    error: store.error,
    stats: store.stats,

    setMissions: store.setMissions,
    setMyMissions: store.setMyMissions,
    setCurrentMission: store.setCurrentMission,
    setStats: store.setStats,

    // Actions
    fetchAllMissions: store.fetchAllMissions,
    fetchMyMissions: store.fetchMyMissions,
    fetchMission: fetchMissionMemoized,
    fetchMissionsStats: store.fetchMissionsStats,
    createMission: store.createMission,
    updateMission: store.updateMission,
    deleteMission: store.deleteMission,
    publishMission: store.publishMission,
    unpublishMission: store.unpublishMission,
    applyMission: store.applyForMission,

    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    reset: store.reset,

    // Helper functions
    getMissionById,
    getMissionsByStatus,
    getActiveMissions,
    getCompletedMissions,
    getDraftMissions,
    searchMissions,
    getTotalMissions,
    getPublishedMissions,
    getInProgressMissions,
  };
};
