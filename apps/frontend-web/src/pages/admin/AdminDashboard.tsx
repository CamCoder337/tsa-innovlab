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
import { useAdminTranslation, useCommonTranslation } from '@/hooks/useTranslation';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const allStats = useAllAdminStats();
  const { stats: missionStats, isLoading: missionLoading } = useMissions();
  const { stats: productStats, isLoading: productLoading } = useProducts();
  const { userStats, isLoading: userLoading } = useUsers();
  const { t: tAdmin } = useAdminTranslation();
  const { t: tCommon } = useCommonTranslation();

  // Show loading state
  if (allStats.isLoading || missionLoading || productLoading || userLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tsa-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tAdmin('dashboard.loading')}</p>
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
    <div className="flex-1 p-3 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {tAdmin('dashboard.title')}
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          {tAdmin('dashboard.overview.subtitle')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-4 sm:mb-6">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            {tAdmin('dashboard.overview.title')}
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            {tAdmin('users.users')}
          </TabsTrigger>
          <TabsTrigger value="missions" className="text-xs sm:text-sm">
            {tAdmin('missions.title')}
          </TabsTrigger>
          <TabsTrigger value="boutique" className="text-xs sm:text-sm">
            {tAdmin('dashboard.shop.title')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            {tAdmin('analytics.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.overview.totalUsers')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.overview.stats?.quickStats.totalUsers.toLocaleString() ||
                        userStats?.total ||
                        0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.overview.totalMissions')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.overview.stats?.quickStats.totalMissions.toLocaleString() ||
                        missionStats?.totals?.missions?.toLocaleString() ||
                        0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.overview.totalRevenue')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {((allStats.overview.stats?.revenue.total || 0) / 1000000).toFixed(1)}M FCFA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.overview.lowStock')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.products.stats?.lowStockCount ||
                        productStats?.products?.lowStock ||
                        0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('dashboard.labels.topShipper')}s
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 sm:space-y-3">
                  {allStats.missions.stats?.topAffreteurs?.slice(0, 5).map((item) => (
                    <div
                      key={item.userId}
                      className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium text-xs sm:text-sm truncate">{item.userName}</p>
                        <p className="text-xs text-gray-500">
                          {item.missionCount} {tAdmin('dashboard.labels.missions')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {tAdmin('dashboard.labels.topShipper')}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      {tAdmin('dashboard.labels.recent')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('dashboard.labels.topCarrier')}s
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 sm:space-y-3">
                  {allStats.missions.stats?.topTransporteurs?.slice(0, 5).map((item) => (
                    <div
                      key={item.userId}
                      className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium text-xs sm:text-sm truncate">{item.userName}</p>
                        <p className="text-xs text-gray-500">
                          {item.missionCount} {tAdmin('dashboard.labels.missions')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {tAdmin('dashboard.labels.topCarrier')}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      {tAdmin('dashboard.labels.recent')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('dashboard.quickStats')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                      {allStats.users.stats?.byRole.transporteur ||
                        userStats?.byRole?.transporteur ||
                        0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {tCommon('roles.affreteur')}s
                    </p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">
                      {allStats.users.stats?.byRole.affreteur || userStats?.byRole?.affreteur || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {tCommon('roles.transporteur')}s
                    </p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">
                      {allStats.products.stats?.active || productStats?.products?.active || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {tAdmin('dashboard.shop.activeProducts')}
                    </p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">
                      {allStats.missions.stats?.byStatus.completed ||
                        missionStats?.statusStats?.completed ||
                        0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {tAdmin('dashboard.missions.completedMissions')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                {tAdmin('dashboard.recentMissions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 sm:space-y-4">
                {(missionStats?.recentMissions || []).slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {activity.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-1">
                        {activity.affreteur && (
                          <>
                            <span className="truncate">
                              {tAdmin('dashboard.labels.by')} {activity.affreteur}
                            </span>
                            <span className="hidden sm:inline">•</span>
                          </>
                        )}
                        <span>{DashboardUtils.getTimeAgo(activity.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge className={getStatusColor(activity.status)}>
                        {getStatusLabel(activity.status, tCommon)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.users.activeShippers')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.users.stats?.byRole.affreteur.toLocaleString() ||
                        userStats?.byRole?.affreteur?.toLocaleString() ||
                        '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.users.activeCarriers')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.users.stats?.byRole.transporteur.toLocaleString() ||
                        userStats?.byRole?.transporteur?.toLocaleString() ||
                        '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.users.monthlyGrowth')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
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
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-base sm:text-lg">
                  {tAdmin('dashboard.users.userManagement')}
                </span>
                <Link to="/app/users">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {tAdmin('dashboard.users.viewAllUsers')}
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                    {allStats.users.stats?.byRole.admin || userStats?.byRole?.admin || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{tCommon('roles.admin')}s</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    {allStats.users.stats?.byRole.affreteur || userStats?.byRole?.affreteur || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {tCommon('roles.transporteur')}s
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">
                    {allStats.users.stats?.byRole.transporteur ||
                      userStats?.byRole?.transporteur ||
                      0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{tCommon('roles.affreteur')}s</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">
                    {allStats.users.stats?.byRole.client || userStats?.byRole?.client || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{tCommon('roles.client')}s</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {tAdmin('dashboard.users.newUsersThisMonth')}
                  </span>
                  <span className="font-medium text-green-600 text-sm sm:text-base">
                    +{allStats.users.stats?.byPeriod.last30Days || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missions" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.missions.activeMissions')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.missions.stats?.byStatus.assigned.toLocaleString() ||
                        missionStats.statusStats.assigned ||
                        '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.missions.completedMissions')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.missions.stats?.byStatus.completed ||
                        missionStats?.statusStats?.completed ||
                        '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.missions.successRate')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
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
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                {tAdmin('dashboard.missions.missionSupervision')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                      {allStats.missions.stats?.byStatus.published ||
                        missionStats?.statusStats?.published ||
                        0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {getStatusLabel('published', tCommon)}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                      {allStats.missions.stats?.byStatus.assigned ||
                        missionStats?.statusStats?.assigned ||
                        0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {getStatusLabel('assigned', tCommon)}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">
                      {allStats.missions.stats?.byStatus.completed ||
                        missionStats?.statusStats?.completed ||
                        0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {getStatusLabel('completed', tCommon)}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-red-600">
                      {allStats.missions.stats?.byStatus.cancelled ||
                        missionStats?.statusStats?.cancelled ||
                        0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {getStatusLabel('cancelled', tCommon)}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-3 text-sm sm:text-base">
                    {tAdmin('dashboard.missions.recentMissions')}
                  </h4>
                  <div className="space-y-2">
                    {missionStats?.recentMissions?.slice(0, 5)?.map((mission) => (
                      <div
                        key={mission.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-sm truncate">{mission.title}</p>
                          <p className="text-xs text-gray-500">
                            {DashboardUtils.getTimeAgo(mission.createdAt)}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(mission.status)} flex-shrink-0`}>
                          {getStatusLabel(mission.status, tCommon)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boutique" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.shop.totalProducts')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.products.stats?.total || productStats?.products?.total || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.shop.activeProducts')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.products.stats?.active || productStats?.products?.active || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.shop.lowStock')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {allStats.products.stats?.lowStockCount ||
                        productStats?.products?.lowStock ||
                        0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {tAdmin('dashboard.shop.totalValue')}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {productStats?.inventory?.totalValue
                        ? `${(productStats.inventory.totalValue / 1000000).toFixed(1)}M`
                        : '0M'}{' '}
                      FCFA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('dashboard.shop.productStats')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {tAdmin('dashboard.shop.popularProducts')}
                    </span>
                    <span className="font-medium text-sm sm:text-base">
                      {productStats?.products?.active || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {tAdmin('dashboard.shop.activeCategories')}
                    </span>
                    <span className="font-medium text-sm sm:text-base">
                      {productStats?.topCategories?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {tAdmin('dashboard.shop.lowStockRate')}
                    </span>
                    <span className="font-medium text-sm sm:text-base">
                      {productStats?.products?.total
                        ? `${Math.round(((productStats?.products?.lowStock || 0) / productStats.products.total) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('dashboard.shop.inventory')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                      {productStats?.inventory?.totalQuantity || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {tAdmin('dashboard.shop.totalQuantity')}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">
                      {DashboardUtils.formatCurrency(productStats?.inventory?.totalValue || 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {tAdmin('dashboard.shop.totalValue')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('dashboard.shop.shopSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-sm sm:text-base">
                      {tAdmin('dashboard.shop.productDistribution')}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tCommon('status.active')}s
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${((allStats.products.stats?.active || productStats?.products?.active || 0) / (allStats.products.stats?.total || productStats?.products?.total || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium">
                            {allStats.products.stats?.active || productStats?.products?.active || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.lowStock')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{
                                width: `${((allStats.products.stats?.lowStockCount || productStats?.products?.lowStock || 0) / (allStats.products.stats?.total || productStats?.products?.total || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium">
                            {allStats.products.stats?.lowStockCount ||
                              productStats?.products?.lowStock ||
                              0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.outOfStockShort')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{
                                width: `${((productStats?.products?.outOfStock || 0) / (allStats.products.stats?.total || productStats?.products?.total || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium">
                            {productStats?.products?.outOfStock || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 text-sm sm:text-base">
                      {tAdmin('dashboard.shop.salesPerformance')}
                    </h4>
                    <div className="space-y-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-lg sm:text-xl font-bold text-tsa-blue dark:text-tsa-white">
                          {allStats.overview.stats?.orders.total || 0}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.totalOrders')}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-lg sm:text-xl font-bold text-green-600">
                          {allStats.overview.stats?.revenue.total
                            ? `${allStats.overview.stats.revenue.total.toLocaleString()}`
                            : '0'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.revenueFcfa')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 text-sm sm:text-base">
                      {tAdmin('dashboard.shop.keyIndicators')}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.availabilityRate')}
                        </span>
                        <span className="font-medium text-green-600 text-xs sm:text-sm">
                          {productStats?.products?.total
                            ? `${Math.round(((productStats?.products?.active || 0) / productStats.products.total) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.activeCategories')}
                        </span>
                        <span className="font-medium text-xs sm:text-sm">
                          {productStats?.topCategories?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.averageValuePerProduct')}
                        </span>
                        <span className="font-medium text-xs sm:text-sm">
                          {productStats?.inventory?.totalValue && productStats?.products?.total
                            ? `${Math.round(productStats.inventory.totalValue / productStats.products.total).toLocaleString()} FCFA`
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

        <TabsContent value="analytics" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('dashboard.shop.analytics.performanceAnalysis')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                        {allStats.missions.stats?.byStatus.completed ||
                          missionStats?.statusStats?.completed ||
                          0}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {tAdmin('dashboard.shop.analytics.completedMissions')}
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {((allStats.overview.stats?.revenue.total || 0) / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {tAdmin('dashboard.shop.analytics.totalRevenue')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">
                      {tAdmin('dashboard.shop.analytics.performanceMetrics')}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.analytics.publishedMissions')}
                        </span>
                        <span className="font-medium text-xs sm:text-sm">
                          {allStats.missions.stats?.byStatus.published ||
                            missionStats?.statusStats?.published ||
                            0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.analytics.assignedMissions')}
                        </span>
                        <span className="font-medium text-xs sm:text-sm">
                          {allStats.missions.stats?.byStatus.assigned ||
                            missionStats?.statusStats?.assigned ||
                            0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.analytics.completionRate')}
                        </span>
                        <span className="font-medium text-xs sm:text-sm">
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
                        <span className="text-xs sm:text-sm text-gray-600">
                          {tAdmin('dashboard.shop.analytics.activeUsers')}
                        </span>
                        <span className="font-medium text-xs sm:text-sm">
                          {allStats.users.stats?.active || userStats?.byStatus.active || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('dashboard.shop.analytics.revenueDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h4 className="font-medium mb-3 text-sm sm:text-base">
                        {tAdmin('dashboard.shop.analytics.distributionByRole')}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">
                            {tCommon('roles.affreteur')}s
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-tsa-blue h-2 rounded-full"
                                style={{
                                  width: `${((allStats.users.stats?.byRole?.affreteur || userStats?.byRole.affreteur || 0) / (allStats.users.stats?.total || userStats?.total || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-medium">
                              {allStats.users.stats?.byRole?.affreteur ||
                                userStats?.byRole.affreteur ||
                                0}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">
                            {tCommon('roles.transporteur')}s
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${((allStats.users.stats?.byRole?.transporteur || userStats?.byRole.transporteur || 0) / (allStats.users.stats?.total || userStats?.total || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-medium">
                              {allStats.users.stats?.byRole?.transporteur ||
                                userStats?.byRole.transporteur ||
                                0}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">
                            {tCommon('roles.client')}s
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${((allStats.users.stats?.byRole?.client || userStats?.byRole.client || 0) / (allStats.users.stats?.total || userStats?.total || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-medium">
                              {allStats.users.stats?.byRole?.client ||
                                userStats?.byRole.client ||
                                0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3 text-sm sm:text-base">
                        {tAdmin('dashboard.shop.analytics.revenueByPeriod')}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-600">
                            {tAdmin('dashboard.shop.analytics.today')}
                          </span>
                          <span className="font-medium text-xs sm:text-sm">
                            {DashboardUtils.formatCurrency(
                              allStats.overview.stats?.revenue?.today || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-600">
                            {tAdmin('dashboard.shop.analytics.last7Days')}
                          </span>
                          <span className="font-medium text-xs sm:text-sm">
                            {DashboardUtils.formatCurrency(
                              allStats.overview.stats?.revenue?.last7Days || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-600">
                            {tAdmin('dashboard.shop.analytics.last30Days')}
                          </span>
                          <span className="font-medium text-xs sm:text-sm">
                            {DashboardUtils.formatCurrency(
                              allStats.overview.stats?.revenue?.last30Days || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-600">
                            {tAdmin('dashboard.shop.analytics.total')}
                          </span>
                          <span className="font-medium text-green-600 text-xs sm:text-sm">
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
