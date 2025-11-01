import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MissionTrackingMap from '../../components/tracking/MissionTrackingMap';
import { Truck, Package, Clock, MapPin, AlertTriangle, DollarSign } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { useCommonTranslation, useTrackingTranslation } from '@/hooks/useTranslation';
import { getStatusColor } from '@/lib/mission-utils';
import { Link, useNavigate } from 'react-router-dom';
import MissionTrackingButton from '@/components/missions/MissionTrackingButton';

// const getPriorityColor = (budgetMax: number) => {
//   if (budgetMax > 200000) return 'bg-red-100 text-red-800'; // Urgent/High value
//   if (budgetMax > 100000) return 'bg-orange-100 text-orange-800'; // High
//   if (budgetMax > 50000) return 'bg-yellow-100 text-yellow-800'; // Medium
//   return 'bg-green-100 text-green-800'; // Low
// };

export default function AffréteurTrackingDashboard() {
  const { myMissions: missions, currentMission, setCurrentMission } = useMissions();
  const { t: tTracking } = useTrackingTranslation();
  const { t: tCommon } = useCommonTranslation();
  const navigate = useNavigate();

  // Calculs des KPIs
  const totalMissions = missions.length;
  const ongoingMissions = missions?.filter((mission) => ['in_progress'].includes(mission.status));
  const completedMissions = missions?.filter((mission) =>
    ['completed'].includes(mission.status)
  ).length;
  const totalRevenue = missions.reduce((sum, m) => sum + Number(m.budgetMin), 0);
  const avgDeliveryTime = tTracking('analytics.avgDeliveryTime'); // Calculé dynamiquement en production

  return (
    <div className="flex flex-col flex-1 bg-gray-50 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tTracking('dashboard.title')}</h1>
          <p className="text-gray-600">{tTracking('dashboard.subtitle')}</p>
        </div>
        <Link to="/app/missions/create">
          <Button className="bg-tsa-blue hover:bg-tsa-blue/80">
            <Package className="w-4 h-4 mr-2" />
            {tTracking('navigation.newMission')}
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {tTracking('kpis.totalMissions')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalMissions}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tCommon('status.in_progress')}</p>
                <p className="text-2xl font-bold text-tsa-blue">{ongoingMissions.length}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {tTracking('kpis.completedMissions')}
                </p>
                <p className="text-2xl font-bold text-green-600">{completedMissions}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tTracking('kpis.revenue')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalRevenue.toLocaleString()} FCFA
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {tTracking('performance.responseTime')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{avgDeliveryTime}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">{tTracking('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="missions">{tTracking('tabs.missionDetails')}</TabsTrigger>
          <TabsTrigger value="analytics">{tTracking('tabs.analytics')}</TabsTrigger>
          <TabsTrigger value="costs">{tTracking('tabs.costs')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Carte */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {tTracking('map.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MissionTrackingMap
                    className="h-[400px]"
                    missions={ongoingMissions}
                    selectedMission={
                      currentMission || missions.find((m) => m.status === 'in_progress')
                    }
                    onMissionClick={(mission) => setCurrentMission(mission)}
                    showUserLocation={false}
                    showRoutes={true}
                    showLegend={true}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Missions urgentes
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      {tTracking('missions.priorityMissions')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {missions
                      .filter((m) => m.budgetMax > 200000 || m.status === 'assigned')
                      .map((mission) => (
                        <div
                          key={mission.id}
                          className="p-3 border rounded-lg bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                          onClick={() => navigate(`/app/mission/${mission.id}/tracking`)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">{mission.title}</span>
                            <Badge className={getPriorityColor(mission.budgetMax)}>
                              {mission.budgetMax > 200000 ? 'Urgent' : 'Normal'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {mission.typeMarchandise} - {mission.poids}kg
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${getStatusColor(mission.status)}`}
                              />
                              <span className="text-xs text-gray-500">{mission.status}</span>
                            </div>
                            <MissionTrackingButton missionId={mission.id} />
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      {tTracking('performance.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{tTracking('performance.successRate')}</span>
                        <span className="font-medium text-green-600">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{tTracking('performance.averageDelay')}</span>
                        <span className="font-medium">{avgDeliveryTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{tTracking('performance.savings')}</span>
                        <span className="font-medium text-tsa-blue">15%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div> */}
          </div>
        </TabsContent>

        <TabsContent value="missions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tTracking('missions.list')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ongoingMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/mission/${mission.id}/tracking`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{mission.title}</span>
                          {/* <Badge className={getPriorityColor(mission.budgetMax)}>
                              {mission.budgetMax > 200000 ? 'Urgent' : 'Normal'}
                            </Badge> */}
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(mission.status)}`}
                          />
                        </div>
                        <p className="text-gray-600">{mission.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            {mission.typeMarchandise} - {mission.poids}kg
                          </span>
                          <span>{mission.budgetMin?.toLocaleString()} FCFA</span>
                          {mission.transporteurId && <span>👤 {tCommon('status.assigned')}</span>}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <p className="text-sm text-gray-500">
                            {tTracking('mission.deliveryScheduled')}
                          </p>
                          <p className="font-medium">
                            {new Date(mission.dateArriveePrevue ?? '').toLocaleDateString()}
                          </p>
                        </div>
                        <MissionTrackingButton missionId={mission.id} className="text-xs" />
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
                <CardTitle>{tTracking('analytics.shipmentEvolution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  {tTracking('analytics.monthlyShipmentChart')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tTracking('analytics.destinationBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  {tTracking('analytics.destinationPieChart')}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{tTracking('performance.monthlyBudget')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-tsa-blue">2,450,000</p>
                  <p className="text-gray-600">{tTracking('performance.fcfaThisMonth')}</p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-tsa-blue h-2 rounded-full" style={{ width: '73%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{tTracking('analytics.budgetUsed')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tTracking('analytics.costPerTransport')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {missions.map((mission) => (
                    <div key={mission.id} className="flex justify-between">
                      <span className="text-sm">{mission.title}</span>
                      <span className="font-medium">
                        {mission.budgetMin?.toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tTracking('analytics.savingsRealized')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">340,000</p>
                  <p className="text-gray-600">{tTracking('analytics.fcfaSaved')}</p>
                  <p className="text-sm text-green-600 mt-2">
                    {tTracking('analytics.vsLastMonth')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
