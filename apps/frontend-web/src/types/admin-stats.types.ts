/**
 * Admin Statistics Types
 * Based on backend AdminStatsService interfaces
 */

// Revenue Statistics
export interface RevenueStats {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
  evolution: {
    labels: string[];
    today: number[];
    last7Days: number[];
    last30Days: number[];
  };
}

// Order Statistics
export interface OrderStats {
  total: number;
  byStatus: {
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  byPeriod: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
}

// Conversion Statistics
export interface ConversionStats {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
}

// Average Basket Statistics
export interface AverageBasketStats {
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
}

// Top Products
export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

// Quick Statistics
export interface QuickStats {
  totalUsers: number;
  totalProducts: number;
  totalMissions: number;
}

// Overview Statistics (Dashboard main stats)
export interface OverviewStats {
  revenue: RevenueStats;
  orders: OrderStats;
  conversion: ConversionStats;
  averageBasket: AverageBasketStats;
  topProducts: TopProduct[];
  quickStats: QuickStats;
}

// User Statistics
export interface UserStats {
  total: number;
  byRole: {
    admin: number;
    transporteur: number;
    affreteur: number;
    client: number;
  };
  byPeriod: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
  active: number;
  inactive: number;
  emailVerified: number;
  emailUnverified: number;
  mfaEnabled: number;
  evolution: {
    labels: string[];
    data: number[];
  };
}

// Mission Statistics (Admin specific)
export interface AdminMissionStats {
  total: number;
  byStatus: {
    draft: number;
    published: number;
    assigned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  byPeriod: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
  totalBudget: number;
  averageBudget: number;
  completionRate: number;
  topAffreteurs: Array<{
    userId: string;
    userName: string;
    missionCount: number;
  }>;
  topTransporteurs: Array<{
    userId: string;
    userName: string;
    missionCount: number;
  }>;
}

// Product Statistics (Admin specific)
export interface AdminProductStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalStock: number;
  }>;
  totalStock: number;
  totalStockValue: number;
  lowStockCount: number;
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    stock: number;
    stockAlert: number;
  }>;
  outOfStockCount: number;
  outOfStockProducts: Array<{
    productId: string;
    productName: string;
    stock: number;
  }>;
  evolution: {
    labels: string[];
    data: number[];
  };
}

// Feedback Statistics
export interface FeedbackStats {
  total: number;
  averageRating: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  topTransporteurs: Array<{
    transporteurId: string;
    transporteurName: string;
    averageRating: number;
    feedbackCount: number;
  }>;
  worstTransporteurs: Array<{
    transporteurId: string;
    transporteurName: string;
    averageRating: number;
    feedbackCount: number;
  }>;
}

// Chat/Message Statistics (placeholder for future implementation)
export interface ChatStats {
  totalMessages: number;
  totalConversations: number;
  activeConversations: number;
  averageResponseTime: number;
  byPeriod: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
}

// Combined Admin Stats Response Types
export interface AdminStatsResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Store interfaces for stats management
export interface AdminStatsState {
  overview: OverviewStats | null;
  users: UserStats | null;
  missions: AdminMissionStats | null;
  products: AdminProductStats | null;
  feedbacks: FeedbackStats | null;
  chat: ChatStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface AdminStatsActions {
  // Fetch methods
  fetchOverviewStats: () => Promise<void>;
  fetchUserStats: () => Promise<void>;
  fetchMissionStats: () => Promise<void>;
  fetchProductStats: () => Promise<void>;
  fetchFeedbackStats: () => Promise<void>;
  fetchChatStats: () => Promise<void>;
  fetchAllStats: () => Promise<void>;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // Utility methods
  refreshStats: () => Promise<void>;
  getLastUpdated: () => string | null;
}

export type AdminStatsStore = AdminStatsState & AdminStatsActions;

// API Filter types for stats endpoints
export interface StatsFilterParams {
  period?: 'today' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}

// Chart data types for visualization
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }>;
}

export interface PieChartData {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}
