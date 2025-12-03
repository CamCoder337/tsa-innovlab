import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MissionTrackingMap from './MissionTrackingMap';
import type { Mission } from '@/types/mission.types';
import { RefreshCw, Truck } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { webSocketService } from '@/services/websocket.service';
import { toast } from 'sonner';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  missionId?: string;
}

interface RealTimeMissionTrackerProps {
  className?: string;
}

export default function RealTimeMissionTracker({ className = '' }: RealTimeMissionTrackerProps) {
  const { myMissions: missions } = useMissions();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [vehicleLocations, setVehicleLocations] = useState<Record<string, LocationUpdate>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected());

  const subscribedMissions = useRef(new Set<string>());

  // Stable callback to handle location updates
  const handleLocationUpdate = useCallback((location: LocationUpdate) => {
    if (location && location.missionId && typeof location.missionId === 'string') {
      console.log(`Location update received for mission ${location.missionId}`);
      setVehicleLocations(prev => ({ ...prev, [location.missionId!]: location }));
      setLastUpdate(new Date());
    }
  }, []);

  // Stable callback to handle connection status
  const handleConnectionStatus = useCallback((status: boolean) => {
    console.log(`WebSocket connection status: ${status ? 'Connected' : 'Disconnected'}`);
    setIsConnected(status);
    if (status) {
      toast.success('Connecté au serveur de suivi temps réel.');
    } else {
      toast.error('Déconnecté du serveur de suivi. Tentative de reconnexion...');
    }
  }, []);

  // Effect for managing WebSocket connection and global listeners
  useEffect(() => {
    // TODO: Fix WebSocket service to support these methods
    // webSocketService.on('connect', handleConnectionStatus);
    // webSocketService.on('disconnect', handleConnectionStatus);

    if (webSocketService.isConnected()) {
        handleConnectionStatus(true);
    }

    // The main listener for location updates, attached only once.
    // TODO: Fix WebSocket service to support subscribeToGlobalEvent
    // webSocketService.subscribeToGlobalEvent('location:update', handleLocationUpdate);

    setIsLoading(false);

    return () => {
      console.log('Cleaning up RealTimeMissionTracker component listeners.');
      // webSocketService.off('connect', handleConnectionStatus);
      // webSocketService.off('disconnect', handleConnectionStatus);
      // webSocketService.unsubscribeFromGlobalEvent('location:update');
    };
  }, [handleConnectionStatus, handleLocationUpdate]);

  // Effect for managing channel subscriptions based on missions list and connection status
  useEffect(() => {
    if (!isConnected) return;

    const inProgressMissions = new Set(missions.filter(m => m.status === 'in_progress').map(m => m.id));

    // Subscribe to new missions that are in progress
    inProgressMissions.forEach(missionId => {
      if (!subscribedMissions.current.has(missionId)) {
        const channel = `mission_${missionId}`;
        console.log(`Subscribing to ${channel}`);
        // TODO: Fix WebSocket subscribe to handle mission channels
        // webSocketService.subscribe(channel, (data) => console.log(data));
        subscribedMissions.current.add(missionId);
      }
    });

    // Unsubscribe from missions that are no longer in progress
    subscribedMissions.current.forEach(missionId => {
      if (!inProgressMissions.has(missionId)) {
        const channel = `mission_${missionId}`;
        console.log(`Unsubscribing from ${channel}`);
        // TODO: Fix WebSocket unsubscribe to handle mission channels
        // webSocketService.unsubscribe(channel, () => {});
        subscribedMissions.current.delete(missionId);
      }
    });
  }, [missions, isConnected]);

  const activeDriversCount = Object.keys(vehicleLocations).length;

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Tableau de Suivi GPS</h2>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{isConnected ? 'En ligne' : 'Déconnecté'}</span>
                    </div>
                    {lastUpdate && <span className="text-sm text-gray-500 dark:text-gray-400">Dernière MAJ: {lastUpdate.toLocaleTimeString()}</span>}
                </div>
            </div>
            <Button onClick={() => window.location.reload()} disabled={isLoading} className="flex items-center gap-2 w-full sm:w-auto">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
                <Card>
                    <CardContent className="p-2">
                        <MissionTrackingMap
                            className="h-[65vh] rounded-lg"
                            missions={missions}
                            selectedMission={selectedMission}
                            onMissionClick={setSelectedMission}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Chauffeurs Actifs ({activeDriversCount})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeDriversCount > 0 ? (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                {Object.values(vehicleLocations).map(loc => {
                                    const mission = missions.find(m => m.id === loc.missionId);
                                    if (!mission) return null;
                                    return (
                                        <div key={loc.missionId} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${selectedMission?.id === mission.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`} onClick={() => setSelectedMission(mission)}>
                                            <Truck className="w-6 h-6 text-tsa-blue flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">{mission.title}</p>
                                                <p className="text-xs text-gray-500">Vitesse: {loc.speed ? `${(loc.speed * 3.6).toFixed(0)} km/h` : '--'}</p>
                                            </div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-sm text-gray-500 py-8">
                                <p>En attente de positions GPS...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
