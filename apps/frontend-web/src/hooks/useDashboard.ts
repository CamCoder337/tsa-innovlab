import { useDashboardStore } from '@/stores/dashboardStore';

export function useDashboard() {
  const stats = useDashboardStore((s) => s.stats);
  const recentActivities = useDashboardStore((s) => s.recentActivities);
  const missionChartData = useDashboardStore((s) => s.missionChartData);
  const revenueChartData = useDashboardStore((s) => s.revenueChartData);
  const userGrowthData = useDashboardStore((s) => s.userGrowthData);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const error = useDashboardStore((s) => s.error);
  const lastUpdated = useDashboardStore((s) => s.lastUpdated);

  // Actions
  const setStats = useDashboardStore((s) => s.setStats);
  const setRecentActivities = useDashboardStore((s) => s.setRecentActivities);
  const setMissionChartData = useDashboardStore((s) => s.setMissionChartData);
  const setRevenueChartData = useDashboardStore((s) => s.setRevenueChartData);
  const setUserGrowthData = useDashboardStore((s) => s.setUserGrowthData);
  const setLoading = useDashboardStore((s) => s.setLoading);
  const setError = useDashboardStore((s) => s.setError);

  // Utility methods
  const getStatsByRole = useDashboardStore((s) => s.getStatsByRole);
  const getActivityByType = useDashboardStore((s) => s.getActivityByType);

  return {
    // State
    stats,
    recentActivities,
    missionChartData,
    revenueChartData,
    userGrowthData,
    isLoading,
    error,
    lastUpdated,

    // Actions
    setStats,
    setRecentActivities,
    setMissionChartData,
    setRevenueChartData,
    setUserGrowthData,
    setLoading,
    setError,

    // Utility methods
    getStatsByRole,
    getActivityByType,
  };
}

// Specialized hooks for common use cases
export function useDashboardOverview() {
  return useDashboardStore((state) => state.stats?.overview);
}

export function useRecentActivities(limit: number = 5) {
  return useDashboardStore((state) => state.recentActivities.slice(0, limit));
}

export function useMissionStats() {
  return useDashboardStore((state) => state.stats?.missions);
}

export function useProductStats() {
  return useDashboardStore((state) => state.stats?.products);
}

export function useUserStats() {
  return useDashboardStore((state) => state.stats?.users);
}

export function useRevenueStats() {
  return useDashboardStore((state) => state.stats?.revenue);
}

export function useChartData() {
  return useDashboardStore((state) => ({
    missions: state.missionChartData,
    revenue: state.revenueChartData,
    userGrowth: state.userGrowthData,
  }));
}
