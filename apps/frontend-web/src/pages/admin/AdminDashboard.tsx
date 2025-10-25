import { useState } from 'react';
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
  AlertTriangle,
  BarChart3,
  PieChart,
  Truck,
} from 'lucide-react';
import { useAllAdminStats } from '@/hooks/useAdminStats';
import { DashboardUtils } from '@/lib/dashboard.utils';
import { getStatusColor, getStatusLabel } from '@/lib/mission-utils';
import { useMissions } from '@/hooks/useMissions';
import { useProducts } from '@/hooks/useProducts';
import { useUsers } from '@/hooks/useUsers';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const allStats = useAllAdminStats();
  const { stats: missionStats, isLoading: missionLoading } = useMissions();
  const { stats: productStats, isLoading: productLoading } = useProducts();
  const { userStats, isLoading: userLoading } = useUsers();

  // Show loading state
  if (allStats.isLoading || missionLoading || productLoading || userLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  // Show error state
  // if (getStatsError()) {
  //   return (
  //     <div className="flex-1 flex items-center justify-center h-full">
  //       <div className="text-center">
  //         <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
  //         <p className="text-red-600 mb-2">Erreur lors du chargement des statistiques</p>
  //         <p className="text-gray-600 text-sm">
  //           {getStatsError()}
  //         </p>
  //         <Button
  //           onClick={allStats.fetchAllStats}
  //           className="mt-4"
  //           variant="outline"
  //         >
  //           Réessayer
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord Administrateur</h1>
        <p className="text-gray-600">Vue d'ensemble de la plateforme TSA Logistics</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="boutique">Boutique</TabsTrigger>
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
                      {allStats.overview.stats?.quickStats.totalUsers.toLocaleString() ||
                        userStats?.total ||
                        0}
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
                      {allStats.overview.stats?.quickStats.totalMissions.toLocaleString() ||
                        missionStats?.totals?.missions?.toLocaleString() ||
                        0}
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
                      {((allStats.overview.stats?.revenue.total || 0) / 1000000).toFixed(1)}M FCFA
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
                    <p className="text-sm text-gray-600">Stock Faible</p>
                    <p className="text-2xl font-bold">
                      {allStats.products.stats?.lowStockCount ||
                        productStats?.products?.lowStockProducts ||
                        0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Top Affréteurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allStats.missions.stats?.topAffreteurs?.slice(0, 5).map((item) => (
                    <div
                      key={item.userId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.userName}</p>
                        <p className="text-xs text-gray-500">{item.missionCount} missions</p>
                      </div>
                      <Badge variant="secondary">Top Affréteur</Badge>
                    </div>
                  )) || <p className="text-gray-500 text-center py-4">Aucune mission récente</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Top Transporteurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allStats.missions.stats?.topTransporteurs?.slice(0, 5).map((item) => (
                    <div
                      key={item.userId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.userName}</p>
                        <p className="text-xs text-gray-500">{item.missionCount} missions</p>
                      </div>
                      <Badge variant="secondary">Top Affréteur</Badge>
                    </div>
                  )) || <p className="text-gray-500 text-center py-4">Aucune mission récente</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistiques Rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {allStats.users.stats?.byRole.transporteur ||
                        userStats?.byRole?.transporteur ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Transporteurs</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {allStats.users.stats?.byRole.affreteur || userStats?.byRole?.affreteur || 0}
                    </p>
                    <p className="text-sm text-gray-600">Affréteurs</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {allStats.products.stats?.active ||
                        productStats?.products?.activeProducts ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Produits Actifs</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {allStats.missions.stats?.byStatus.completed ||
                        missionStats?.statusStats?.completed ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Missions Terminées</p>
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
                {(missionStats?.recentMissions || []).slice(0, 3).map((activity) => (
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
                      {allStats.users.stats?.byRole.affreteur.toLocaleString() ||
                        userStats?.byRole?.affreteur?.toLocaleString() ||
                        '0'}
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
                      {allStats.users.stats?.byRole.transporteur.toLocaleString() ||
                        userStats?.byRole?.transporteur?.toLocaleString() ||
                        '0'}
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
                    <p className="text-2xl font-bold">
                      {DashboardUtils.calculateGrowthPercentage(
                        allStats.users.stats?.byPeriod.last7Days || 0,
                        allStats.users.stats?.byPeriod.last30Days || 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gestion des Utilisateurs
                <Link to="/app/users">
                  <Button variant="outline" size="sm">
                    Voir tous les utilisateurs
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {allStats.users.stats?.byRole.admin || userStats?.byRole?.admin || 0}
                  </p>
                  <p className="text-sm text-gray-600">Administrateurs</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {allStats.users.stats?.byRole.affreteur || userStats?.byRole?.affreteur || 0}
                  </p>
                  <p className="text-sm text-gray-600">Affréteurs</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {allStats.users.stats?.byRole.transporteur ||
                      userStats?.byRole?.transporteur ||
                      0}
                  </p>
                  <p className="text-sm text-gray-600">Transporteurs</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {allStats.users.stats?.byRole.client || userStats?.byRole?.client || 0}
                  </p>
                  <p className="text-sm text-gray-600">Client</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nouveaux utilisateurs ce mois</span>
                  <span className="font-medium text-green-600">
                    +{allStats.users.stats?.byPeriod.last30Days || 0}
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
                      {allStats.missions.stats?.byStatus.assigned.toLocaleString() ||
                        missionStats.statusStats.assigned ||
                        '0'}
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
                      {allStats.missions.stats?.byStatus.completed ||
                        missionStats?.statusStats?.completed ||
                        '0'}
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
                    <p className="text-2xl font-bold">
                      {DashboardUtils.calculateSuccessRate(
                        allStats.missions.stats?.byStatus.completed || 0,
                        allStats.overview.stats?.quickStats.totalMissions || 0
                      )}
                      %
                    </p>
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {allStats.missions.stats?.byStatus.published ||
                        missionStats?.statusStats?.published ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Publiées</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {allStats.missions.stats?.byStatus.assigned ||
                        missionStats?.statusStats?.assigned ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Assignées</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {allStats.missions.stats?.byStatus.completed ||
                        missionStats?.statusStats?.completed ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Terminées</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {allStats.missions.stats?.byStatus.cancelled ||
                        missionStats?.statusStats?.cancelled ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Annulées</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Missions Récentes</h4>
                  <div className="space-y-2">
                    {missionStats?.recentMissions?.slice(0, 5)?.map((mission) => (
                      <div
                        key={mission.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{mission.title}</p>
                          <p className="text-xs text-gray-500">
                            {DashboardUtils.getTimeAgo(mission.createdAt)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(mission.status)}>
                          {getStatusLabel(mission.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boutique" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Products Overview */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Produits Total</p>
                    <p className="text-2xl font-bold">
                      {allStats.products.stats?.total || productStats?.products?.totalProducts || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Products */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Produits Actifs</p>
                    <p className="text-2xl font-bold">
                      {allStats.products.stats?.active ||
                        productStats?.products?.activeProducts ||
                        0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Products */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stock Faible</p>
                    <p className="text-2xl font-bold">
                      {allStats.products.stats?.lowStockCount ||
                        productStats?.products?.lowStockProducts ||
                        0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Orders */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Commandes Total</p>
                    <p className="text-2xl font-bold">
                      {allStats.overview.stats?.orders.total || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Products Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Statistiques Produits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {allStats.products.stats?.active ||
                        productStats?.products?.activeProducts ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Actifs</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">
                      {allStats.products.stats?.inactive ||
                        productStats?.products?.inactiveProducts ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Inactifs</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {allStats.products.stats?.lowStockCount ||
                        productStats?.products?.lowStockProducts ||
                        0}
                    </p>
                    <p className="text-sm text-gray-600">Stock Faible</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {productStats?.products?.outOfStockProducts || 0}
                    </p>
                    <p className="text-sm text-gray-600">Rupture Stock</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Top Catégories</h4>
                  <div className="space-y-2">
                    {productStats?.topCategories?.slice(0, 5)?.map((category) => (
                      <div
                        key={category.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{category.name}</p>
                          <p className="text-xs text-gray-500">{category.productCount} produits</p>
                        </div>
                        <Badge variant="secondary">{category.productCount}</Badge>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">Aucune catégorie trouvée</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Value & Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Valeur & Commandes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Valeur Totale Inventaire</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {productStats?.inventory?.totalValue
                        ? `${productStats.inventory.totalValue.toLocaleString()} FCFA`
                        : '0 FCFA'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xl font-bold text-green-600">
                        {allStats.overview.stats?.orders.total || 0}
                      </p>
                      <p className="text-sm text-gray-600">Commandes</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-xl font-bold text-purple-600">
                        {allStats.overview.stats?.revenue.total
                          ? `${allStats.overview.stats.revenue.total.toLocaleString()}`
                          : '0'}
                      </p>
                      <p className="text-sm text-gray-600">Revenus (FCFA)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Produits Populaires</span>
                      <span className="font-medium">
                        {productStats?.products?.activeProducts || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Catégories Actives</span>
                      <span className="font-medium">
                        {productStats?.topCategories?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taux de Stock Faible</span>
                      <span className="font-medium">
                        {productStats?.products?.totalProducts
                          ? `${Math.round(((productStats?.products?.lowStockProducts || 0) / productStats.products.totalProducts) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Products & Orders Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Résumé Boutique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Distribution Produits</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Actifs</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${((allStats.products.stats?.active || productStats?.products?.activeProducts || 0) / (allStats.products.stats?.total || productStats?.products?.totalProducts || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {allStats.products.stats?.active ||
                              productStats?.products?.activeProducts ||
                              0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Stock Faible</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{
                                width: `${((allStats.products.stats?.lowStockCount || productStats?.products?.lowStockProducts || 0) / (allStats.products.stats?.total || productStats?.products?.totalProducts || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {allStats.products.stats?.lowStockCount ||
                              productStats?.products?.lowStockProducts ||
                              0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rupture</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{
                                width: `${((productStats?.products?.outOfStockProducts || 0) / (allStats.products.stats?.total || productStats?.products?.totalProducts || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {productStats?.products?.outOfStockProducts || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Performance Ventes</h4>
                    <div className="space-y-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-600">
                          {allStats.overview.stats?.orders.total || 0}
                        </p>
                        <p className="text-sm text-gray-600">Commandes Totales</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">
                          {allStats.overview.stats?.revenue.total
                            ? `${allStats.overview.stats.revenue.total.toLocaleString()}`
                            : '0'}
                        </p>
                        <p className="text-sm text-gray-600">Revenus (FCFA)</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Indicateurs Clés</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Taux de Disponibilité</span>
                        <span className="font-medium text-green-600">
                          {productStats?.products?.totalProducts
                            ? `${Math.round(((productStats?.products?.activeProducts || 0) / productStats.products.totalProducts) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Catégories Actives</span>
                        <span className="font-medium">
                          {productStats?.topCategories?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valeur Moyenne/Produit</span>
                        <span className="font-medium">
                          {productStats?.inventory?.totalValue &&
                          productStats?.products?.totalProducts
                            ? `${Math.round(productStats.inventory.totalValue / productStats.products.totalProducts).toLocaleString()} FCFA`
                            : '0 FCFA'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {allStats.missions.stats?.byStatus.completed ||
                          missionStats?.statusStats?.completed ||
                          0}
                      </p>
                      <p className="text-sm text-gray-600">Missions Terminées</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {((allStats.overview.stats?.revenue.total || 0) / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-sm text-gray-600">Revenus Total</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Métriques de Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Missions Publiées</span>
                        <span className="font-medium">
                          {allStats.missions.stats?.byStatus.published ||
                            missionStats?.statusStats?.published ||
                            0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Missions Assignées</span>
                        <span className="font-medium">
                          {allStats.missions.stats?.byStatus.assigned ||
                            missionStats?.statusStats?.assigned ||
                            0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Taux de Completion</span>
                        <span className="font-medium">
                          {DashboardUtils.calculateSuccessRate(
                            allStats.missions.stats?.byStatus.completed ||
                              missionStats?.statusStats?.completed ||
                              0,
                            allStats.missions.stats?.total || missionStats?.totals.missions || 0
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Utilisateurs Actifs</span>
                        <span className="font-medium">
                          {allStats.users.stats?.active || userStats?.byStatus.active || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h4 className="font-medium mb-3">Répartition par Rôle</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Affréteurs</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${((allStats.users.stats?.byRole?.affreteur || userStats?.byRole.affreteur || 0) / (allStats.users.stats?.total || userStats?.total || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {allStats.users.stats?.byRole?.affreteur ||
                                userStats?.byRole.affreteur ||
                                0}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Transporteurs</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${((allStats.users.stats?.byRole?.transporteur || userStats?.byRole.transporteur || 0) / (allStats.users.stats?.total || userStats?.total || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {allStats.users.stats?.byRole?.transporteur ||
                                userStats?.byRole.transporteur ||
                                0}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Clients</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${((allStats.users.stats?.byRole?.client || userStats?.byRole.client || 0) / (allStats.users.stats?.total || userStats?.total || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {allStats.users.stats?.byRole?.client ||
                                userStats?.byRole.client ||
                                0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Revenus par Période</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Aujourd'hui</span>
                          <span className="font-medium">
                            {DashboardUtils.formatCurrency(
                              allStats.overview.stats?.revenue?.today || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">7 Derniers Jours</span>
                          <span className="font-medium">
                            {DashboardUtils.formatCurrency(
                              allStats.overview.stats?.revenue?.last7Days || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">30 Derniers Jours</span>
                          <span className="font-medium">
                            {DashboardUtils.formatCurrency(
                              allStats.overview.stats?.revenue?.last30Days || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total</span>
                          <span className="font-medium text-green-600">
                            {DashboardUtils.formatCurrency(
                              allStats.overview.stats?.revenue?.total || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
