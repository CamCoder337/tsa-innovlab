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
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { DashboardUtils } from '@/lib/dashboard.utils';
import { useMemo } from 'react';
import { useCommonTranslation, useDashboardTranslation } from '@/hooks/useTranslation';
import { useNotifications } from '@/hooks/useNotifications';

function TransporteurDashboard() {
  const { user } = useAuth();
  const { missions, myMissions, setCurrentMission } = useMissions();
  const { notifications } = useNotifications();
  const { t: tCommon } = useCommonTranslation();
  const { t: tDash } = useDashboardTranslation();

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
    return DashboardUtils.getRecentMissions(myMissions, 3, tCommon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myMissions]);

  const transporteurInsights = [
    {
      title: tDash('transporteur.insights.availableMissions'),
      icon: Search,
      value: missions.length,
      change: `+${Math.max(0, missions.length - 8)} ${tDash('transporteur.insights.new')}`,
      color: 'blue',
      href: '/app/missions',
    },
    {
      title: tDash('transporteur.insights.todayEarnings'),
      icon: Euro,
      value: DashboardUtils.formatCurrency(earnings?.today || 0),
      change:
        DashboardUtils.calculateGrowthPercentage(
          earnings?.today || 0,
          (earnings?.today || 0) * 0.85
        ) + ` ${tDash('transporteur.insights.vsYesterday')}`,
      color: 'green',
      href: '/transporteur/earnings/current',
    },
    {
      title: tDash('transporteur.insights.activeMissions'),
      icon: Truck,
      value: metrics?.activeMissions || 0,
      change: `${myMissions?.filter((m) => m.status === 'in_progress').length || 0} ${tCommon('status.in_progress')}`,
      color: 'orange',
      href: '/app/missions?tab=active',
    },
    {
      title: tDash('transporteur.insights.successRate'),
      icon: CheckCircle,
      value: 0, // DashboardUtils.formatPercentage(metrics?.successRate || 0)
      change:
        DashboardUtils.calculateGrowthPercentage(
          metrics?.successRate || 0,
          (metrics?.successRate || 0) - 2
        ) + ` ${tCommon('time.thisMonth')}`,
      color: 'green',
      href: '/transporteur/profile',
    },
  ];

  const monthlySummary = useMemo(() => {
    return DashboardUtils.getMonthlySummary(myMissions);
  }, [myMissions]);

  const latestNotification = useMemo(() => {
    return (
      notifications
        .filter((notification) => notification.readAt === null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ||
      null
    );
  }, [notifications]);

  const displayNotifications = useMemo(() => {
    return notifications.slice(0, 3).map((notification) => {
      // Map notification types to appropriate icons and colors
      const getNotificationStyle = (type: string, priority: string, read: boolean) => {
        switch (type) {
          case 'mission_assigned':
          case 'mission_new':
            return {
              icon: Package,
              bgColor: 'bg-blue-50',
              borderColor: read ? null : 'border-blue-200',
              textColor: 'text-blue-800',
              iconColor: 'text-tsa-blue',
            };
          case 'mission_status_changed':
            return {
              icon: Truck,
              bgColor: 'bg-orange-50',
              borderColor: 'border-orange-200',
              textColor: 'text-orange-800',
              iconColor: 'text-orange-600',
            };
          case 'mission_completed':
          case 'payment_received':
            return {
              icon: CheckCircle,
              bgColor: 'bg-green-50',
              borderColor: 'border-green-200',
              textColor: 'text-green-800',
              iconColor: 'text-green-600',
            };
          case 'system':
            if (priority === 'urgent' || priority === 'high') {
              return {
                icon: AlertTriangle,
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                textColor: 'text-red-800',
                iconColor: 'text-red-600',
              };
            }
            return {
              icon: Settings,
              bgColor: 'bg-gray-50',
              borderColor: 'border-gray-200',
              textColor: 'text-gray-800',
              iconColor: 'text-gray-600',
            };
          default:
            return {
              icon: Package,
              bgColor: 'bg-blue-50',
              borderColor: 'border-blue-200',
              textColor: 'text-blue-800',
              iconColor: 'text-tsa-blue',
            };
        }
      };

      const style = getNotificationStyle(
        notification.type,
        notification.priority,
        notification.readAt !== null
      );

      return {
        ...notification,
        ...style,
        timeAgo: new Date(notification.createdAt).toLocaleString(),
      };
    });
  }, [notifications]);

  if (!user) return null;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 truncate">
            {tDash('transporteur.welcome', { name: user.fullName })}
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"
              title={tDash('transporteur.vehicleOnline')}
            />
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {tDash('transporteur.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link to="/app/missions/" className="w-full sm:w-auto">
            <Button
              className="gap-2 w-full sm:w-auto"
              style={{ backgroundColor: 'var(--tsa-blue)' }}
            >
              <Search className="h-4 w-4" />
              <span>{tDash('transporteur.actions.availableMissions')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {latestNotification && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800 text-sm sm:text-base truncate">
                  {latestNotification.title}
                </p>
                <p className="text-xs sm:text-sm text-green-600 truncate">
                  {latestNotification.message}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  {new Date(latestNotification.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {transporteurInsights.map((insight, index) => (
          <Link key={index} to={insight.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      {insight.title}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{insight.value}</p>
                    <p className="text-xs text-green-600 truncate">{insight.change}</p>
                  </div>
                  <insight.icon className="h-6 w-6 sm:h-8 sm:w-8 text-tsa-blue dark:text-tsa-white flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 gap-0">
          <CardHeader className="">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              {tDash('transporteur.sections.myActiveMissions')}
              <div className="w-2 h-2 bg-tsa-blue/90 rounded-full animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 sm:space-y-4">
              {recentMissions.length > 0 ? (
                recentMissions.map((mission) => (
                  <Link
                    key={mission.id}
                    to={`/app/missions/${mission.id}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3 sm:gap-0"
                    onClick={() => {
                      setCurrentMission(mission);
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full ${mission.statusColor} flex-shrink-0`}
                      ></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{mission.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {mission.route}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {mission.affreteur
                            ? `${tCommon('for')} ${mission.affreteur.firstName}  ${mission.affreteur.lastName}`
                            : tDash('transporteur.emptyStates.undefinedClient')}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 flex-shrink-0">
                      <div className="flex flex-col sm:items-end">
                        <p className="text-xs sm:text-sm font-medium">
                          {tCommon('status.' + mission.statusLabel)}
                        </p>
                        <p className="text-xs text-muted-foreground">{mission.timeAgo}</p>
                      </div>
                      <div className="flex flex-col sm:items-end">
                        <p className="text-xs font-medium text-green-600">
                          {mission.formattedBudget}
                        </p>
                        <Progress value={mission.progress} className="w-16 sm:w-20 h-1" />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">
                    {tDash('transporteur.emptyStates.noActiveMissions')}
                  </p>
                  <p className="text-xs sm:text-sm">
                    {tDash('transporteur.emptyStates.searchAvailableMissions')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              {tDash('transporteur.sections.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 pt-0">
            <Link to="/app/missions">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent text-sm"
              >
                <Search className="h-4 w-4" />
                {tDash('transporteur.quickActions.searchMissions')}
              </Button>
            </Link>
            <Link to="/app/tracking-dashboard">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent text-sm"
              >
                <MapPin className="h-4 w-4" />
                {tDash('transporteur.quickActions.gpsTracking')}
              </Button>
            </Link>
            <Link to="/app/vehicles">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent text-sm"
              >
                <Truck className="h-4 w-4" />
                {tDash('transporteur.quickActions.vehicleStatus')}
              </Button>
            </Link>
            <Link to="/app">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent text-sm"
              >
                <Euro className="h-4 w-4" />
                {tDash('transporteur.quickActions.dailyEarnings')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              {tDash('transporteur.sections.alertsNotifications')}
              {notifications.some((n) => !n.readAt) && (
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {displayNotifications.length > 0 ? (
                displayNotifications.map((notification) => {
                  const IconComponent = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 ${notification.bgColor} border ${notification.borderColor} rounded-lg ${!notification.readAt ? 'ring-1 ring-blue-200' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent
                          className={`h-4 w-4 ${notification.iconColor} flex-shrink-0`}
                        />
                        <p
                          className={`text-xs sm:text-sm font-medium ${notification.textColor} truncate flex-1`}
                        >
                          {notification.title}
                        </p>
                        {!notification.readAt && (
                          <div className="w-2 h-2 bg-tsa-blue/90 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-xs ${notification.iconColor}`}>{notification.message}</p>
                      <p className={`text-xs ${notification.iconColor} opacity-75 mt-1`}>
                        {notification.timeAgo}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-gray-600" />
                    <p className="text-xs sm:text-sm font-medium text-gray-800">
                      {tDash('transporteur.alerts.noNotifications')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    {tDash('transporteur.alerts.allCaughtUp')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              {tDash('transporteur.sections.monthlyStats')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {tDash('transporteur.monthlyStats.missionsThisMonth')}
              </span>
              <span className="font-semibold text-sm sm:text-base">{monthlySummary.created}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {tDash('transporteur.monthlyStats.completedMissions')}
              </span>
              <span className="font-semibold text-green-600 text-sm sm:text-base">
                {monthlySummary?.completed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {tDash('transporteur.monthlyStats.earningsThisMonth')}
              </span>
              <span className="font-semibold text-sm sm:text-base">
                {DashboardUtils.formatCurrency(monthlySummary?.totalCost || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {tDash('transporteur.insights.successRate')}
              </span>
              <span className="font-semibold text-green-600 text-sm sm:text-base">
                {monthlySummary?.successRate || 0}
              </span>
            </div>
            <Progress value={metrics?.successRate || 0} className="w-full" />
            <Link to="/app/profile">
              <Button variant="outline" className="w-full gap-2 bg-transparent text-sm">
                <Settings className="h-4 w-4" />
                {tDash('transporteur.monthlyStats.viewProfile')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TransporteurDashboard;
