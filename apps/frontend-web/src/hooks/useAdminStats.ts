import { useState } from 'react';
import { adminService } from '@/services/admin.service';
import type {
  OverviewStats,
  AdminMissionStats,
  AdminProductStats,
  UserStats as AdminUserStats,
  FeedbackStats,
} from '@/types/admin-stats.types';

/**
 * Hook for overview statistics (dashboard main stats)
 */
export const useOverviewStats = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getOverviewStats();

      if (response.error) {
        console.log('overview error ', response.error.message);
        setError(response.error.message);
        return;
      }

      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch overview stats');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};

/**
 * Hook for admin user statistics
 */
export const useAdminUserStats = () => {
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getAdminUserStats();

      if (response.error) {
        console.log('user error ', response.error.message);
        setError(response.error.message);
        return;
      }

      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};

/**
 * Hook for admin mission statistics
 */
export const useAdminMissionStats = () => {
  const [stats, setStats] = useState<AdminMissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getAdminMissionStats();

      if (response.error) {
        console.log('mission error ', response.error.message);
        setError(response.error.message);
        return;
      }

      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mission stats');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};

/**
 * Hook for admin product statistics
 */
export const useAdminProductStats = () => {
  const [stats, setStats] = useState<AdminProductStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getAdminProductsStats();

      if (response.error) {
        console.log('product error ', response.error.message);
        setError(response.error.message);
        return;
      }

      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product stats');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};

/**
 * Hook for admin feedback statistics
 */
export const useAdminFeedbackStats = () => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getFeedbackStats();

      if (response.error) {
        console.log('feed error ', response.error.message);
        setError(response.error.message);
        return;
      }

      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback stats');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};

/**
 * Comprehensive hook for all admin statistics
 */
export const useAllAdminStats = () => {
  const overviewStats = useOverviewStats();
  const userStats = useAdminUserStats();
  const missionStats = useAdminMissionStats();
  const productStats = useAdminProductStats();
  const feedbackStats = useAdminFeedbackStats();

  const fetchAllStats = async () => {
    await Promise.all([
      overviewStats.fetchStats(),
      userStats.fetchStats(),
      missionStats.fetchStats(),
      productStats.fetchStats(),
      feedbackStats.fetchStats(),
    ]);
  };

  const isLoading =
    overviewStats.isLoading ||
    userStats.isLoading ||
    missionStats.isLoading ||
    productStats.isLoading ||
    feedbackStats.isLoading;

  const error =
    overviewStats.error ||
    userStats.error ||
    missionStats.error ||
    productStats.error ||
    feedbackStats.error;

  return {
    overview: overviewStats,
    users: userStats,
    missions: missionStats,
    products: productStats,
    feedbacks: feedbackStats,
    fetchAllStats,
    isLoading,
    error,
  };
};
