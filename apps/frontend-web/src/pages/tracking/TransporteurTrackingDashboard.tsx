import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MissionTrackingMap from '../../components/tracking/MissionTrackingMap';
import {
  Truck,
  Navigation,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Battery,
  Route,
  Phone,
  MessageSquare,
  Star,
} from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { useMissions } from '@/hooks/useMissions';
import { useCommonTranslation, useTrackingTranslation } from '@/hooks/useTranslation';

const getStatusColor = (status: Mission['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'assigned':
      return 'bg-tsa-blue/90';
    case 'published':
      return 'bg-yellow-500';
    case 'draft':
      return 'bg-gray-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusText = (status: Mission['status'], tCommon: (key: string) => string) => {
  switch (status) {
    case 'completed':
      return tCommon('status.completed');
    case 'assigned':
      return tCommon('status.assigned');
    case 'published':
      return tCommon('status.published');
    case 'draft':
      return tCommon('status.draft');
    case 'cancelled':
      return tCommon('status.cancelled');
    default:
      return status;
  }
};

// const getMaintenanceColor = (status: VehicleStatus['maintenanceStatus']) => {
//   switch (status) {
//     case 'good':
//       return 'text-green-600';
//     case 'warning':
//       return 'text-yellow-600';
//     case 'critical':
//       return 'text-red-600';
//     default:
//       return 'text-gray-600';
//   }
// };

export default function TransporteurTrackingDashboard() {
  const { myMissions: missions } = useMissions();
  const { t: tCommon } = useCommonTranslation();
  const { t: tTracking } = useTrackingTranslation();
  const [currentAssignment, setCurrentAssignment] = useState<Mission | null>(null);

  // Calculs des KPIs
  const activeAssignments = missions.filter((m) => m.status === 'in_progress');
  const completedToday = missions.filter((m) => m.status === 'completed').length; // Calculé dynamiquement
  const totalDistance = 0; // Calculé à partir des adresses
  const totalEarnings = 0;
  const driverRating = 0;

  return (
    <div className="flex flex-col flex-1 bg-gray-50 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tTracking('dashboard.title')}</h1>
          <p className="text-gray-600">{tTracking('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Support
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            {tTracking('actions.markDelivered')}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {tTracking('kpis.activeMissions')}
                </p>
                <p className="text-2xl font-bold text-tsa-blue">{activeAssignments.length}</p>
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
                  {tTracking('kpis.completedToday')}
                </p>
                <p className="text-2xl font-bold text-green-600">{completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Distance Totale</p>
                <p className="text-2xl font-bold text-gray-900">{totalDistance} km</p>
              </div>
              <Route className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gains du Jour</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalEarnings.toLocaleString()} FCFA
                </p>
              </div>
              <Battery className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Note Chauffeur</p>
                <p className="text-2xl font-bold text-yellow-600">{driverRating}/5</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid grid-cols-1 lg:grid-cols-3 w-full">
          <TabsTrigger value="current">{tTracking('tabs.currentMission')}</TabsTrigger>
          <TabsTrigger value="assignments">{tTracking('tabs.myMissions')}</TabsTrigger>
          {/* <TabsTrigger value="vehicle">{tTracking('tabs.vehicleStatus')}</TabsTrigger> */}
          <TabsTrigger value="earnings">{tTracking('tabs.earnings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentAssignment ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Carte de navigation */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="w-5 h-5" />
                      Navigation - {currentAssignment.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MissionTrackingMap
                      className="h-[400px]"
                      missions={activeAssignments}
                      selectedMission={currentAssignment}
                      onMissionClick={(mission) => setCurrentAssignment(mission)}
                      showUserLocation={true}
                      showRoutes={true}
                      showLegend={false}
                    />
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(currentAssignment.status)}`}
                          />
                          <span className="font-medium">
                            {getStatusText(currentAssignment.status, tCommon)}
                          </span>
                        </div>
                        {/* <span className="text-gray-600">
                            {tTracking('vehicle.speed')}: {vehicleStatus.speed} km/h
                          </span> */}
                      </div>
                      <Button className="bg-tsa-blue hover:bg-tsa-blue">
                        <Navigation className="w-4 h-4 mr-2" />
                        {tTracking('actions.openGPS')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Détails de la mission */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Mission en Cours</span>
                      {currentAssignment.budgetMin! > 200000 && (
                        <Badge className="bg-red-100 text-red-800">Prioritaire</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{currentAssignment.title}</h4>
                      <p className="text-sm text-gray-600">{currentAssignment.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-500" />
                        <span className="text-sm">
                          {tTracking('mission.departure')}: {currentAssignment.adresseDepartId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-sm">
                          {tTracking('mission.arrival')}: {currentAssignment.adresseArriveeId}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cargaison:</span>
                        <span className="font-medium">{currentAssignment.typeMarchandise}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Poids:</span>
                        <span className="font-medium">{currentAssignment.poids} kg</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Volume:</span>
                        <span className="font-medium">{currentAssignment.volume} m³</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Paiement:</span>
                        <span className="font-medium text-green-600">
                          {currentAssignment.budgetMin!.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-600 mb-2">
                        {tTracking('mission.deliveryScheduled')}:
                      </p>
                      <p className="font-medium">
                        {new Date(currentAssignment.dateArriveePrevue!).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler Client
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions rapides */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions Rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {tTracking('actions.markAsDelivered')}
                    </Button>
                    <Button variant="outline" className="w-full">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {tTracking('actions.reportProblem')}
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Clock className="w-4 h-4 mr-2" />
                      Demander Extension
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {tTracking('missions.noActiveMission')}
                </h3>
                <p className="text-gray-600">{tTracking('missions.noActiveMissionMessage')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tTracking('missions.myMissions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      currentAssignment?.id === assignment.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentAssignment(assignment)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{assignment.title}</span>
                          {assignment.budgetMin! > 200000 && (
                            <Badge className="bg-red-100 text-red-800">Prioritaire</Badge>
                          )}
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(assignment.status)}`}
                          />
                          <span className="text-sm text-gray-600">
                            {getStatusText(assignment.status, tCommon)}
                          </span>
                        </div>
                        <p className="text-gray-600">{assignment.description}</p>
                        <p className="text-sm text-gray-500">
                          {assignment.typeMarchandise} - {assignment.poids}kg
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Volume: {assignment.volume}m³</span>
                          <span>Budget: {assignment.budgetMin!.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {assignment.budgetMin!.toLocaleString()} FCFA
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(assignment.dateArriveePrevue!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="vehicle" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{tTracking('vehicle.status')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{tTracking('vehicle.battery')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${vehicleStatus.batteryLevel}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{vehicleStatus.batteryLevel}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{tTracking('vehicle.fuel')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-tsa-blue/90 h-2 rounded-full"
                          style={{ width: `${vehicleStatus.fuelLevel}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{vehicleStatus.fuelLevel}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">{tTracking('vehicle.currentSpeed')}</span>
                    <span className="font-medium">{vehicleStatus.speed} km/h</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">{tTracking('vehicle.maintenanceStatus')}</span>
                    <span
                      className={`font-medium ${getMaintenanceColor(vehicleStatus.maintenanceStatus)}`}
                    >
                      {vehicleStatus.maintenanceStatus === 'good'
                        ? tTracking('vehicle.maintenanceGood')
                        : vehicleStatus.maintenanceStatus === 'warning'
                          ? tTracking('vehicle.maintenanceWarning')
                          : tTracking('vehicle.maintenanceCritical')}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600">{tTracking('vehicle.currentPosition')}:</p>
                    <p className="font-medium">{vehicleStatus.location}</p>
                    <p className="text-xs text-gray-500">
                      {tTracking('vehicle.lastUpdate')}:
                      {new Date(vehicleStatus.lastUpdate).toLocaleTimeString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{tTracking('vehicle.drivingHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{tTracking('vehicle.kmToday')}</span>
                      <span className="font-medium">245 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{tTracking('vehicle.drivingTime')}</span>
                      <span className="font-medium">6h 30min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{tTracking('vehicle.averageSpeed')}</span>
                      <span className="font-medium">68 km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{tTracking('vehicle.consumption')}</span>
                      <span className="font-medium">28L/100km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{tTracking('vehicle.ecoScore')}</span>
                      <span className="font-medium text-green-600">85/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent> */}

        <TabsContent value="earnings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gains Aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {totalEarnings.toLocaleString()}
                  </p>
                  <p className="text-gray-600">FCFA</p>
                  <p className="text-sm text-green-600 mt-2">↗ </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gains ce Mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-tsa-blue">0</p>
                  <p className="text-gray-600">FCFA</p>
                  <p className="text-sm text-tsa-blue mt-2">0</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Note Moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{driverRating}</p>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.floor(driverRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {tTracking('performance.basedOnReviews', { count: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique des Performances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Graphique des gains et performances par semaine
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
