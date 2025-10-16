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

interface VehicleStatus {
  id: string;
  batteryLevel: number;
  fuelLevel: number;
  speed: number;
  location: string;
  lastUpdate: string;
  maintenanceStatus: 'good' | 'warning' | 'critical';
}

const VEHICLE_STATUS: VehicleStatus = {
  id: 'vehicle-001',
  batteryLevel: 78,
  fuelLevel: 65,
  speed: 72,
  location: 'Edéa, Route Nationale N°3',
  lastUpdate: new Date().toISOString(),
  maintenanceStatus: 'good',
};

const getStatusColor = (status: Mission['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'assigned':
      return 'bg-blue-500';
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

const getStatusText = (status: Mission['status']) => {
  switch (status) {
    case 'completed':
      return 'Terminé';
    case 'assigned':
      return 'Assigné';
    case 'published':
      return 'Publié';
    case 'draft':
      return 'Brouillon';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};

const getMaintenanceColor = (status: VehicleStatus['maintenanceStatus']) => {
  switch (status) {
    case 'good':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export default function TransporteurTrackingDashboard() {
  const { myMissions: missions } = useMissions();
  const [assignments] = useState<Mission[]>(
    missions.filter((m) => m.transporteurId === 'transporteur-1')
  );
  const [vehicleStatus] = useState<VehicleStatus>(VEHICLE_STATUS);
  const [currentAssignment, setCurrentAssignment] = useState<Mission | null>(
    assignments.find((a) => a.status === 'assigned') || assignments[0]
  );

  // Calculs des KPIs
  const activeAssignments = missions.filter((m) => m.transporteurId === 'transporteur-1').length;
  const completedToday = 3; // Calculé dynamiquement
  const totalDistance = 525; // Calculé à partir des adresses
  const totalEarnings = assignments.reduce((sum, a) => sum + a.budgetMax, 0);
  const driverRating = 4.8;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Transporteur</h1>
            <p className="text-gray-600">Gérez vos livraisons et optimisez vos trajets</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Support
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Marquer Livré
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Missions Actives</p>
                  <p className="text-2xl font-bold text-blue-600">{activeAssignments}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Livrées Aujourd'hui</p>
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
          <TabsList>
            <TabsTrigger value="current">Mission Actuelle</TabsTrigger>
            <TabsTrigger value="assignments">Mes Missions</TabsTrigger>
            <TabsTrigger value="vehicle">État Véhicule</TabsTrigger>
            <TabsTrigger value="earnings">Gains & Performance</TabsTrigger>
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
                        missions={assignments}
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
                              {getStatusText(currentAssignment.status)}
                            </span>
                          </div>
                          <span className="text-gray-600">Vitesse: {vehicleStatus.speed} km/h</span>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Navigation className="w-4 h-4 mr-2" />
                          Ouvrir GPS
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
                        {currentAssignment.budgetMax > 200000 && (
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
                            Départ: {currentAssignment.adresseDepartId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span className="text-sm">
                            Arrivée: {currentAssignment.adresseArriveeId}
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
                            {currentAssignment.budgetMax.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-sm text-gray-600 mb-2">Livraison prévue:</p>
                        <p className="font-medium">
                          {new Date(currentAssignment.dateArriveePrevue).toLocaleString()}
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
                        Marquer comme Livré
                      </Button>
                      <Button variant="outline" className="w-full">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Signaler un Problème
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune mission active</h3>
                  <p className="text-gray-600">
                    Vous n'avez pas de mission en cours. Consultez vos missions assignées.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mes Missions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
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
                            {assignment.budgetMax > 200000 && (
                              <Badge className="bg-red-100 text-red-800">Prioritaire</Badge>
                            )}
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusColor(assignment.status)}`}
                            />
                            <span className="text-sm text-gray-600">
                              {getStatusText(assignment.status)}
                            </span>
                          </div>
                          <p className="text-gray-600">{assignment.description}</p>
                          <p className="text-sm text-gray-500">
                            {assignment.typeMarchandise} - {assignment.poids}kg
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Volume: {assignment.volume}m³</span>
                            <span>Budget: {assignment.budgetMax.toLocaleString()} FCFA</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            {assignment.budgetMax.toLocaleString()} FCFA
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(assignment.dateArriveePrevue).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicle" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>État du Véhicule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Batterie</span>
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
                    <span className="text-gray-600">Carburant</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${vehicleStatus.fuelLevel}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{vehicleStatus.fuelLevel}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Vitesse actuelle</span>
                    <span className="font-medium">{vehicleStatus.speed} km/h</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">État maintenance</span>
                    <span
                      className={`font-medium ${getMaintenanceColor(vehicleStatus.maintenanceStatus)}`}
                    >
                      {vehicleStatus.maintenanceStatus === 'good'
                        ? 'Bon'
                        : vehicleStatus.maintenanceStatus === 'warning'
                          ? 'Attention'
                          : 'Critique'}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600">Position actuelle:</p>
                    <p className="font-medium">{vehicleStatus.location}</p>
                    <p className="text-xs text-gray-500">
                      Dernière mise à jour:{' '}
                      {new Date(vehicleStatus.lastUpdate).toLocaleTimeString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historique de Conduite</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Km parcourus aujourd'hui</span>
                      <span className="font-medium">245 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temps de conduite</span>
                      <span className="font-medium">6h 30min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vitesse moyenne</span>
                      <span className="font-medium">68 km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consommation</span>
                      <span className="font-medium">28L/100km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Score éco-conduite</span>
                      <span className="font-medium text-green-600">85/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                    <p className="text-sm text-green-600 mt-2">↗ +15% vs hier</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gains ce Mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">1,850,000</p>
                    <p className="text-gray-600">FCFA</p>
                    <p className="text-sm text-blue-600 mt-2">73% de l'objectif</p>
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
                    <p className="text-sm text-gray-600 mt-2">Basé sur 47 avis</p>
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
    </div>
  );
}
