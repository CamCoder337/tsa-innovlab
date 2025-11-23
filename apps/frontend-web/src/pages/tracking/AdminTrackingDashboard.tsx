import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MissionTrackingMap from '../../components/tracking/MissionTrackingMap';
import type { Mission } from '@/types/mission.types';
import {
  Truck,
  Users,
  AlertTriangle,
  TrendingUp,
  MapPin,
  BarChart3,
  Shield,
  Activity,
  Package,
  Settings,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useTrackingTranslation } from '@/hooks/useTranslation';
import { useMissions } from '@/hooks/useMissions';

const getAlertColor = (type: 'critical' | 'warning' | 'info') => {
  switch (type) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'info':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'down':
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    case 'stable':
      return <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
  }
};

export default function AdminTrackingDashboard() {
  const { t: tTracking } = useTrackingTranslation();
  const { missions, myMissions, isLoading, error, fetchAllMissions, clearError } = useMissions();

  // Combine all missions for admin view
  const allMissions = useMemo(() => {
    return [...missions, ...myMissions];
  }, [missions, myMissions]);

  // Filter for trackable missions (in_progress status)
  const trackableMissions = useMemo(() => {
    return allMissions.filter((mission) => mission.status === 'in_progress');
  }, [allMissions]);

  // State for selected mission
  const [selectedMission, setSelectedMission] = useState<Mission | null>(
    trackableMissions.length > 0 ? trackableMissions[0] : null
  );

  const systemMetrics = useMemo(() => {
    const inProgressMissions = allMissions.filter((m) => m.status === 'in_progress');
    const completedMissions = allMissions.filter((m) => m.status === 'completed');

    // Mock vehicle and driver data - in real app this would come from separate hooks
    const totalVehicles = 50;
    const totalDrivers = 45;
    const activeVehicles = inProgressMissions.length;
    const activeDrivers = inProgressMissions.filter((m) => m.transporteurId).length;

    const today = new Date().toISOString().split('T')[0];
    const completedToday = completedMissions.filter(
      (m) => m.updatedAt && m.updatedAt.startsWith(today)
    ).length;

    return {
      totalVehicles,
      totalDrivers,
      activeVehicles,
      activeDrivers,
      activeMissions: inProgressMissions.length,
      completedToday,
      delayedMissions: 0, // Would need delay tracking in mission data
      systemUptime: '99.8%',
      avgResponseTime: 120,
    };
  }, [allMissions]);

  // Mock alerts based on mission data
  const alerts: {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    timestamp: string;
    resolved: boolean;
  }[] = useMemo(() => {
    const mockAlerts: {
      id: string;
      type: 'critical' | 'warning' | 'info';
      title: string;
      description: string;
      timestamp: string;
      resolved: boolean;
    }[] = [];

    // Create alerts for high-value missions
    allMissions.forEach((mission) => {
      if (mission.budgetMin && mission.budgetMin > 500000) {
        mockAlerts.push({
          id: `alert-${mission.id}`,
          type: 'warning',
          title: `Mission haute valeur: ${mission.title}`,
          description: `Budget de ${mission.budgetMin?.toLocaleString()} FCFA nécessite un suivi renforcé`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }
    });

    // Add system alerts
    if (systemMetrics.activeVehicles < 5) {
      mockAlerts.push({
        id: 'low-capacity',
        type: 'critical',
        title: 'Capacité faible',
        description: 'Moins de 5 véhicules actifs détectés',
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    return mockAlerts.slice(0, 10); // Limit to 10 alerts
  }, [allMissions, systemMetrics.activeVehicles]);

  const performance: {
    metric: string;
    current: number;
    target: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
  }[] = useMemo(() => {
    const occupancyRate =
      systemMetrics.totalVehicles > 0
        ? (systemMetrics.activeVehicles / systemMetrics.totalVehicles) * 100
        : 0;

    const completionRate =
      allMissions.length > 0
        ? (allMissions.filter((m) => m.status === 'completed').length / allMissions.length) * 100
        : 0;

    return [
      {
        metric: "Taux d'occupation",
        current: Math.round(occupancyRate),
        target: 80,
        unit: '%',
        trend: occupancyRate >= 80 ? 'up' : occupancyRate >= 60 ? 'stable' : 'down',
      },
      {
        metric: 'Missions actives',
        current: systemMetrics.activeMissions,
        target: 20,
        unit: '',
        trend:
          systemMetrics.activeMissions >= 20
            ? 'up'
            : systemMetrics.activeMissions >= 10
              ? 'stable'
              : 'down',
      },
      {
        metric: 'Taux de completion',
        current: Math.round(completionRate),
        target: 95,
        unit: '%',
        trend: completionRate >= 95 ? 'up' : completionRate >= 80 ? 'stable' : 'down',
      },
      {
        metric: 'Revenus journaliers',
        current: 850000,
        target: 1000000,
        unit: 'FCFA',
        trend: 'down',
      },
    ];
  }, [allMissions, systemMetrics]);

  const unreadAlerts = alerts.filter((a) => !a.resolved).length;
  const criticalAlerts = alerts.filter((a) => a.type === 'critical' && !a.resolved).length;

  // Handle refresh button click
  const handleRefresh = async () => {
    await fetchAllMissions();
  };

  // Load data on mount
  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  // Loading state
  if (isLoading && allMissions.length === 0) {
    return (
      <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-950 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-tsa-blue dark:text-tsa-white" />
            <span className="text-lg text-gray-600 dark:text-gray-300">
              Chargement du tableau de bord...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* En-tête */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {tTracking('dashboard.adminTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
              {tTracking('dashboard.adminSubtitle')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <Button variant="outline" className="flex items-center gap-2 text-xs sm:text-sm">
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              {tTracking('actions.exportReport')}
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 text-xs sm:text-sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {tTracking('actions.refresh')}
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              {tTracking('actions.emergencyMode')}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 text-sm sm:text-base">
                    Erreur de chargement
                  </h3>
                  <p className="text-red-700 text-xs sm:text-sm">{error}</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleRefresh}
                  className="ml-auto bg-red-600 hover:bg-red-700 text-xs"
                >
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertes critiques */}
        {criticalAlerts > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 text-sm sm:text-base">
                    {tTracking('alerts.critical', { count: criticalAlerts })}
                  </h3>
                  <p className="text-red-700 text-xs sm:text-sm">{tTracking('alerts.checkTab')}</p>
                </div>
                <Button size="sm" className="ml-auto bg-red-600 hover:bg-red-700 text-xs">
                  {tTracking('actions.viewAlerts')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Système */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                    {tTracking('kpis.activeVehicles')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                    {systemMetrics.activeVehicles}/{systemMetrics.totalVehicles}
                  </p>
                </div>
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-tsa-blue h-2 rounded-full"
                  style={{
                    width: `${systemMetrics.totalVehicles > 0 ? (systemMetrics.activeVehicles / systemMetrics.totalVehicles) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                    {tTracking('kpis.activeDrivers')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    {systemMetrics.activeDrivers}/{systemMetrics.totalDrivers}
                  </p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${systemMetrics.totalDrivers > 0 ? (systemMetrics.activeDrivers / systemMetrics.totalDrivers) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                    {tTracking('kpis.activeMissions')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">
                    {systemMetrics.activeMissions}
                  </p>
                </div>
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                {tTracking('kpis.completedToday', { count: systemMetrics.completedToday })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                    {tTracking('kpis.systemUptime')}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    {systemMetrics.systemUptime}
                  </p>
                </div>
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                {tTracking('kpis.responseTime')}: {systemMetrics.avgResponseTime}ms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{tTracking('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="fleet">{tTracking('tabs.fleetManagement')}</TabsTrigger>
            <TabsTrigger value="performance">{tTracking('tabs.performance')}</TabsTrigger>
            <TabsTrigger value="alerts">{tTracking('tabs.alertsIncidents')}</TabsTrigger>
            <TabsTrigger value="analytics">{tTracking('tabs.analytics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Carte globale */}
              <div className="lg:col-span-2 space-y-4">
                {/* Sélecteur de mission */}
                {trackableMissions.length > 1 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Mission à suivre:
                        </label>
                        <select
                          value={selectedMission?.id || ''}
                          onChange={(e) => {
                            const selected = trackableMissions.find((m) => m.id === e.target.value);
                            if (selected) setSelectedMission(selected);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Sélectionner une mission --</option>
                          {trackableMissions.map((mission) => (
                            <option key={mission.id} value={mission.id}>
                              {mission.title} - {mission.adresseDepart?.city} →{' '}
                              {mission.adresseArrivee?.city}
                            </option>
                          ))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {tTracking('map.globalView')}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Filter className="w-4 h-4 mr-2" />
                          {tTracking('map.filters')}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          {tTracking('map.satelliteView')}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MissionTrackingMap
                      className="h-[700px]"
                      missions={trackableMissions}
                      selectedMission={selectedMission}
                      onMissionClick={(mission) => setSelectedMission(mission)}
                      showUserLocation={false}
                      showRoutes={true}
                      showLegend={true}
                    />
                    <div className="mt-4 flex justify-between items-center text-sm">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-tsa-blue/90 rounded-full"></div>
                          <span>
                            {tTracking('map.activeVehicles', {
                              count: systemMetrics.activeVehicles,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>{tTracking('map.incidents', { count: criticalAlerts })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>
                            {tTracking('map.delays', { count: systemMetrics.delayedMissions || 0 })}
                          </span>
                        </div>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {tTracking('map.lastUpdate', { time: new Date().toLocaleTimeString() })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Panneau de contrôle */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      {tTracking('alerts.title')}
                      {unreadAlerts > 0 && (
                        <Badge className="bg-red-500 text-white">{unreadAlerts}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 border rounded-lg ${getAlertColor(alert.type)}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">{alert.title}</span>
                          {!alert.resolved && (
                            <div className="w-2 h-2 bg-current rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs opacity-90">{alert.description}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      {tTracking('actions.viewAll')}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      {tTracking('metrics.realTime')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tTracking('metrics.activeMissions')}
                      </span>
                      <span className="font-medium">{systemMetrics.activeMissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tTracking('metrics.occupancyRate')}
                      </span>
                      <span className="font-medium text-green-600">
                        {systemMetrics.totalVehicles > 0
                          ? Math.round(
                              (systemMetrics.activeVehicles / systemMetrics.totalVehicles) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tTracking('metrics.dailyRevenue')}
                      </span>
                      <span className="font-medium text-tsa-blue dark:text-tsa-white">
                        {850000} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {tTracking('metrics.networkEfficiency')}
                      </span>
                      <span className="font-medium text-purple-600">{95}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      {tTracking('quickActions.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      {tTracking('quickActions.manageDrivers')}
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Truck className="w-4 h-4 mr-2" />
                      {tTracking('quickActions.fleetStatus')}
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Package className="w-4 h-4 mr-2" />
                      {tTracking('quickActions.urgentMissions')}
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {tTracking('quickActions.reports')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {performance.map((metric, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {metric.metric}
                      </span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{metric.current}</span>
                      <span className="text-gray-500 dark:text-gray-400">{metric.unit}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>
                          Objectif: {metric.target}
                          {metric.unit}
                        </span>
                        <span
                          className={
                            metric.current >= metric.target ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {metric.current >= metric.target ? '✓' : '⚠'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${metric.current >= metric.target ? 'bg-green-500' : 'bg-yellow-500'}`}
                          style={{
                            width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{tTracking('performance.evolution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  {tTracking('performance.chart30Days')}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Gestion des Alertes</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrer
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Marquer tout lu
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{alert.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {alert.type}
                            </Badge>
                            {!alert.resolved && (
                              <div className="w-2 h-2 bg-current rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm opacity-90">{alert.description}</p>
                          <p className="text-xs opacity-75">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!alert.resolved && (
                            <Button size="sm" variant="outline">
                              {tTracking('actions.resolve')}
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            {tTracking('actions.details')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{tTracking('analytics.revenueAnalysis')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    {tTracking('analytics.revenueByRegion')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{tTracking('analytics.fleetUtilization')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    {tTracking('analytics.vehicleUtilization')}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{tTracking('analytics.aiPredictions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">
                      {tTracking('analytics.expectedDemand')}
                    </h4>
                    <p className="text-2xl font-bold text-tsa-blue dark:text-tsa-white">+23%</p>
                    <p className="text-sm text-blue-700">{tTracking('analytics.nextWeek')}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">
                      {tTracking('analytics.routeOptimization')}
                    </h4>
                    <p className="text-2xl font-bold text-green-600">-15%</p>
                    <p className="text-sm text-green-700">{tTracking('analytics.fuelSavings')}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">
                      {tTracking('analytics.maintenance')}
                    </h4>
                    <p className="text-2xl font-bold text-purple-600">
                      3 {tTracking('analytics.vehicles')}
                    </p>
                    <p className="text-sm text-purple-700">
                      {tTracking('analytics.scheduledMaintenance')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
