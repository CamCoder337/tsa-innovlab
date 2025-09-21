import { create } from 'zustand';

export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalMissions: number;
    totalProducts: number;
    totalRevenue: number;
    activeTransporteurs: number;
    activeAffreteurs: number;
  };
  missions: {
    published: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    totalValue: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  users: {
    total: number;
    admins: number;
    transporteurs: number;
    affreteurs: number;
    activeToday: number;
    newThisMonth: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    growth: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  };
}

export interface RecentActivity {
  id: string;
  type:
    | 'mission_created'
    | 'mission_assigned'
    | 'mission_completed'
    | 'user_registered'
    | 'product_added'
    | 'order_placed';
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  timestamp: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }>;
}

export interface DashboardState {
  stats: DashboardStats | null;
  recentActivities: RecentActivity[];
  missionChartData: ChartData | null;
  revenueChartData: ChartData | null;
  userGrowthData: ChartData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface DashboardActions {
  setStats: (stats: DashboardStats) => void;
  setRecentActivities: (activities: RecentActivity[]) => void;
  setMissionChartData: (data: ChartData) => void;
  setRevenueChartData: (data: ChartData) => void;
  setUserGrowthData: (data: ChartData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface DashboardStoreExtended extends DashboardState, DashboardActions {
  getStatsByRole: (role: string) => void;
  getActivityByType: (type: string) => RecentActivity[];
}

// Mock data
const mockStats: DashboardStats = {
  overview: {
    totalUsers: 1247,
    totalMissions: 856,
    totalProducts: 342,
    totalRevenue: 45780000, // 45.78M FCFA
    activeTransporteurs: 89,
    activeAffreteurs: 156,
  },
  missions: {
    published: 23,
    assigned: 45,
    inProgress: 67,
    completed: 721,
    cancelled: 12,
    totalValue: 125600000, // 125.6M FCFA
  },
  products: {
    total: 342,
    active: 298,
    lowStock: 23,
    outOfStock: 8,
    totalValue: 89400000, // 89.4M FCFA
  },
  users: {
    total: 1247,
    admins: 5,
    transporteurs: 456,
    affreteurs: 786,
    activeToday: 234,
    newThisMonth: 67,
  },
  revenue: {
    today: 1250000, // 1.25M FCFA
    thisWeek: 8900000, // 8.9M FCFA
    thisMonth: 34500000, // 34.5M FCFA
    thisYear: 345600000, // 345.6M FCFA
    growth: {
      daily: 12.5,
      weekly: 8.3,
      monthly: 15.7,
      yearly: 23.4,
    },
  },
};

const mockActivities: RecentActivity[] = [
  {
    id: 'act-001',
    type: 'mission_created',
    title: 'Nouvelle mission créée',
    description: 'Transport Électronique Douala → Yaoundé',
    userId: 'user-aff-1',
    userName: 'Alice Doe',
    timestamp: '2025-01-23T14:30:00Z',
  },
  {
    id: 'act-002',
    type: 'mission_assigned',
    title: 'Mission assignée',
    description: 'Transport Matériaux Construction assigné à Peter Ngala',
    userId: 'user-tr-1',
    userName: 'Peter Ngala',
    timestamp: '2025-01-23T13:15:00Z',
  },
  {
    id: 'act-003',
    type: 'user_registered',
    title: 'Nouvel utilisateur',
    description: 'Nouveau transporteur enregistré',
    userId: 'user-tr-15',
    userName: 'Jean Kamdem',
    timestamp: '2025-01-23T12:45:00Z',
  },
  {
    id: 'act-004',
    type: 'product_added',
    title: 'Nouveau produit',
    description: 'Pièce Moteur Diesel CAT 3306 ajoutée',
    userId: 'user-ad-1',
    userName: 'Maya Kamga',
    timestamp: '2025-01-23T11:20:00Z',
  },
  {
    id: 'act-005',
    type: 'mission_completed',
    title: 'Mission terminée',
    description: 'Transport Textiles Kribi → Bertoua complété',
    userId: 'user-tr-3',
    userName: 'Paul Mbarga',
    timestamp: '2025-01-23T10:30:00Z',
  },
];

const mockMissionChartData: ChartData = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Missions Créées',
      data: [65, 78, 90, 81, 96, 105],
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgb(59, 130, 246)',
      fill: true,
    },
    {
      label: 'Missions Complétées',
      data: [45, 52, 68, 74, 83, 91],
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgb(34, 197, 94)',
      fill: true,
    },
  ],
};

const mockRevenueChartData: ChartData = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Revenus (FCFA)',
      data: [12500000, 15600000, 18900000, 16700000, 21300000, 24800000],
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      borderColor: 'rgb(168, 85, 247)',
      fill: true,
    },
  ],
};

const mockUserGrowthData: ChartData = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Transporteurs',
      data: [120, 135, 148, 162, 178, 195],
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgb(239, 68, 68)',
    },
    {
      label: 'Affréteurs',
      data: [89, 102, 118, 134, 151, 167],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgb(34, 197, 94)',
    },
  ],
};

function persistDashboardToLocalStorage<T>(data: T, key: string) {
  try {
    localStorage.setItem(`dashboard_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to persist ${key} to localStorage:`, error);
  }
}

const loadDashboardFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(`dashboard_${key}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
  }
  return defaultValue;
};

export const useDashboardStore = create<DashboardStoreExtended>((set, get) => ({
  // State
  stats: loadDashboardFromLocalStorage('stats', mockStats),
  recentActivities: loadDashboardFromLocalStorage('activities', mockActivities),
  missionChartData: loadDashboardFromLocalStorage('mission_chart', mockMissionChartData),
  revenueChartData: loadDashboardFromLocalStorage('revenue_chart', mockRevenueChartData),
  userGrowthData: loadDashboardFromLocalStorage('user_growth', mockUserGrowthData),
  isLoading: false,
  error: null,
  lastUpdated: loadDashboardFromLocalStorage('last_updated', new Date().toISOString()),

  // Actions
  setStats: (stats: DashboardStats) => {
    set({ stats, lastUpdated: new Date().toISOString() });
    persistDashboardToLocalStorage(stats, 'stats');
    persistDashboardToLocalStorage(new Date().toISOString(), 'last_updated');
  },

  setRecentActivities: (activities: RecentActivity[]) => {
    set({ recentActivities: activities });
    persistDashboardToLocalStorage(activities, 'activities');
  },

  setMissionChartData: (data: ChartData) => {
    set({ missionChartData: data });
    persistDashboardToLocalStorage(data, 'mission_chart');
  },

  setRevenueChartData: (data: ChartData) => {
    set({ revenueChartData: data });
    persistDashboardToLocalStorage(data, 'revenue_chart');
  },

  setUserGrowthData: (data: ChartData) => {
    set({ userGrowthData: data });
    persistDashboardToLocalStorage(data, 'user_growth');
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  getStatsByRole: (role: string) => {
    const stats = get().stats;
    if (!stats) return null;

    switch (role) {
      case 'admin':
        return stats;
      case 'transporteur':
        return {
          missions: {
            available: stats.missions.published,
            assigned: stats.missions.assigned,
            completed: stats.missions.completed,
          },
          revenue: stats.revenue,
        };
      case 'affreteur':
        return {
          missions: {
            created: stats.missions.published + stats.missions.assigned + stats.missions.completed,
            active: stats.missions.assigned + stats.missions.inProgress,
            completed: stats.missions.completed,
          },
          products: {
            available: stats.products.active,
            categories: Math.floor(stats.products.total / 10), // Rough estimate
          },
        };
      default:
        return null;
    }
  },

  getActivityByType: (type: string) => {
    return get().recentActivities.filter((activity) => activity.type === type);
  },
}));

// Selector hooks for common use cases
export const useDashboardOverview = () => {
  return useDashboardStore((state) => state.stats?.overview);
};

export const useRecentActivities = (limit: number = 5) => {
  return useDashboardStore((state) => state.recentActivities.slice(0, limit));
};

export const useMissionStats = () => {
  return useDashboardStore((state) => state.stats?.missions);
};

export const useProductStats = () => {
  return useDashboardStore((state) => state.stats?.products);
};

export const useUserStats = () => {
  return useDashboardStore((state) => state.stats?.users);
};

export const useRevenueStats = () => {
  return useDashboardStore((state) => state.stats?.revenue);
};

export const useChartData = () => {
  return useDashboardStore((state) => ({
    missions: state.missionChartData,
    revenue: state.revenueChartData,
    userGrowth: state.userGrowthData,
  }));
};
