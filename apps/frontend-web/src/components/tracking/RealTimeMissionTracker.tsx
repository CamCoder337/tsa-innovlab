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
    assigned: missions.filter((m) => m.status === 'assigned').length,
    completed: missions.filter((m) => m.status === 'completed').length,
    inProgress: missions.filter((m) => ['assigned', 'published'].includes(m.status)).length,
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
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des missions en temps réel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statut de connexion */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Suivi Temps Réel des Missions</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Missions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Truck className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Cours</p>
                <p className="text-2xl font-bold text-tsa-blue">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignées</p>
                <p className="text-2xl font-bold text-orange-600">{stats.assigned}</p>
              </div>
              <MapPin className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prioritaires</p>
                <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
              </div>
              <Zap className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carte interactive */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Carte des Missions en Temps Réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MissionTrackingMap
                className="h-[600px]"
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
        <div className="space-y-4">
          {selectedMission ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Mission Sélectionnée</span>
                  <Badge
                    className={`
                      ${selectedMission.status === 'completed' ? 'bg-green-500' : ''}
                      ${selectedMission.status === 'assigned' ? 'bg-blue-500' : ''}
                      ${selectedMission.status === 'published' ? 'bg-yellow-500' : ''}
                      ${selectedMission.status === 'draft' ? 'bg-gray-500' : ''}
                      ${selectedMission.status === 'cancelled' ? 'bg-red-500' : ''}
                      text-white
                    `}
                  >
                    {selectedMission.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">{selectedMission.title}</h4>
                  <p className="text-sm text-gray-600">{selectedMission.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{selectedMission.typeMarchandise}</span>
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
                    <span className="font-medium">
                      {new Date(selectedMission.dateArriveePrevue!).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {selectedMission.budgetMin! > 200000 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-800">Mission Prioritaire</span>
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
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Aucune mission sélectionnée</h3>
                <p className="text-sm text-gray-600">
                  Cliquez sur un marqueur de la carte pour voir les détails
                </p>
              </CardContent>
            </Card>
          )}

          {/* Missions récentes */}
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {missions
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 5)
                  .map((mission) => (
                    <div
                      key={mission.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedMission(mission)}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          mission.status === 'completed'
                            ? 'bg-green-500'
                            : mission.status === 'assigned'
                              ? 'bg-blue-500'
                              : mission.status === 'published'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mission.title}</p>
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
