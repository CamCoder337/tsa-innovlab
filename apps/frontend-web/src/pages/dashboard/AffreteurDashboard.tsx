import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  FileText,
  Package,
  MapPin,
  Euro,
  Clock,
  CheckCircle,
  TrendingUp,
  Loader,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { DashboardUtils } from '@/lib/dashboard.utils';
import { useMemo } from 'react';
import { useCommonTranslation, useDashboardTranslation } from '@/hooks/useTranslation';

function AffreteurDashboard() {
  const { user } = useAuth();
  const { myMissions, isLoading, setCurrentMission } = useMissions();
  const { t: tCommon } = useCommonTranslation();
  const { t: tDash } = useDashboardTranslation();

  // Calculate real metrics from mission data
  const metrics = useMemo(() => {
    if (!myMissions.length) return null;
    return DashboardUtils.calculateMissionMetrics(myMissions);
  }, [myMissions]);

  const recentMissions = useMemo(() => {
    return DashboardUtils.getRecentMissions(myMissions, 3, tCommon);
  }, [myMissions, tCommon]);

  const recommendations = useMemo(() => {
    return DashboardUtils.generateInsightRecommendations(myMissions);
  }, [myMissions]);

  const monthlySummary = useMemo(() => {
    return DashboardUtils.getMonthlySummary(myMissions);
  }, [myMissions]);

  const affreteurInsights = [
    {
      title: tDash('affreteur.insights.activeMissions'),
      icon: Package,
      value: metrics?.activeMissions || 0,
      change: `${myMissions.length} ${tDash('affreteur.insights.total')}`,
      color: 'blue',
      href: '/app/missions?tab=actives',
    },
    {
      title: tDash('affreteur.insights.averageCost'),
      icon: Euro,
      value: DashboardUtils.formatCurrency(metrics?.averageCost || 0),
      change:
        DashboardUtils.calculateGrowthPercentage(
          metrics?.averageCost || 0,
          (metrics?.averageCost || 0) * 1.05
        ) + ` ${tCommon('time.thisMonth')}`,
      color: 'green',
      href: '/app/reports/costs',
    },
    {
      title: tDash('affreteur.insights.pendingMissions'),
      icon: Clock,
      value: myMissions.filter((m) => m.status === 'published').length,
      change: `${myMissions.filter((m) => ['assigned', 'in_progress'].includes(m.status)).length} ${tCommon('status.in_progress')}`,
      color: 'purple',
      href: '/app/missions?tab=pending',
    },
    {
      title: tDash('affreteur.insights.successRate'),
      icon: CheckCircle,
      value: DashboardUtils.formatPercentage(metrics?.successRate || 0),
      change:
        DashboardUtils.calculateGrowthPercentage(
          metrics?.successRate || 0,
          (metrics?.successRate || 0) - 2
        ) + ` ${tCommon('time.thisMonth')}`,
      color: 'green',
      href: '/app',
    },
  ];

  if (!user) return null;

  if (isLoading && myMissions.length === 0)
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-screen">
        <Loader className="animate-spin h-12 w-12 text-tsa-blue dark:text-tsa-white" />
      </div>
    );

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 truncate">
            {tDash('affreteur.welcome', { name: user.fullName })}
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"
              title={tDash('affreteur.systemOnline')}
            />
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {tDash('affreteur.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link to="/app/missions/create" className="w-full sm:w-auto">
            <Button
              className="gap-2 w-full sm:w-auto"
              style={{ backgroundColor: 'var(--tsa-blue)' }}
            >
              <Plus className="h-4 w-4" />
              <span>{tDash('affreteur.actions.createMission')}</span>
            </Button>
          </Link>
          <Link to="/app/missions/reports" className="w-full sm:w-auto">
            <Button variant="outline" className="gap-2 bg-transparent w-full sm:w-auto">
              <FileText className="h-4 w-4" />
              <span>{tDash('affreteur.actions.myReports')}</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {affreteurInsights.map((insight, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              {tDash('affreteur.sections.recentMissions')}
              <div className="w-2 h-2 bg-tsa-blue/90 rounded-full animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 sm:space-y-4">
              {recentMissions.length > 0 ? (
                recentMissions.map((mission) => (
                  <Link
                    to={`/app/missions/${mission.id}`}
                    key={mission.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3 sm:gap-0"
                    onClick={() => setCurrentMission(mission)}
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
                          {mission.transporteur
                            ? `par ${mission.transporteur.firstName} ${mission.transporteur.lastName}`
                            : tCommon('status.notAssigned')}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 flex-shrink-0">
                      <div className="flex flex-col sm:items-end">
                        <p className="text-xs sm:text-sm font-medium">
                          {tCommon('status.' + mission.statusLabel).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">{mission.timeAgo}</p>
                      </div>
                      <div className="flex flex-col sm:items-end">
                        <p className="text-xs font-medium text-tsa-blue dark:text-tsa-white">
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
                    {tDash('affreteur.emptyStates.noRecentMissions')}
                  </p>
                  <p className="text-xs sm:text-sm">
                    {tDash('affreteur.emptyStates.createFirstMission')}
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
              {tDash('affreteur.sections.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 pt-0">
            <Link to="/app/missions/create">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent text-sm"
              >
                <Plus className="h-4 w-4" />
                {tDash('affreteur.quickActions.newMission')}
              </Button>
            </Link>
            <Link to="/app/tracking-dashboard">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent text-sm"
              >
                <MapPin className="h-4 w-4" />
                {tDash('affreteur.quickActions.trackShipments')}
              </Button>
            </Link>
            <Link to="/app">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent text-sm"
              >
                <Euro className="h-4 w-4" />
                {tDash('affreteur.quickActions.costAnalysis')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-tsa-blue dark:text-tsa-white" />
              {tDash('affreteur.sections.recommendations')}
              <div className="w-2 h-2 bg-tsa-blue rounded-full animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((rec, i) => {
                  const iconMap = {
                    cost_optimization: Euro,
                    performance: CheckCircle,
                    timing: Clock,
                  };
                  const Icon = iconMap[rec.type as keyof typeof iconMap] || TrendingUp;
                  const colorClasses = {
                    blue: 'bg-blue-50 border-blue-200 text-blue-800',
                    green: 'bg-green-50 border-green-200 text-green-800',
                    orange: 'bg-orange-50 border-orange-200 text-orange-800',
                  };
                  const iconColors = {
                    blue: 'text-tsa-blue dark:text-tsa-white',
                    green: 'text-green-600',
                    orange: 'text-orange-600',
                  };

                  return (
                    <div
                      key={i}
                      className={`p-3 border rounded-lg ${colorClasses[rec.color as keyof typeof colorClasses]}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className={`h-4 w-4 ${iconColors[rec.color as keyof typeof iconColors]} flex-shrink-0`}
                        />
                        <p className="text-xs sm:text-sm font-medium">{rec.title}</p>
                      </div>
                      <p className="text-xs">{rec.message}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-3 sm:py-4 text-muted-foreground">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">
                    {tDash('affreteur.recommendations.noRecommendations')}
                  </p>
                  <p className="text-xs">{tDash('affreteur.recommendations.createMoreMissions')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              {tDash('affreteur.sections.monthlySummary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {tDash('affreteur.monthlySummary.createdMissions')}
              </span>
              <span className="font-semibold text-sm sm:text-base">
                {monthlySummary?.created || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {tDash('affreteur.monthlySummary.completedMissions')}
              </span>
              <span className="font-semibold text-green-600 text-sm sm:text-base">
                {monthlySummary?.completed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {tDash('affreteur.monthlySummary.totalCost')}
              </span>
              <span className="font-semibold text-sm sm:text-base">
                {DashboardUtils.formatCurrency(monthlySummary?.totalCost || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {tDash('affreteur.monthlySummary.savingsRealized')}
              </span>
              <span className="font-semibold text-green-600 text-sm sm:text-base">
                {DashboardUtils.formatCurrency(monthlySummary?.savings || 0)}
              </span>
            </div>
            <Progress value={monthlySummary?.onTimeRate || 0} className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              {DashboardUtils.formatPercentage(monthlySummary?.onTimeRate || 0)}{' '}
              {tDash('affreteur.monthlySummary.onTimeDelivery')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AffreteurDashboard;
