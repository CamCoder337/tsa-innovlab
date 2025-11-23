import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Download,
  CheckCircle,
  Package,
  Plus,
  DollarSign,
  TrendingUp,
  Star,
  Activity,
} from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { useAllAdminStats } from '@/hooks/useAdminStats';
import type { Mission, MissionStatus } from '@/types/mission.types';
import { type VehicleType, VehicleTypes } from '@/types/vehicle.types';
import { Link, useSearchParams } from 'react-router-dom';
import MissionCard from '@/components/missions/MissionCard';
import {
  useAdminTranslation,
  useCommonTranslation,
  useMissionsTranslation,
  useVehiclesTranslation,
} from '@/hooks/useTranslation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { DashboardUtils } from '@/lib/dashboard.utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getStatusLabel } from '@/lib/utils';

export default function MissionsManagement() {
  const { missions = [], isLoading, error } = useMissions();
  const allStats = useAllAdminStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [filterDestination, setFilterDestination] = useState('all');
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'all'>('all');
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const { t: tAdmin } = useAdminTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tVehicles } = useVehiclesTranslation();

  const filteredMissions = missions.filter((mission: Mission) => {
    const matchesSearch =
      mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseArrivee?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseDepart?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseArrivee?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseDepart?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseArrivee?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.adresseDepart?.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mission.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType =
      typeFilter === 'all' ||
      mission.requiredVehicleType === typeFilter ||
      mission.requiredVehicleType === null;

    // Origin filter
    const matchesOrigin = filterOrigin === 'all' || mission.adresseDepart?.city === filterOrigin;

    // Destination filter
    const matchesDestination =
      filterDestination === 'all' || mission.adresseArrivee?.city === filterDestination;

    return matchesSearch && matchesType && matchesOrigin && matchesDestination;
  });

  const uniqueOrigin = Array.from(
    new Set(
      missions
        .map((mission) => mission.adresseDepart?.city)
        .filter((city) => city && city.trim() !== '')
    )
  ).sort();

  const uniqueDestination = Array.from(
    new Set(
      missions
        .map((mission) => mission.adresseArrivee?.city)
        .filter((city) => city && city.trim() !== '')
    )
  ).sort();

  const exportToCSV = (): void => {
    console.log('Exporting to CSV');
  };

  // Calculate status counts
  const statusCounts = missions.reduce<Record<MissionStatus | 'all' | 'total', number>>(
    (acc, mission) => {
      const status = mission.status;
      acc[status] = (acc[status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    },
    {
      draft: 0,
      published: 0,
      assigned: 0,
      completed: 0,
      cancelled: 0,
      in_progress: 0,
      all: missions.length,
      total: 0,
    } as Record<MissionStatus | 'all' | 'total', number>
  );

  if (isLoading) {
    return <div>{tAdmin('missions.loading')}</div>;
  }

  if (error) {
    return <div>{tAdmin('missions.error')}</div>;
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{tAdmin('missions.title')}</h1>
        <Link to="/app/missions/create" className="w-full sm:w-auto">
          <Button className="bg-tsa-blue hover:bg-tsa-blue/90 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span>{tAdmin('missions.newMission')}</span>
          </Button>
        </Link>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as MissionStatus | 'all')}
        className="space-y-4"
      >
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview">
            {tAdmin('missions.tabs.overview') || "Vue d'ensemble"}
          </TabsTrigger>
          <TabsTrigger value="missions">
            {tAdmin('missions.tabs.allMissions') || 'Toutes les missions'}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            {tAdmin('missions.tabs.analytics') || 'Analytiques'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats - Top 5 */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground h-5 truncate">
                  {tAdmin('missions.stats.totalMissions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-2xl font-bold">{statusCounts.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center h-5">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500 flex-shrink-0" />
                  <span className="truncate">{tCommon('status.completed')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-2xl font-bold">{statusCounts.completed || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center h-5">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-purple-500 flex-shrink-0" />
                  <span className="truncate">{tAdmin('dashboard.missions.successRate')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-2xl font-bold">
                  {DashboardUtils.calculateSuccessRate(
                    allStats.missions.stats?.byStatus.completed || 0,
                    allStats.overview.stats?.quickStats.totalMissions || 0
                  )}
                  %
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center h-5">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-purple-600 flex-shrink-0" />
                  <span className="truncate">
                    {tAdmin('dashboard.missions.totalBudget') || 'Budget Total'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-2xl font-bold">
                  {formatCurrency(allStats.missions.stats?.totalBudget || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center h-5">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-500 flex-shrink-0" />
                  <span className="truncate">
                    {tAdmin('feedbacks.averageRating') || 'Note Moyenne'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-2xl font-bold">
                  {allStats.feedbacks.stats?.averageRating?.toFixed(1) || '0.0'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mission Status Distribution & Feedback Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('dashboard.missions.statusDistribution') || 'Distribution des Statuts'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: getStatusLabel('draft', tCommon),
                          value: allStats.missions.stats?.byStatus.draft || 0,
                          color: '#9ca3af',
                        },
                        {
                          name: getStatusLabel('published', tCommon),
                          value: allStats.missions.stats?.byStatus.published || 0,
                          color: '#f59e0b',
                        },
                        {
                          name: getStatusLabel('assigned', tCommon),
                          value: allStats.missions.stats?.byStatus.assigned || 0,
                          color: '#3b82f6',
                        },
                        {
                          name: getStatusLabel('in_progress', tCommon),
                          value: allStats.missions.stats?.byStatus.in_progress || 0,
                          color: '#8b5cf6',
                        },
                        {
                          name: getStatusLabel('completed', tCommon),
                          value: allStats.missions.stats?.byStatus.completed || 0,
                          color: '#10b981',
                        },
                        {
                          name: getStatusLabel('cancelled', tCommon),
                          value: allStats.missions.stats?.byStatus.cancelled || 0,
                          color: '#ef4444',
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                    >
                      {[
                        { color: '#9ca3af' },
                        { color: '#f59e0b' },
                        { color: '#3b82f6' },
                        { color: '#8b5cf6' },
                        { color: '#10b981' },
                        { color: '#ef4444' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        value,
                        tAdmin('dashboard.missions.title') || 'Missions',
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                  {tAdmin('feedbacks.ratingDistribution') || 'Distribution des notes'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="w-8 text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        {rating} <Star className="h-3 w-3 fill-current text-yellow-500" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full"
                          style={{
                            width: `${((allStats.feedbacks.stats?.distribution?.[rating as keyof typeof allStats.feedbacks.stats.distribution] || 0) / (allStats.feedbacks.stats?.total || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-500 dark:text-gray-400 text-right">
                        {allStats.feedbacks.stats?.distribution?.[
                          rating as keyof typeof allStats.feedbacks.stats.distribution
                        ] || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mission Metrics & Top Transporteurs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tAdmin('missions.stats.missionMetrics') || 'Métriques des Missions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('dashboard.missions.averageBudget') || 'Budget Moyen'}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(allStats.missions.stats?.averageBudget || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('dashboard.missions.completionRate') || 'Taux de Complétion'}
                    </span>
                    <span className="font-medium">
                      {((allStats.missions.stats?.completionRate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('missions.stats.activeMissions') || 'Missions Actives'}
                    </span>
                    <span className="font-medium">
                      {allStats.missions.stats?.byStatus.assigned || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('feedbacks.total') || 'Total Avis'}
                    </span>
                    <span className="font-medium">{allStats.feedbacks.stats?.total || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {tAdmin('feedbacks.topTransporteurs') || 'Meilleurs Transporteurs'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allStats.feedbacks.stats?.topTransporteurs?.slice(0, 5).map((item) => (
                    <div
                      key={item.transporteurId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-950 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.transporteurName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.feedbackCount} avis
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                        <span className="font-bold text-sm">{item.averageRating.toFixed(1)}</span>
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                      Aucune donnée
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="missions" className="space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={tAdmin('missions.searchPlaceholder')}
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue
                      placeholder={tMissions('myMissions.transporteur.search.filterOrigin')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {tMissions('myMissions.transporteur.search.allOrigins')}
                    </SelectItem>
                    {uniqueOrigin.map((city) => (
                      <SelectItem key={city} value={city!}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDestination} onValueChange={setFilterDestination}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue
                      placeholder={tMissions('myMissions.transporteur.search.filterDestination')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {tMissions('myMissions.transporteur.search.allDestinations')}
                    </SelectItem>
                    {uniqueDestination.map((city) => (
                      <SelectItem key={city} value={city!}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Select
                    value={typeFilter}
                    onValueChange={(value) => setTypeFilter(value as VehicleType | 'all')}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder={tAdmin('missions.vehicleTypePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tAdmin('missions.allVehicles')}</SelectItem>
                      {Object.values(VehicleTypes).map((type) => (
                        <SelectItem key={type} value={type}>
                          {tVehicles('types.' + type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportToCSV} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    <span>{tCommon('actions.export')}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="p-0">
              {filteredMissions.length > 0 ? (
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                  {filteredMissions.map((mission) => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    {tAdmin('missions.empty')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tAdmin('missions.analytics.statusBreakdown') || 'Répartition par Statut'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">
                        {allStats.missions.stats?.byStatus.published || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {getStatusLabel('published', tCommon)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                        {allStats.missions.stats?.byStatus.assigned || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {getStatusLabel('assigned', tCommon)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {allStats.missions.stats?.byStatus.in_progress || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {getStatusLabel('in_progress', tCommon)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {allStats.missions.stats?.byStatus.completed || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {getStatusLabel('completed', tCommon)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tAdmin('feedbacks.stats.overview') || 'Aperçu des Avis'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('feedbacks.total') || 'Total Avis'}
                    </span>
                    <span className="font-medium">{allStats.feedbacks.stats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('feedbacks.averageRating') || 'Note Moyenne'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">
                        {allStats.feedbacks.stats?.averageRating?.toFixed(1) || '0.0'}
                      </span>
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('feedbacks.stats.5stars') || 'Avis 5 étoiles'}
                    </span>
                    <span className="font-medium">
                      {allStats.feedbacks.stats?.distribution?.[5] || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tAdmin('feedbacks.stats.topTransporteurs') || 'Meilleurs Transporteurs'}
                    </span>
                    <span className="font-medium">
                      {allStats.feedbacks.stats?.topTransporteurs?.length || 0}
                    </span>
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
