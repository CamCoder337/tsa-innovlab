import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  XCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Truck,
} from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { useProducts } from '@/hooks/useProducts';
import { useUsers } from '@/hooks/useUsers';
import { DashboardUtils } from '@/lib/dashboard.utils';
import { getStatusColor, getStatusLabel } from '@/lib/mission-utils';
import type { MissionStatus } from '@/types/mission.types';

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
    recent: Array<{
      id: string;
      title: string;
      status: MissionStatus;
      affreteur: string | null;
      createdAt: string;
    }>;
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
  const { users, userStats, isLoading: userStatsLoading, error: userStatsError } = useUsers();

  const [stats, setStats] = useState<OverallStats>({} as OverallStats);

  // Calculate real statistics from API data
  useEffect(() => {
    if (missionStats && productStats && userStats) {
      const calculatedStats = {
        overview: {
          totalUsers: userStats.total || 0,
          totalMissions: missionStats.totals?.missions || 0,
          totalProducts: productStats.products?.totalProducts || 0,
          totalRevenue: productStats.inventory?.totalValue || 0,
          activeTransporteurs: userStats.byRole?.transporteur || 0,
          activeAffreteurs: userStats.byRole?.affreteur || 0,
        },
        missions: {
          published: missionStats.statusStats?.published || 0,
          assigned: missionStats.statusStats?.assigned || 0,
          inProgress: missionStats.statusStats?.in_progress || 0,
          completed: missionStats.statusStats?.completed || 0,
          cancelled: missionStats.statusStats?.cancelled || 0,
          recent: missionStats.recentMissions || [],
        },
        products: {
          total: productStats.products?.totalProducts || 0,
          active: productStats.products?.activeProducts || 0,
          lowStock: productStats.products?.lowStockProducts || 0,
          outOfStock: productStats.products?.outOfStockProducts || 0,
          totalValue: productStats.inventory?.totalValue || 0,
        },
        users: {
          total: userStats.total || 0,
          admins: userStats.byRole?.admin || 0,
          transporteurs: userStats.byRole?.transporteur || 0,
          affreteurs: userStats.byRole?.affreteur || 0,
          activeToday: DashboardUtils.calculateActiveUsersToday(users) || 0,
          newThisMonth: DashboardUtils.calculateNewUsersThisMonth(users) || 0,
        },
        revenue: {
          today:
            missions.length > 0 ? DashboardUtils.calculateTimeBasedEarnings(missions).today : 0,
          thisWeek:
            missions.length > 0 ? DashboardUtils.calculateTimeBasedEarnings(missions).week : 0,
          thisMonth:
            missions.length > 0 ? DashboardUtils.calculateTimeBasedEarnings(missions).month : 0,
          thisYear: productStats.inventory?.totalValue,
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
  }, [missionStats, productStats, userStats, missions, users, setStats]);

  // Show loading state
  if (missionStatsLoading || productStatsLoading || userStatsLoading) {
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
  if (missionStatsError || productStatsError || userStatsError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Erreur lors du chargement des statistiques</p>
          <p className="text-gray-600 text-sm">
            {missionStatsError || productStatsError || userStatsError}
          </p>
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
                  {stats?.missions?.recent?.slice(0, 3)?.map((mission) => {
                    const statusLabel = getStatusLabel(mission.status);
                    const StatusIcon =
                      mission.status === 'completed'
                        ? CheckCircle
                        : mission.status === 'assigned'
                          ? Truck
                          : mission.status === 'published'
                            ? Users
                            : mission.status === 'cancelled'
                              ? XCircle
                              : Clock; // draft status

                    return (
                      <div className="flex items-center gap-3" key={mission.id}>
                        <div
                          className={`p-2 rounded-lg ${
                            mission.status === 'completed'
                              ? 'bg-green-100'
                              : mission.status === 'assigned'
                                ? 'bg-blue-100'
                                : mission.status === 'published'
                                  ? 'bg-purple-100'
                                  : mission.status === 'cancelled'
                                    ? 'bg-red-100'
                                    : 'bg-gray-100' // draft
                          }`}
                        >
                          <StatusIcon
                            className={`h-4 w-4 ${
                              mission.status === 'completed'
                                ? 'text-green-600'
                                : mission.status === 'assigned'
                                  ? 'text-blue-600'
                                  : mission.status === 'published'
                                    ? 'text-purple-600'
                                    : mission.status === 'cancelled'
                                      ? 'text-red-600'
                                      : 'text-gray-600' // draft
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{`Mission ${mission.title} ${statusLabel.toLowerCase()}`}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(mission.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
              <CardTitle className="flex items-center justify-between">
                Gestion des Utilisateurs
                <Link to="/admin/users">
                  <Button variant="outline" size="sm">
                    Voir tous les utilisateurs
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats?.users?.admins || 0}</p>
                  <p className="text-sm text-gray-600">Administrateurs</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.users?.affreteurs || 0}
                  </p>
                  <p className="text-sm text-gray-600">Affréteurs</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {stats?.users?.transporteurs || 0}
                  </p>
                  <p className="text-sm text-gray-600">Transporteurs</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {stats?.users?.activeToday || 0}
                  </p>
                  <p className="text-sm text-gray-600">Utilisateurs actifs</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nouveaux utilisateurs ce mois</span>
                  <span className="font-medium text-green-600">
                    +{stats?.users?.newThisMonth || 0}
                  </span>
                </div>
              </div>
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
