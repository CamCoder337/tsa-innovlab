import { useState, useEffect, useCallback } from 'react';
import { shopService } from '@/services/shop.service';

interface ProductStats {
  stats: {
    products: {
      total: number;
      active: number;
      inactive: number;
      lowStock: number;
      outOfStock: number;
    };
    inventory: {
      totalValue: number;
    };
    topCategories: Array<{
      name: string;
      productCount: number;
    }>;
  };
}

interface UseProductStatsReturn {
  stats: ProductStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProductStats(): UseProductStatsReturn {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await shopService.getAdminProductStats();

      if (response.error) {
        setError(response.error.message);
        return;
      }

      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
