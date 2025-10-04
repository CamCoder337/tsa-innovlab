import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MissionTrackingMap from '../../components/tracking/MissionTrackingMap';
import { MOCK_MISSIONS } from '@/data/mock-missions';
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
} from 'lucide-react';

interface SystemMetrics {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalMissions: number;
  activeMissions: number;
  completedToday: number;
  delayedMissions: number;
  systemUptime: string;
  avgResponseTime: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface Performance {
  metric: string;
  current: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

const SYSTEM_METRICS: SystemMetrics = {
  totalVehicles: 45,
  activeVehicles: 32,
  totalDrivers: 67,
  activeDrivers: 28,
  totalMissions: 1247,
  activeMissions: 18,
  completedToday: 23,
  delayedMissions: 3,
  systemUptime: '99.8%',
  avgResponseTime: 245,
};

const ALERTS: Alert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Véhicule en panne',
    description: 'Camion CM-1234-AB signale une panne moteur à Edéa',
    timestamp: '2024-10-03T18:30:00Z',
    resolved: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Retard de livraison',
    description: 'Mission TSA-2024-003 accusera 2h de retard',
    timestamp: '2024-10-03T17:45:00Z',
    resolved: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Nouveau chauffeur',
    description: "Paul Nkomo a rejoint l'équipe transport",
    timestamp: '2024-10-03T16:20:00Z',
    resolved: true,
  },
];

const PERFORMANCE_METRICS: Performance[] = [
  { metric: 'Taux de livraison à temps', current: 94.2, target: 95, trend: 'up', unit: '%' },
  { metric: 'Satisfaction client', current: 4.7, target: 4.8, trend: 'stable', unit: '/5' },
  { metric: 'Utilisation flotte', current: 71, target: 75, trend: 'up', unit: '%' },
  { metric: 'Coût par km', current: 125, target: 120, trend: 'down', unit: 'FCFA' },
  { metric: 'Temps de réponse', current: 2.3, target: 2.0, trend: 'down', unit: 'min' },
];

const getAlertColor = (type: Alert['type']) => {
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

const getTrendIcon = (trend: Performance['trend']) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'down':
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    case 'stable':
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

export default function AdminTrackingDashboard() {
  const [alerts] = useState<Alert[]>(ALERTS);
  const [metrics] = useState<SystemMetrics>(SYSTEM_METRICS);
  const [performance] = useState<Performance[]>(PERFORMANCE_METRICS);

  const unreadAlerts = alerts.filter((a) => !a.resolved).length;
  const criticalAlerts = alerts.filter((a) => a.type === 'critical' && !a.resolved).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Centre de Contrôle Admin</h1>
            <p className="text-gray-600">Supervision globale du système TSA Logistics</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exporter Rapport
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
            <Button className="bg-red-600 hover:bg-red-700">
              <Shield className="w-4 h-4 mr-2" />
              Mode Urgence
            </Button>
          </div>
        </div>

        {/* Alertes critiques */}
        {criticalAlerts > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    {criticalAlerts} alerte(s) critique(s) nécessitent votre attention
                  </h3>
                  <p className="text-red-700">
                    Vérifiez l'onglet "Alertes & Incidents" pour plus de détails
                  </p>
                </div>
                <Button size="sm" className="ml-auto bg-red-600 hover:bg-red-700">
                  Voir Alertes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Système */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Véhicules Actifs</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.activeVehicles}/{metrics.totalVehicles}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(metrics.activeVehicles / metrics.totalVehicles) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Chauffeurs Actifs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.activeDrivers}/{metrics.totalDrivers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(metrics.activeDrivers / metrics.totalDrivers) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Missions Actives</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.activeMissions}</p>
                </div>
                <Package className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {metrics.completedToday} terminées aujourd'hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponibilité Système</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.systemUptime}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Temps de réponse: {metrics.avgResponseTime}ms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="fleet">Gestion Flotte</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alertes & Incidents</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Carte globale */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Vue Globale du Réseau
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Filter className="w-4 h-4 mr-2" />
                          Filtres
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Vue Satellite
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MissionTrackingMap
                      className="h-[500px]"
                      missions={MOCK_MISSIONS}
                      onMissionClick={(mission) => console.log('Mission sélectionnée:', mission)}
                      showUserLocation={false}
                      showRoutes={true}
                      showLegend={true}
                    />
                    <div className="mt-4 flex justify-between items-center text-sm">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Véhicules actifs ({metrics.activeVehicles})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>Incidents ({criticalAlerts})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>Retards ({metrics.delayedMissions})</span>
                        </div>
                      </div>
                      <span className="text-gray-500">
                        Dernière mise à jour: {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Panneau de contrôle */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Alertes Récentes
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
                      Voir toutes les alertes
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      Métriques Temps Réel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Missions en cours</span>
                      <span className="font-medium">{metrics.activeMissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taux d'occupation</span>
                      <span className="font-medium text-green-600">71%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Revenus du jour</span>
                      <span className="font-medium text-blue-600">2.8M FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Efficacité réseau</span>
                      <span className="font-medium text-purple-600">89%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-500" />
                      Actions Rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Gérer Chauffeurs
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Truck className="w-4 h-4 mr-2" />
                      État Flotte
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Package className="w-4 h-4 mr-2" />
                      Missions Urgentes
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Rapports
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
                      <span className="text-sm font-medium text-gray-600">{metric.metric}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{metric.current}</span>
                      <span className="text-gray-500">{metric.unit}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600">
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
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
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
                <CardTitle>Évolution des Performances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Graphique de performance sur 30 jours
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
                              Résoudre
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            Détails
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
                  <CardTitle>Analyse des Revenus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Graphique des revenus par région
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Utilisation de la Flotte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Graphique d'utilisation des véhicules
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Prédictions IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Demande Prévue</h4>
                    <p className="text-2xl font-bold text-blue-600">+23%</p>
                    <p className="text-sm text-blue-700">Semaine prochaine</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Optimisation Route</h4>
                    <p className="text-2xl font-bold text-green-600">-15%</p>
                    <p className="text-sm text-green-700">Économie carburant</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">Maintenance</h4>
                    <p className="text-2xl font-bold text-purple-600">3 véhicules</p>
                    <p className="text-sm text-purple-700">Maintenance prévue</p>
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
