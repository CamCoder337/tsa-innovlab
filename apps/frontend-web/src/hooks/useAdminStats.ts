import { useAdminStatsStore } from '@/stores/adminStatsStore';

/**
 * Hook for overview statistics (dashboard main stats)
 */
export const useOverviewStats = () => {
  const { overview, fetchOverviewStats } = useAdminStatsStore();

  return {
    stats: overview.data,
    isLoading: overview.isLoading,
    error: overview.error,
    fetchStats: fetchOverviewStats,
  };
};

/**
 * Hook for admin user statistics
 */
export const useAdminUserStats = () => {
  const { users, fetchUserStats } = useAdminStatsStore();

  return {
    stats: users.data,
    isLoading: users.isLoading,
    error: users.error,
    fetchStats: fetchUserStats,
  };
};

/**
 * Hook for admin mission statistics
 */
export const useAdminMissionStats = () => {
  const { missions, fetchMissionStats } = useAdminStatsStore();

  return {
    stats: missions.data,
    isLoading: missions.isLoading,
    error: missions.error,
    fetchStats: fetchMissionStats,
  };
};

/**
 * Hook for admin product statistics
 */
export const useAdminProductStats = () => {
  const { products, fetchProductStats } = useAdminStatsStore();

  return {
    stats: products.data,
    isLoading: products.isLoading,
    error: products.error,
    fetchStats: fetchProductStats,
  };
};

/**
 * Hook for admin feedback statistics
 */
export const useAdminFeedbackStats = () => {
  const { feedbacks, fetchFeedbackStats } = useAdminStatsStore();

  return {
    stats: feedbacks.data,
    isLoading: feedbacks.isLoading,
    error: feedbacks.error,
    fetchStats: fetchFeedbackStats,
  };
};

/**
 * Comprehensive hook for all admin statistics
 */
export const useAllAdminStats = () => {
  const { overview, users, missions, products, feedbacks, fetchAllStats } = useAdminStatsStore();

  const isLoading =
    overview.isLoading ||
    users.isLoading ||
    missions.isLoading ||
    products.isLoading ||
    feedbacks.isLoading;

  const error =
    overview.error || users.error || missions.error || products.error || feedbacks.error;

  return {
    overview: {
      stats: overview.data,
      isLoading: overview.isLoading,
      error: overview.error,
    },
    users: {
      stats: users.data,
      isLoading: users.isLoading,
      error: users.error,
    },
    missions: {
      stats: missions.data,
      isLoading: missions.isLoading,
      error: missions.error,
    },
    products: {
      stats: products.data,
      isLoading: products.isLoading,
      error: products.error,
    },
    feedbacks: {
      stats: feedbacks.data,
      isLoading: feedbacks.isLoading,
      error: feedbacks.error,
    },
    fetchAllStats,
    isLoading,
    error,
  };
};
