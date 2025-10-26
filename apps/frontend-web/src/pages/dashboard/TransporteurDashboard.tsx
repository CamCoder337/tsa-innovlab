import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  AlertTriangle,
  Package,
  MapPin,
  Truck,
  Euro,
  CheckCircle,
  TrendingUp,
  Fuel,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { DashboardUtils } from '@/lib/dashboard.utils';
import { useMemo } from 'react';
import { useDashboardTranslation, useMissionsTranslation } from '@/hooks/useTranslation';

function TransporteurDashboard() {
  const { user } = useAuth();
  const { missions, myMissions } = useMissions();
  const { t } = useDashboardTranslation();
  const { t: tMissions } = useMissionsTranslation();

  // Calculate real metrics from mission data
  const metrics = useMemo(() => {
    if (!myMissions.length) return null;
    return DashboardUtils.calculateMissionMetrics(myMissions);
  }, [myMissions]);

  const earnings = useMemo(() => {
    if (!myMissions.length) return null;
    return DashboardUtils.calculateTimeBasedEarnings(myMissions);
  }, [myMissions]);

  const recentMissions = useMemo(() => {
    return DashboardUtils.getRecentMissions(myMissions, 3, tMissions);
  }, [myMissions, tMissions]);

  const transporteurInsights = [
    {
      title: t('transporteur.insights.availableMissions'),
      icon: Search,
      value: missions.length,
      change: `+${Math.max(0, missions.length - 8)} ${t('transporteur.insights.new')}`,
      color: 'blue',
      href: 'app/missions',
    },
    {
      title: t('transporteur.insights.todayEarnings'),
      icon: Euro,
      value: DashboardUtils.formatCurrency(earnings?.today || 0),
      change:
        DashboardUtils.calculateGrowthPercentage(
          earnings?.today || 0,
          (earnings?.today || 0) * 0.85
        ) + ` ${t('transporteur.insights.vsYesterday')}`,
      color: 'green',
      href: '/transporteur/earnings/current',
    },
    {
      title: t('transporteur.insights.activeMissions'),
      icon: Truck,
      value: metrics?.activeMissions || 0,
      change: t('transporteur.insights.inProgress'),
      color: 'orange',
      href: 'app/missions',
    },
    {
      title: t('transporteur.insights.successRate'),
      icon: CheckCircle,
      value: 0, // DashboardUtils.formatPercentage(metrics?.successRate || 0)
      change:
        DashboardUtils.calculateGrowthPercentage(
          metrics?.successRate || 0,
          (metrics?.successRate || 0) - 2
        ) + ` ${t('transporteur.insights.thisMonth')}`,
      color: 'green',
      href: '/transporteur/profile',
    },
  ];

  const monthlySummary = useMemo(() => {
    return DashboardUtils.getMonthlySummary(myMissions);
  }, [myMissions]);

  if (!user) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {t('transporteur.welcome', { name: user.fullName })}
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
              title={t('transporteur.vehicleOnline')}
            />
          </h1>
          <p className="text-muted-foreground">{t('transporteur.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/missions/">
            <Button className="gap-2" style={{ backgroundColor: 'var(--tsa-blue)' }}>
              <Search className="h-4 w-4" />
              {t('transporteur.actions.availableMissions')}
            </Button>
          </Link>
          {/* <Link to="/transporteur/earnings">
                        <Button variant="outline" className="gap-2 bg-transparent">
                            <Euro className="h-4 w-4" />
                            Mes Gains
                        </Button>
                    </Link> */}
        </div>
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{t('transporteur.vehicle.operational')}</p>
              <p className="text-sm text-green-600">
                {t('transporteur.vehicle.locationActive')} • {t('transporteur.vehicle.fuel')}: 85% •{' '}
                {t('transporteur.vehicle.nextMaintenance')} 15 {t('transporteur.vehicle.days')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {transporteurInsights.map((insight, index) => (
          <Link key={index} to={insight.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{insight.title}</p>
                    <p className="text-2xl font-bold">{insight.value}</p>
                    <p className="text-xs text-green-600">{insight.change}</p>
                  </div>
                  <insight.icon className="h-8 w-8 text-tsa-blue" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('transporteur.sections.myActiveMissions')}
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMissions.length > 0 ? (
                recentMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${mission.statusColor}`}></div>
                      <div>
                        <p className="font-medium">{mission.title}</p>
                        <p className="text-sm text-muted-foreground">{mission.route}</p>
                        <p className="text-xs text-muted-foreground">
                          {mission.affreteur
                            ? `${t('transporteur.missionDetails.for')} ${mission.affreteur.firstName}  ${mission.affreteur.lastName}`
                            : t('transporteur.emptyStates.undefinedClient')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">{mission.statusLabel}</p>
                      <p className="text-xs text-muted-foreground">{mission.timeAgo}</p>
                      <p className="text-xs font-medium text-green-600">
                        {mission.formattedBudget}
                      </p>
                      <Progress value={mission.progress} className="w-20 h-1" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('transporteur.emptyStates.noActiveMissions')}</p>
                  <p className="text-sm">{t('transporteur.emptyStates.searchAvailableMissions')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('transporteur.sections.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/app/missions">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Search className="h-4 w-4" />
                {t('transporteur.quickActions.searchMissions')}
              </Button>
            </Link>
            <Link to="/app/tracking-dashboard">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <MapPin className="h-4 w-4" />
                {t('transporteur.quickActions.gpsTracking')}
              </Button>
            </Link>
            <Link to="/app/profile">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Truck className="h-4 w-4" />
                {t('transporteur.quickActions.vehicleStatus')}
              </Button>
            </Link>
            <Link to="/app">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Euro className="h-4 w-4" />
                {t('transporteur.quickActions.dailyEarnings')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t('transporteur.sections.alertsNotifications')}
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-tsa-blue" />
                  <p className="text-sm font-medium text-blue-800">
                    {t('transporteur.alerts.newMission')}
                  </p>
                </div>
                <p className="text-xs text-tsa-blue">{t('transporteur.alerts.urgentMission')}</p>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Fuel className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-orange-800">
                    {t('transporteur.alerts.fuel')}
                  </p>
                </div>
                <p className="text-xs text-orange-600">{t('transporteur.alerts.fuelLevel')}</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800">
                    {t('transporteur.alerts.clientRating')}
                  </p>
                </div>
                <p className="text-xs text-green-600">{t('transporteur.alerts.newRating')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('transporteur.sections.monthlyStats')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('transporteur.monthlyStats.missionsThisMonth')}
              </span>
              <span className="font-semibold">{monthlySummary.created}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('transporteur.monthlyStats.completedMissions')}
              </span>
              <span className="font-semibold text-green-600">{monthlySummary?.completed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('transporteur.monthlyStats.earningsThisMonth')}
              </span>
              <span className="font-semibold">
                {DashboardUtils.formatCurrency(monthlySummary?.totalCost || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t('transporteur.insights.successRate')}
              </span>
              <span className="font-semibold text-green-600">
                {monthlySummary?.successRate || 0}
              </span>
            </div>
            <Progress value={metrics?.successRate || 0} className="w-full" />
            <Link to="/app/profile">
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Settings className="h-4 w-4" />
                {t('transporteur.monthlyStats.viewProfile')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TransporteurDashboard;
