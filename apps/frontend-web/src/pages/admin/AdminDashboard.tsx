import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { useProducts } from '@/hooks/useProducts';
import { DashboardUtils } from '@/lib/dashboard.utils';
import { getStatusColor, getStatusLabel } from '@/lib/mission-utils';

interface OverallStats {
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
    admins: number; // This would need to come from a user stats endpoint
    transporteurs: number;
    affreteurs: number;
    activeToday: number; // Mock calculation
    newThisMonth: number; // Mock calculation
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    growth: {
      daily: number; // These would need to come from analytics endpoints
      weekly: number;
      monthly: number;
      yearly: number;
    };
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Store hooks
  const {
    missions,
    stats: missionStats,
    isLoading: missionStatsLoading,
    error: missionStatsError,
  } = useMissions();
  const {
    stats: productStats,
    isLoading: productStatsLoading,
    error: productStatsError,
  } = useProducts();

  const [stats, setStats] = useState<OverallStats>({} as OverallStats);

  // Calculate real statistics from API data
  useEffect(() => {
    if (missionStats && productStats) {
      const calculatedStats = {
        overview: {
          totalUsers: missionStats.totals.affreteurs + missionStats.totals.transporteurs || 0,
          totalMissions: missionStats.totals.missions || 0,
          totalProducts: productStats.products.totalProducts || 0,
          totalRevenue: productStats.inventory.totalValue || 0,
          activeTransporteurs: missionStats.totals.transporteurs || 0,
          activeAffreteurs: missionStats.totals.affreteurs || 0,
        },
        missions: {
          published: missionStats.statusStats.published || 0,
          assigned: missionStats.statusStats.assigned || 0,
          inProgress: missionStats.statusStats.in_progress || 0,
          completed: missionStats.statusStats.completed || 0,
          cancelled: missionStats.statusStats.cancelled || 0,
          totalValue: productStats.inventory.totalValue,
        },
        products: {
          total: productStats.products.totalProducts,
          active: productStats.products.activeProducts,
          lowStock: productStats.products.lowStockProducts,
          outOfStock: productStats.products.outOfStockProducts,
          totalValue: productStats.inventory.totalValue,
        },
        users: {
          total: missionStats.totals.affreteurs + missionStats.totals.transporteurs,
          admins: 5, // This would need to come from a user stats endpoint
          transporteurs: missionStats.totals.transporteurs,
          affreteurs: missionStats.totals.affreteurs,
          activeToday: Math.floor(
            (missionStats.totals.affreteurs + missionStats.totals.transporteurs) * 0.2
          ), // Mock calculation
          newThisMonth: Math.floor(
            (missionStats.totals.affreteurs + missionStats.totals.transporteurs) * 0.05
          ), // Mock calculation
        },
        revenue: {
          today:
            missions.length > 0 ? DashboardUtils.calculateTimeBasedEarnings(missions).today : 0,
          thisWeek:
            missions.length > 0 ? DashboardUtils.calculateTimeBasedEarnings(missions).week : 0,
          thisMonth:
            missions.length > 0 ? DashboardUtils.calculateTimeBasedEarnings(missions).month : 0,
          thisYear: productStats.inventory.totalValue,
          growth: {
            daily: 12.5, // These would need to come from analytics endpoints
            weekly: 8.3,
            monthly: 15.7,
            yearly: 23.4,
          },
        },
      };

      setStats(calculatedStats);
    }
  }, [missionStats, productStats, missions, setStats]);

  // Show loading state
  if (missionStatsLoading || productStatsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (missionStatsError || productStatsError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Erreur lors du chargement des statistiques</p>
          <p className="text-gray-600 text-sm">{missionStatsError || productStatsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord Administrateur</h1>
        <p className="text-gray-600">Vue d'ensemble de la plateforme TSA Logistics</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Utilisateurs Total</p>
                    <p className="text-2xl font-bold">
                      {stats?.overview?.totalUsers.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Missions Total</p>
                    <p className="text-2xl font-bold">
                      {stats?.overview?.totalMissions.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Revenus Total</p>
                    <p className="text-2xl font-bold">
                      {((stats?.overview?.totalRevenue || 0) / 1000000).toFixed(1)}M FCFA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Problèmes en Attente</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mission TSA-045 terminée</p>
                      <p className="text-xs text-gray-500">Il y a 2 heures</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Nouveau transporteur inscrit</p>
                      <p className="text-xs text-gray-500">Il y a 4 heures</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mission TSA-046 en retard</p>
                      <p className="text-xs text-gray-500">Il y a 6 heures</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistiques Mensuelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nouvelles missions</span>
                    <span className="font-medium">+127</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nouveaux utilisateurs</span>
                    <span className="font-medium">+89</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenus ce mois</span>
                    <span className="font-medium text-green-600">
                      {((stats?.revenue?.thisMonth || 0) / 1000000).toFixed(1)}M FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taux de réussite</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Missions Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(missionStats.recentMissions || []).slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        {activity.affreteur && (
                          <>
                            <span>Par: {activity.affreteur}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{DashboardUtils.getTimeAgo(activity.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(activity.status)}>
                        {getStatusLabel(activity.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Affréteurs Actifs</p>
                    <p className="text-2xl font-bold">
                      {stats?.overview?.activeAffreteurs.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transporteurs Actifs</p>
                    <p className="text-2xl font-bold">
                      {stats?.overview?.activeTransporteurs.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Croissance Mensuelle</p>
                    <p className="text-2xl font-bold">+12.5%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Interface de gestion des utilisateurs à implémenter...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Missions Actives</p>
                    <p className="text-2xl font-bold">
                      {stats?.missions?.inProgress.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Missions Terminées</p>
                    <p className="text-2xl font-bold">
                      {stats?.missions?.completed.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taux de Réussite</p>
                    <p className="text-2xl font-bold">94.2%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Supervision des Missions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Interface de supervision des missions à implémenter...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analyses de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Graphiques et analyses détaillées à implémenter...</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition des Revenus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Graphiques de répartition à implémenter...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
