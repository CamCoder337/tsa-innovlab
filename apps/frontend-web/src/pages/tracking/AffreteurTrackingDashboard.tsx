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
    <div className="flex flex-col flex-1 bg-gray-50 p-3 sm:p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{tTracking('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{tTracking('dashboard.subtitle')}</p>
        </div>
        <Link to="/app/missions/create">
          <Button className="bg-tsa-blue hover:bg-tsa-blue/80 w-full sm:w-auto">
            <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="text-sm sm:text-base">{tTracking('navigation.newMission')}</span>
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {tTracking('kpis.totalMissions')}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalMissions}</p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{tCommon('status.in_progress')}</p>
                <p className="text-xl sm:text-2xl font-bold text-tsa-blue">{ongoingMissions.length}</p>
              </div>
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {tTracking('kpis.completedMissions')}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{completedMissions}</p>
              </div>
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{tTracking('kpis.revenue')}</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {totalRevenue.toLocaleString()} FCFA
                </p>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {tTracking('performance.responseTime')}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{avgDeliveryTime}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">{tTracking('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="missions" className="text-xs sm:text-sm">{tTracking('tabs.missionDetails')}</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">{tTracking('tabs.analytics')}</TabsTrigger>
          <TabsTrigger value="costs" className="text-xs sm:text-sm">{tTracking('tabs.costs')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Carte */}
            <div className="lg:col-span-2 space-y-4">
              {/* Sélecteur de mission */}
              {missions.length > 1 && (
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                        Mission à suivre:
                      </label>
                      <select
                        value={currentMission?.id || ''}
                        onChange={(e) => {
                          const selected = missions.find((m) => m.id === e.target.value);
                          if (selected) setCurrentMission(selected);
                        }}
                        className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Sélectionner une mission --</option>
                        {missions.map((mission) => (
                          <option key={mission.id} value={mission.id}>
                            {mission.title} - {mission.adresseDepart?.city} → {mission.adresseArrivee?.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    {tTracking('map.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MissionTrackingMap
                    className="h-[400px] sm:h-[500px] lg:h-[700px]"
                    missions={missions}
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
          </div>
        </TabsContent>

        <TabsContent value="missions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">{tTracking('missions.list')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {ongoingMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/mission/${mission.id}/tracking`)}
                  >
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm sm:text-base">{mission.title}</span>
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(mission.status)}`}
                          />
                        </div>
                        <p className="text-gray-600 text-xs sm:text-sm">{mission.description}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          <span>
                            {mission.typeMarchandise} - {mission.poids}kg
                          </span>
                          <span>{mission.budgetMin?.toLocaleString()} FCFA</span>
                          {mission.transporteurId && <span>👤 {tCommon('status.assigned')}</span>}
                        </div>
                      </div>
                      <div className="text-left lg:text-right flex flex-row lg:flex-col items-center lg:items-end gap-2">
                        <div className="flex-1 lg:flex-none">
                          <p className="text-xs sm:text-sm text-gray-500">
                            {tTracking('mission.deliveryScheduled')}
                          </p>
                          <p className="font-medium text-xs sm:text-sm">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">{tTracking('analytics.shipmentEvolution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500 text-xs sm:text-sm">
                  {tTracking('analytics.monthlyShipmentChart')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">{tTracking('analytics.destinationBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500 text-xs sm:text-sm">
                  {tTracking('analytics.destinationPieChart')}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">{tTracking('performance.monthlyBudget')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-tsa-blue">2,450,000</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{tTracking('performance.fcfaThisMonth')}</p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-tsa-blue h-2 rounded-full" style={{ width: '73%' }}></div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">{tTracking('analytics.budgetUsed')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">{tTracking('analytics.costPerTransport')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {missions.map((mission) => (
                    <div key={mission.id} className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm truncate flex-1 mr-2">{mission.title}</span>
                      <span className="font-medium text-xs sm:text-sm flex-shrink-0">
                        {mission.budgetMin?.toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">{tTracking('analytics.savingsRealized')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">340,000</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{tTracking('analytics.fcfaSaved')}</p>
                  <p className="text-xs sm:text-sm text-green-600 mt-2">
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
