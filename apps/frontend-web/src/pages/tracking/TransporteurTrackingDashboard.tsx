import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RealTimeRouteTracker from '../../components/tracking/RealTimeRouteTracker';
import DriversLiveMap from '../../components/tracking/DriversLiveMap';
import VehicleTrackingCredentials from '../../components/tracking/VehicleTrackingCredentials';
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
  Users,
} from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { useMissions } from '@/hooks/useMissions';
import { useCommonTranslation, useTrackingTranslation } from '@/hooks/useTranslation';
import { calculateDistance } from '@/lib/map-utils';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

export default function TransporteurTrackingDashboard() {
  console.log('🔵 [TransporteurTrackingDashboard] Component rendering');

  const { myMissions: missions } = useMissions();
  const { t: tCommon } = useCommonTranslation();
  const { t: tTracking } = useTrackingTranslation();

  console.log('🔵 [TransporteurTrackingDashboard] Missions loaded:', missions?.length);

  // Calculs des KPIs
  const activeAssignments = missions.filter((m) => m.status === 'in_progress');
  const completedToday = missions.filter((m) => m.status === 'completed').length; // Calculé dynamiquement
  const [totalDistance, setTotalDistance] = useState<number>(0); // Calculé à partir des adresses
  const totalEarnings = 0;
  const driverRating = 0;

  // Initialiser avec la première mission active si elle existe
  const [currentAssignment, setCurrentAssignment] = useState<Mission | null>(
    activeAssignments.length > 0 ? activeAssignments[0] : null
  );

  console.log(
    '🔵 [TransporteurTrackingDashboard] Active assignments:',
    activeAssignments?.length
  );
  console.log('🔵 [TransporteurTrackingDashboard] Current assignment:', currentAssignment?.id);

  // Calculate total distance for in-progress missions
  useEffect(() => {
    console.log(
      '🟢 [TransporteurTrackingDashboard] useEffect - calculateTotalDistance triggered'
    );

    const calculateTotalDistance = async () => {
      console.log(
        '🟢 [TransporteurTrackingDashboard] Calculating distance for',
        activeAssignments.length,
        'missions'
      );

      if (activeAssignments.length === 0) {
        console.log('🟢 [TransporteurTrackingDashboard] No active assignments, setting distance to 0');
        setTotalDistance(0);
        return;
      }

      try {
        let total = 0;

        for (const mission of activeAssignments) {
          if (mission.adresseDepart && mission.adresseArrivee) {
            console.log(
              '🟢 [TransporteurTrackingDashboard] Calculating distance for mission:',
              mission.id
            );
            const distance = await calculateDistance(
              mission.adresseDepart,
              mission.adresseArrivee,
              tCommon
            );

            if (distance) {
              console.log(
                '🟢 [TransporteurTrackingDashboard] Distance for mission',
                mission.id,
                ':',
                distance
              );
              total += distance;
            }
          }
        }

        console.log('🟢 [TransporteurTrackingDashboard] Total distance calculated:', total);
        setTotalDistance(total);
      } catch (error) {
        console.error('❌ [TransporteurTrackingDashboard] Error calculating total distance:', error);
        setTotalDistance(0);
      }
    };

    calculateTotalDistance();
  }, [activeAssignments, tCommon]);

  return (
    <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-950 p-3 sm:p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {tTracking('dashboard.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {tTracking('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex items-center gap-2 text-xs sm:text-sm">
            <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
            Support
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            {tTracking('actions.markDelivered')}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="h-10 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  {tTracking('kpis.activeMissions')}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                  {activeAssignments.length}
                </p>
              </div>
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="h-10 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  {tTracking('kpis.completedToday')}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{completedToday}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="h-10 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Distance Totale
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {totalDistance} km
                </p>
              </div>
              <Route className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 dark:text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="h-10 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Gains du Jour
                </p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {totalEarnings.toLocaleString()} FCFA
                </p>
              </div>
              <Battery className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="h-10 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Note Chauffeur
                </p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{driverRating}/5</p>
              </div>
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
          <TabsTrigger value="current" className="text-xs sm:text-sm">
            {tTracking('tabs.currentMission')}
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-xs sm:text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Chauffeurs GPS
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs sm:text-sm">
            {tTracking('tabs.myMissions')}
          </TabsTrigger>
          <TabsTrigger value="earnings" className="text-xs sm:text-sm">
            {tTracking('tabs.earnings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentAssignment ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Carte de navigation */}
              <div className="lg:col-span-2 space-y-4">
                {/* Sélecteur de mission */}
                {activeAssignments.length > 1 && (
                  <Card>
                    <CardContent className="">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          Mission à suivre:
                        </label>
                        <select
                          value={currentAssignment.id}
                          onChange={(e) => {
                            const selected = activeAssignments.find((m) => m.id === e.target.value);
                            if (selected) setCurrentAssignment(selected);
                          }}
                          className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {activeAssignments.map((mission) => (
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

                {/* Suivi d'itinéraire en temps réel */}
                <RealTimeRouteTracker mission={currentAssignment} />

                {/* Statut et actions */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(currentAssignment.status)}`}
                          />
                          <span className="font-medium text-xs sm:text-sm">
                            {getStatusLabel(currentAssignment.status, tCommon)}
                          </span>
                        </div>
                      </div>
                      <Button className="bg-tsa-blue hover:bg-tsa-blue text-xs sm:text-sm w-full sm:w-auto">
                        <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        {tTracking('actions.openGPS')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Détails de la mission */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="">
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-base sm:text-lg">Mission en Cours</span>
                      {currentAssignment.budgetMin! > 200000 && (
                        <Badge className="bg-red-100 text-red-800 text-xs">Prioritaire</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        {currentAssignment.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {currentAssignment.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">
                          {tTracking('mission.departure')}: {currentAssignment.adresseDepart!.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">
                          {tTracking('mission.arrival')}: {currentAssignment.adresseArrivee!.label}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Cargaison:</span>
                          <span className="font-medium">{currentAssignment.typeMarchandise}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Poids:</span>
                          <span className="font-medium">{currentAssignment.poids} kg</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Volume:</span>
                          <span className="font-medium">{currentAssignment.volume} m³</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Paiement:</span>
                          <span className="font-medium text-green-600">
                            {currentAssignment.budgetMin!.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {tTracking('mission.deliveryScheduled')}:
                      </p>
                      <p className="font-medium text-xs sm:text-sm">
                        {new Date(currentAssignment.dateArriveePrevue!).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Appeler Client
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Credentials de tracking du véhicule */}
                <VehicleTrackingCredentials
                  missionTitle={currentAssignment.title}
                  trackingPin={currentAssignment.trackingPin || undefined}
                  vehicleRegistration={currentAssignment.vehicle?.registration}
                  vehicleType={currentAssignment.vehicle?.type}
                />

                {/* Actions rapides */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Actions Rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      {tTracking('actions.markAsDelivered')}
                    </Button>
                    <Button variant="outline" className="w-full text-xs sm:text-sm">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      {tTracking('actions.reportProblem')}
                    </Button>
                    <Button variant="outline" className="w-full text-xs sm:text-sm">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Demander Extension
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Truck className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {tTracking('missions.noActiveMission')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  {tTracking('missions.noActiveMissionMessage')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <DriversLiveMap />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                {tTracking('missions.myMissions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {activeAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                      currentAssignment?.id === assignment.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentAssignment(assignment)}
                  >
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-medium text-sm sm:text-base">
                            {assignment.title}
                          </span>
                          {assignment.budgetMin! > 200000 && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Prioritaire</Badge>
                          )}
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(assignment.status)}`}
                          />
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            {getStatusLabel(assignment.status, tCommon)}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                          {assignment.description}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {assignment.typeMarchandise} - {assignment.poids}kg
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <span>Volume: {assignment.volume}m³</span>
                          <span>Budget: {assignment.budgetMin!.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="font-medium text-green-600 text-sm sm:text-base">
                          {assignment.budgetMin!.toLocaleString()} FCFA
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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

        <TabsContent value="earnings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Gains Aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {totalEarnings.toLocaleString()}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">FCFA</p>
                  <p className="text-xs sm:text-sm text-green-600 mt-2">↗ </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Gains ce Mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-tsa-blue dark:text-tsa-white">
                    0
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">FCFA</p>
                  <p className="text-xs sm:text-sm text-tsa-blue dark:text-tsa-white mt-2">0</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Note Moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{driverRating}</p>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${star <= Math.floor(driverRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {tTracking('performance.basedOnReviews', { count: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Historique des Performances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                Graphique des gains et performances par semaine
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
