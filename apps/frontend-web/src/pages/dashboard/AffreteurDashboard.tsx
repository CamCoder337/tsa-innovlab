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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { DashboardUtils } from '@/lib/dashboard.utils';
import { useMemo } from 'react';

function AffreteurDashboard() {
  const { user } = useAuth();
  const { myMissions } = useMissions();

  // Calculate real metrics from mission data
  const metrics = useMemo(() => {
    if (!myMissions.length) return null;
    return DashboardUtils.calculateMissionMetrics(myMissions);
  }, [myMissions]);

  const recentMissions = useMemo(() => {
    return DashboardUtils.getRecentMissions(myMissions, 3);
  }, [myMissions]);

  const recommendations = useMemo(() => {
    return DashboardUtils.generateInsightRecommendations(myMissions);
  }, [myMissions]);

  const monthlySummary = useMemo(() => {
    return DashboardUtils.getMonthlySummary(myMissions);
  }, [myMissions]);

  const affreteurInsights = [
    {
      title: 'Missions Actives',
      icon: Package,
      value: metrics?.activeMissions || 0,
      change: `${myMissions.length} au total`,
      color: 'blue',
      href: 'app/missions/active',
    },
    {
      title: 'Coût Moyen',
      icon: Euro,
      value: DashboardUtils.formatCurrency(metrics?.averageCost || 0),
      change:
        DashboardUtils.calculateGrowthPercentage(
          metrics?.averageCost || 0,
          (metrics?.averageCost || 0) * 1.05
        ) + ' ce mois',
      color: 'green',
      href: 'app/reports/costs',
    },
    {
      title: 'Missions en Attente',
      icon: Clock,
      value: myMissions.filter((m) => m.status === 'published').length,
      change: `${myMissions.filter((m) => ['assigned', 'in_progress'].includes(m.status)).length} en cours`,
      color: 'purple',
      href: 'app/missions/pending',
    },
    {
      title: 'Taux de Réussite',
      icon: CheckCircle,
      value: DashboardUtils.formatPercentage(metrics?.successRate || 0),
      change:
        DashboardUtils.calculateGrowthPercentage(
          metrics?.successRate || 0,
          (metrics?.successRate || 0) - 2
        ) + ' ce mois',
      color: 'green',
      href: '/affreteur/reports/missions',
    },
  ];

  if (!user) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Bonjour, {user.fullName}
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
              title="Système en ligne"
            />
          </h1>
          <p className="text-muted-foreground">
            Gérez vos expéditions et suivez vos missions en temps réel.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/missions/create">
            <Button className="gap-2" style={{ backgroundColor: 'var(--tsa-blue)' }}>
              <Plus className="h-4 w-4" />
              Créer Mission
            </Button>
          </Link>
          <Link to="/app/missions/reports">
            <Button variant="outline" className="gap-2 bg-transparent">
              <FileText className="h-4 w-4" />
              Mes Rapports
            </Button>
          </Link>
        </div>
      </div>

      {/* <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Plateforme Opérationnelle</p>
              <p className="text-sm text-green-600">
                Tous vos transporteurs sont disponibles • Suivi temps réel actif
              </p>
            </div>
          </div>
        </CardContent>
      </Card> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {affreteurInsights.map((insight, index) => (
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
              Mes Missions Récentes
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMissions.length > 0 ? (
                recentMissions.map((mission) => (
                  <Link
                    to={`/app/missions/${mission.id}`}
                    key={mission.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${mission.statusColor}`}></div>
                      <div>
                        <p className="font-medium">{mission.title}</p>
                        <p className="text-sm text-muted-foreground">{mission.route}</p>
                        <p className="text-xs text-muted-foreground">
                          {mission.transporteur
                            ? `par ${mission.transporteur.fullName}`
                            : 'Non assigné'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">{mission.statusLabel}</p>
                      <p className="text-xs text-muted-foreground">{mission.timeAgo}</p>
                      <p className="text-xs font-medium text-tsa-blue">{mission.formattedBudget}</p>
                      <Progress value={mission.progress} className="w-20 h-1" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune mission récente</p>
                  <p className="text-sm">Créez votre première mission pour commencer</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/missions/create">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Nouvelle Mission
              </Button>
            </Link>
            <Link to="/tracking-dashboard">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <MapPin className="h-4 w-4" />
                Suivi Expéditions
              </Button>
            </Link>
            <Link to="/app">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Euro className="h-4 w-4" />
                Analyse Coûts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-tsa-blue" />
              Recommandations
              <div className="w-2 h-2 bg-tsa-blue rounded-full animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
                    blue: 'text-blue-600',
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
                          className={`h-4 w-4 ${iconColors[rec.color as keyof typeof iconColors]}`}
                        />
                        <p className="text-sm font-medium">{rec.title}</p>
                      </div>
                      <p className="text-xs">{rec.message}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune recommandation disponible</p>
                  <p className="text-xs">Créez plus de missions pour obtenir des insights</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Résumé Mensuel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Missions Créées</span>
              <span className="font-semibold">{monthlySummary?.created || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Missions Terminées</span>
              <span className="font-semibold text-green-600">{monthlySummary?.completed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Coût Total</span>
              <span className="font-semibold">
                {DashboardUtils.formatCurrency(monthlySummary?.totalCost || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Économies Réalisées</span>
              <span className="font-semibold text-green-600">
                {DashboardUtils.formatCurrency(monthlySummary?.savings || 0)}
              </span>
            </div>
            <Progress value={monthlySummary?.onTimeRate || 0} className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              {DashboardUtils.formatPercentage(monthlySummary?.onTimeRate || 0)} de vos missions
              livrées à temps
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AffreteurDashboard;
