import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MissionTrackingMap from './MissionTrackingMap';
import type { Mission } from '@/types/mission.types';
import { RefreshCw, MapPin, Truck, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';

interface RealTimeMissionTrackerProps {
  className?: string;
}

// Simulation des mises à jour temps réel via WebSocket
const simulateRealTimeUpdates = (
  missions: Mission[],
  onUpdate: (updatedMissions: Mission[]) => void
) => {
  const interval = setInterval(() => {
    const updatedMissions = missions.map((mission) => {
      // Simuler des changements de statut aléatoirement
      if (Math.random() < 0.1) {
        // 10% de chance de changement
        const possibleStatuses: Mission['status'][] = [
          'draft',
          'published',
          'assigned',
          'completed',
        ];
        const currentIndex = possibleStatuses.indexOf(mission.status);
        const nextIndex = Math.min(currentIndex + 1, possibleStatuses.length - 1);

        return {
          ...mission,
          status: possibleStatuses[nextIndex],
          updatedAt: new Date().toISOString(),
        };
      }
      return mission;
    });

    onUpdate(updatedMissions);
  }, 5000); // Mise à jour toutes les 5 secondes

  return () => clearInterval(interval);
};

export default function RealTimeMissionTracker({ className = '' }: RealTimeMissionTrackerProps) {
  const { myMissions: missions, setMyMissions: setMissions } = useMissions();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);

  // Charger les missions initiales
  useEffect(() => {
    const loadMissions = async () => {
      try {
        setIsLoading(true);
        setLastUpdate(new Date());
        setIsConnected(true);
      } catch (error) {
        console.error('Erreur lors du chargement des missions:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadMissions();
  }, []);

  // Configurer les mises à jour temps réel
  useEffect(() => {
    if (missions.length === 0) return;

    const cleanup = simulateRealTimeUpdates(missions, (updatedMissions) => {
      setMissions(updatedMissions);
      setLastUpdate(new Date());
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions]); // Seulement quand les missions sont chargées initialement

  // Statistiques temps réel
  const stats = {
    total: missions.length,
    inProgress: missions.filter((m) => m.status === 'in_progress').length,
    completed: missions.filter((m) => m.status === 'completed').length,
    published: missions.filter((m) => m.status === 'published').length,
    highPriority: missions.filter((m) => m.budgetMax! > 200000).length,
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (error) {
      console.error("Erreur lors de l'actualisation:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && missions.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-4 sm:p-8">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">
            Chargement des missions en temps réel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* En-tête avec statut de connexion */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Suivi Temps Réel des Missions
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-xs sm:text-sm text-gray-600">
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
          <span className="sm:hidden">Actualiser</span>
        </Button>
      </div>

      {/* Statistiques temps réel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Missions</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">En Cours</p>
                <p className="text-lg sm:text-2xl font-bold text-tsa-blue">{stats.inProgress}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Publiées</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.published}</p>
              </div>
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Prioritaires</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.highPriority}</p>
              </div>
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carte interactive */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="xl:col-span-3">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Carte des Missions en Temps Réel</span>
                <span className="sm:hidden">Missions Temps Réel</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MissionTrackingMap
                className="h-[400px] sm:h-[600px] lg:h-[800px]"
                missions={missions}
                selectedMission={selectedMission}
                onMissionClick={setSelectedMission}
                showUserLocation={true}
                showRoutes={true}
                showLegend={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Panneau de détails */}
        <div className="space-y-3 sm:space-y-4">
          {selectedMission ? (
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                  <span className="truncate">Mission Sélectionnée</span>
                  <Badge
                    className={`
                      ${selectedMission.status === 'completed' ? 'bg-green-500' : ''}
                      ${selectedMission.status === 'in_progress' ? 'bg-tsa-blue/90' : ''}
                      ${selectedMission.status === 'published' ? 'bg-yellow-500' : ''}
                      ${selectedMission.status === 'draft' ? 'bg-gray-500' : ''}
                      ${selectedMission.status === 'cancelled' ? 'bg-red-500' : ''}
                      text-white text-xs
                    `}
                  >
                    {selectedMission.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-semibold text-sm sm:text-base truncate">
                    {selectedMission.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {selectedMission.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium truncate ml-2">
                      {selectedMission.typeMarchandise}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Poids:</span>
                    <span className="font-medium">{selectedMission.poids} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-medium">{selectedMission.volume} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium text-green-600">
                      {selectedMission.budgetMin?.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Livraison:</span>
                    <span className="font-medium text-xs sm:text-sm">
                      {new Date(selectedMission.dateArriveePrevue!).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {selectedMission.budgetMin! > 200000 && (
                  <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-red-800">
                        Mission Prioritaire
                      </span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Budget élevé - Suivi renforcé requis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 sm:p-8 text-center">
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">
                  Aucune mission sélectionnée
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Cliquez sur un marqueur de la carte pour voir les détails
                </p>
              </CardContent>
            </Card>
          )}

          {/* Missions récentes */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-sm sm:text-base">Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {missions
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 5)
                  .map((mission) => (
                    <div
                      key={mission.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedMission(mission)}
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          mission.status === 'completed'
                            ? 'bg-green-500'
                            : mission.status === 'in_progress'
                              ? 'bg-tsa-blue/90'
                              : mission.status === 'published'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{mission.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(mission.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
