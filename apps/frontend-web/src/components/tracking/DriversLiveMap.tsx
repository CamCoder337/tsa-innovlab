import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, RefreshCw, Activity, Clock } from 'lucide-react';
import { webSocketService } from '@/services/websocket.service';
import { googleMapsLoader } from '@/lib/google-maps-loader';
import { useAuth } from '@/hooks/useAuth';
import { getCookie } from '@/lib/cookie-utils';

interface DriverPosition {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

interface DriversLiveMapProps {
  className?: string;
}

export default function DriversLiveMap({ className = '' }: DriversLiveMapProps) {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<DriverPosition[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Charger Google Maps
  useEffect(() => {
    let isMounted = true;

    const loadGoogleMaps = async () => {
      try {
        console.log('📡 Loading Google Maps API...');
        await googleMapsLoader.load({
          libraries: ['places', 'geometry', 'marker'],
        });
        console.log('✅ Google Maps API loaded');

        if (isMounted) {
          setMapLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading Google Maps:', error);
        if (isMounted) {
          setMapLoading(false);
        }
      }
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialiser la carte une fois que Google Maps est chargé ET le container disponible
  useEffect(() => {
    if (mapLoading || !mapContainerRef.current || mapRef.current) {
      return;
    }

    if (!window.google?.maps) {
      console.error('❌ Google Maps not available');
      return;
    }

    console.log('🗺️ Creating map instance...');
    try {
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: 3.8480, lng: 11.5021 }, // Yaoundé, Cameroun
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapRef.current = map;
      console.log('✅ Map created successfully');
    } catch (error) {
      console.error('❌ Error creating map:', error);
    }
  }, [mapLoading]);

  // Récupérer les positions initiales
  useEffect(() => {
    const fetchInitialPositions = async () => {
      try {
        const response = await fetch('http://localhost:3333/api/tracking/locations');
        const data = await response.json();

        if (data.success && data.data.positions) {
          setDrivers(data.data.positions);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error fetching initial positions:', error);
      }
    };

    fetchInitialPositions();
  }, []);

  // Connexion WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    const handleLocationUpdate = (message: any) => {
      if (message.type === 'location_update' && message.data) {
        const position: DriverPosition = message.data;

        setDrivers((prev) => {
          const existingIndex = prev.findIndex((d) => d.deviceId === position.deviceId);

          if (existingIndex >= 0) {
            // Mettre à jour position existante
            const updated = [...prev];
            updated[existingIndex] = position;
            return updated;
          } else {
            // Ajouter nouvelle position
            return [...prev, position];
          }
        });

        setLastUpdate(new Date());
      }
    };

    // Initialiser le WebSocket avec le token d'authentification
    const token = getCookie('tsa_access_token');
    if (!token) {
      console.error('❌ No access token found in cookies - WebSocket cannot connect');
      setIsConnected(false);
      return;
    }

    try {
      console.log('🔌 Initializing WebSocket with auth token from cookie');
      webSocketService.initialize(token);

      // S'abonner aux mises à jour de localisation
      const unsubscribe = webSocketService.subscribe('location_update', handleLocationUpdate);

      // Vérifier l'état de connexion
      const checkConnection = setInterval(() => {
        const status = webSocketService.getConnectionStatus();
        setIsConnected(status.connected);
        if (!status.connected && status.reconnectAttempts === 0) {
          console.log('WebSocket disconnected, reconnecting...');
        }
      }, 3000);

      return () => {
        clearInterval(checkConnection);
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, []);

  // Mettre à jour les markers sur la carte
  useEffect(() => {
    if (!mapRef.current) return;

    // Supprimer les markers obsolètes
    const currentDeviceIds = new Set(drivers.map((d) => d.deviceId));
    for (const [deviceId, marker] of markersRef.current.entries()) {
      if (!currentDeviceIds.has(deviceId)) {
        marker.setMap(null);
        markersRef.current.delete(deviceId);
      }
    }

    // Ajouter/mettre à jour les markers
    drivers.forEach((driver) => {
      const position = { lat: driver.latitude, lng: driver.longitude };

      if (markersRef.current.has(driver.deviceId)) {
        // Mettre à jour position existante
        const marker = markersRef.current.get(driver.deviceId)!;
        marker.setPosition(position);
      } else {
        // Créer nouveau marker
        const marker = new google.maps.Marker({
          position,
          map: mapRef.current!,
          title: driver.deviceId,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });

        // Info window au clic
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${driver.deviceId}</h3>
              <p style="margin: 4px 0;">Lat: ${driver.latitude.toFixed(6)}</p>
              <p style="margin: 4px 0;">Lng: ${driver.longitude.toFixed(6)}</p>
              ${driver.speed ? `<p style="margin: 4px 0;">Vitesse: ${(driver.speed * 3.6).toFixed(1)} km/h</p>` : ''}
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                ${new Date(driver.timestamp).toLocaleString()}
              </p>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapRef.current!, marker);
          setSelectedDriver(driver.deviceId);
        });

        markersRef.current.set(driver.deviceId, marker);
      }
    });

    // Centrer la carte sur les drivers si disponibles
    if (drivers.length > 0 && !selectedDriver) {
      const bounds = new google.maps.LatLngBounds();
      drivers.forEach((driver) => {
        bounds.extend({ lat: driver.latitude, lng: driver.longitude });
      });
      mapRef.current.fitBounds(bounds);
    }
  }, [drivers, selectedDriver]);

  const handleRefresh = async () => {
    try {
      const response = await fetch('http://localhost:3333/api/tracking/locations');
      const data = await response.json();

      if (data.success && data.data.positions) {
        setDrivers(data.data.positions);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error refreshing positions:', error);
    }
  };

  const selectedDriverData = drivers.find((d) => d.deviceId === selectedDriver);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* En-tête avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Chauffeurs Actifs
                </p>
                <p className="text-2xl font-bold text-blue-600">{drivers.length}</p>
              </div>
              <Navigation className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Connexion</p>
                <p className="text-lg font-semibold">
                  {isConnected ? (
                    <Badge className="bg-green-100 text-green-800">🟢 En ligne</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">🔴 Hors ligne</Badge>
                  )}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Dernière MAJ
                </p>
                <p className="text-sm font-medium">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Aucune'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Button onClick={handleRefresh} className="w-full" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Carte et liste */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Carte */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Carte de Tracking GPS en Temps Réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mapLoading ? (
              <div className="w-full h-[500px] rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement de Google Maps...</p>
                </div>
              </div>
            ) : (
              <div ref={mapContainerRef} className="w-full h-[500px] rounded-lg" />
            )}
          </CardContent>
        </Card>

        {/* Liste des chauffeurs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chauffeurs Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {drivers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Navigation className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Aucun chauffeur actif</p>
                  <p className="text-sm">En attente de positions GPS...</p>
                </div>
              ) : (
                drivers.map((driver) => (
                  <div
                    key={driver.deviceId}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDriver === driver.deviceId
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedDriver(driver.deviceId);
                      if (mapRef.current) {
                        mapRef.current.setCenter({
                          lat: driver.latitude,
                          lng: driver.longitude,
                        });
                        mapRef.current.setZoom(15);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-sm">{driver.deviceId}</p>
                        <p className="text-xs text-gray-600 font-mono">
                          {driver.latitude.toFixed(6)}, {driver.longitude.toFixed(6)}
                        </p>
                        {driver.speed !== undefined && (
                          <p className="text-xs text-gray-600">
                            🚗 {(driver.speed * 3.6).toFixed(1)} km/h
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(driver.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-xs">Actif</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails du chauffeur sélectionné */}
      {selectedDriverData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails - {selectedDriverData.deviceId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Latitude</p>
                <p className="font-mono font-medium">{selectedDriverData.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Longitude</p>
                <p className="font-mono font-medium">{selectedDriverData.longitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vitesse</p>
                <p className="font-medium">
                  {selectedDriverData.speed
                    ? `${(selectedDriverData.speed * 3.6).toFixed(1)} km/h`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Direction</p>
                <p className="font-medium">
                  {selectedDriverData.heading ? `${selectedDriverData.heading.toFixed(0)}°` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
