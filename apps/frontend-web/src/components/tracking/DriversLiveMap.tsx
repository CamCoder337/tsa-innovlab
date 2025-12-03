import { useEffect, useState, useRef } from 'react';
// Composants UI nécessaires
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { webSocketService, WebSocketEventType } from '@/services/websocket.service';
import { googleMapsLoader } from '@/lib/google-maps-loader';
import { getCookie } from '@/lib/cookie-utils';
import { useAuthStore } from '@/stores/authStore';
import { RefreshCw, Clock, MapPin, Activity, Navigation } from 'lucide-react';

interface DriverPosition {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  missionTitle?: string;
}

interface DriversLiveMapProps {
  className?: string;
}

export default function DriversLiveMap({ className = '' }: DriversLiveMapProps) {
  console.log('🟠 [DriversLiveMap] Component rendering');

  const { currentUser } = useAuthStore();
  const [drivers, setDrivers] = useState<DriverPosition[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowsRef = useRef<Map<string, google.maps.InfoWindow>>(new Map());

  const mapContainerRef = useRef<HTMLDivElement>(null);

  console.log('🟠 [DriversLiveMap] State:', {
    driversCount: drivers.length,
    selectedDriver,
    isConnected,
    mapLoading,
    hasMap: !!mapRef.current,
    markersCount: markersRef.current.size,
  });

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
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
        const token = getCookie('tsa_access_token');

        if (!token) {
          console.error('❌ No access token found - cannot fetch initial positions');
          return;
        }

        // Determine API endpoint based on user role
        const userRole = currentUser?.role || 'transporteur';
        const endpoint = userRole === 'affreteur'
          ? `${apiUrl}/api/affreteur/missions/active-locations`
          : `${apiUrl}/api/transporteur/missions/active-locations`;

        console.log(`📡 Fetching GPS positions for role: ${userRole} from ${endpoint}`);

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (data.success && data.data.locations) {
          // Convert locations to driver format
          const driversData = data.data.locations
            .map((loc: any) => {
              // Ensure latitude and longitude are numbers
              const latitude = Number(loc.location?.latitude);
              const longitude = Number(loc.location?.longitude);

              // Skip if invalid coordinates
              if (isNaN(latitude) || isNaN(longitude)) {
                console.warn('Invalid coordinates for mission:', loc.missionId, loc.location);
                return null;
              }

              return {
                deviceId: `mission-${loc.missionId}`,
                missionId: loc.missionId,
                missionTitle: loc.missionTitle,
                missionStatus: loc.missionStatus,
                latitude,
                longitude,
                speed: loc.location.speed ? Number(loc.location.speed) : undefined,
                heading: loc.location.heading ? Number(loc.location.heading) : undefined,
                accuracy: loc.location.accuracy ? Number(loc.location.accuracy) : undefined,
                timestamp: loc.location.timestamp,
                driver: loc.driver,
                departure: loc.departure,
                arrival: loc.arrival,
              };
            })
            .filter((d: any) => d !== null);

          setDrivers(driversData);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error fetching initial positions:', error);
      }
    };

    fetchInitialPositions();
  }, [currentUser]);

  // Connexion WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    const handleLocationUpdate = (data: any) => {
      console.log('📍 Received location update:', data);

      // Vérifier si les données sont valides
      if (!data || data.latitude === undefined || data.longitude === undefined) {
        console.error('Invalid location data received:', data);
        return;
      }

      // Extraire les données de localisation
      const locationData = data.data || data;

      // IMPORTANT: Utiliser TOUJOURS missionId comme deviceId pour éviter les doublons
      // Si missionId existe, on crée le deviceId cohérent avec l'API REST
      const deviceId = locationData.missionId
        ? `mission-${locationData.missionId}`
        : locationData.deviceId || `driver-${locationData.driverId || 'unknown'}`;

      console.log('📍 WebSocket location update - deviceId:', deviceId, 'missionId:', locationData.missionId);

      const position: DriverPosition = {
        deviceId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: locationData.timestamp || new Date().toISOString(),
        speed: locationData.speed,
        heading: locationData.heading,
        accuracy: locationData.accuracy
      };

      setDrivers((prev) => {
        const existingIndex = prev.findIndex((d) => d.deviceId === position.deviceId);

        if (existingIndex >= 0) {
          // Mettre à jour position existante
          const updated = [...prev];
          updated[existingIndex] = position;
          return updated;
        } else {
          // Ajouter nouvelle position
          console.log('🚗 New driver connected:', deviceId);
          return [...prev, position];
        }
      });

      setLastUpdate(new Date());

      // Centrer la carte sur le conducteur actif si c'est le seul
      if (mapRef.current) {
        const map = mapRef.current;
        const bounds = new window.google.maps.LatLngBounds();

        // Ajouter tous les conducteurs visibles
        drivers.forEach(driver => {
          bounds.extend({
            lat: driver.latitude,
            lng: driver.longitude
          });
        });

        // Ajouter la nouvelle position
        bounds.extend({
          lat: position.latitude,
          lng: position.longitude
        });

        // Ajuster la vue de la carte avec une interface de padding correcte
        if (map && typeof map.fitBounds === 'function') {
          map.fitBounds(bounds, {
            top: 100, right: 100, bottom: 100, left: 100
          });
        }

        // Limiter le zoom maximum
        if (map && typeof map.getZoom === 'function') {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 15) {
            map.setZoom(15);
          }
        }
      }
    };

    // Gestion des changements de connexion
    const handleConnectionChange = (status: any) => {
      console.log('🔄 WebSocket connection status changed:', status);
      setIsConnected(status.connected);

      if (!status.connected) {
        console.log('WebSocket disconnected, reconnecting...');
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

      // Initialiser le service WebSocket
      webSocketService.initialize(token);

      // S'abonner aux mises à jour de localisation
      const unsubscribeLocation = webSocketService.subscribe<DriverPosition>(
        'location_update',
        handleLocationUpdate
      );

      // S'abonner aux changements d'état de connexion
      const unsubscribeConnected = webSocketService.subscribe(
        WebSocketEventType.CONNECTED,
        () => handleConnectionChange({ connected: true })
      );

      const unsubscribeDisconnected = webSocketService.subscribe(
        WebSocketEventType.DISCONNECTED,
        () => handleConnectionChange({ connected: false })
      );

      // Vérifier l'état de connexion initial
      const status = webSocketService.getConnectionStatus();
      handleConnectionChange(status);

      // Nettoyage lors du démontage du composant
      return () => {
        console.log('🧹 Cleaning up WebSocket subscriptions');
        unsubscribeLocation();
        unsubscribeConnected();
        unsubscribeDisconnected();
      };
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, []);

  // Mettre à jour les markers sur la carte
  useEffect(() => {
    console.log('🟠 [DriversLiveMap] useEffect - updateMarkers triggered');
    console.log('🟠 [DriversLiveMap] Has map:', !!mapRef.current);
    console.log('🟠 [DriversLiveMap] Drivers count:', drivers.length);

    if (!mapRef.current) {
      console.log('🟠 [DriversLiveMap] No map ref, skipping markers update');
      return;
    }

    const updateMarkers = () => {
      console.log('🟠 [DriversLiveMap] updateMarkers - Start');
      if (!mapRef.current) {
        console.log('🟠 [DriversLiveMap] updateMarkers - Skipped (no map)');
        return;
      }

      // Supprimer les markers obsolètes
      const currentDeviceIds = new Set(drivers.map((d) => d.deviceId));
      console.log('🟠 [DriversLiveMap] Current device IDs:', Array.from(currentDeviceIds));
      console.log('🟠 [DriversLiveMap] Existing markers:', Array.from(markersRef.current.keys()));

      for (const [deviceId, marker] of markersRef.current.entries()) {
        if (!currentDeviceIds.has(deviceId)) {
          console.log('🟠 [DriversLiveMap] Removing obsolete marker:', deviceId);
          try {
            // Fermer l'InfoWindow associée si elle existe
            const infoWindow = infoWindowsRef.current.get(deviceId);
            if (infoWindow) {
              console.log('🟠 [DriversLiveMap] Closing InfoWindow for:', deviceId);
              infoWindow.close();
              infoWindowsRef.current.delete(deviceId);
            }
            // Supprimer le marker
            console.log('🟠 [DriversLiveMap] Setting marker to null for:', deviceId);
            marker.setMap(null);
            markersRef.current.delete(deviceId);
            console.log('🟠 [DriversLiveMap] Marker removed successfully:', deviceId);
          } catch (error) {
            console.error('❌ [DriversLiveMap] Error removing marker:', deviceId, error);
          }
        }
      }

      // Ajouter/mettre à jour les markers
      console.log('🟠 [DriversLiveMap] Updating/adding markers for drivers');
      const bounds = new window.google.maps.LatLngBounds();

      drivers.forEach((driver) => {
        try {
          const position = { lat: driver.latitude, lng: driver.longitude };
          bounds.extend(position);

          if (markersRef.current.has(driver.deviceId)) {
            // Mettre à jour position existante
            console.log('🟠 [DriversLiveMap] Updating existing marker:', driver.deviceId);
            const marker = markersRef.current.get(driver.deviceId);
            if (marker) {
              marker.setPosition(position);

              // Mettre à jour le contenu de l'InfoWindow avec les nouvelles données
              const infoWindow = infoWindowsRef.current.get(driver.deviceId);
              if (infoWindow) {
                const content = `
                  <div style="padding: 8px; min-width: 200px;">
                    <div style="font-weight: bold; margin-bottom: 4px;">
                      ${driver.deviceId}
                    </div>
                    <div style="font-size: 0.9em;">
                      <div>Lat: ${driver.latitude.toFixed(6)}</div>
                      <div>Lng: ${driver.longitude.toFixed(6)}</div>
                      ${driver.speed ? `<div>Vitesse: ${(driver.speed * 3.6).toFixed(1)} km/h</div>` : ''}
                      ${driver.accuracy ? `<div>Précision: ${Math.round(driver.accuracy)} m</div>` : ''}
                      <div>Dernière mise à jour: ${new Date(driver.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                `;
                infoWindow.setContent(content);
              }
            }
          } else {
            // Ajouter nouveau marker
            console.log('🟠 [DriversLiveMap] Adding new marker:', driver.deviceId);
            const marker = new window.google.maps.Marker({
              position,
              map: mapRef.current,
              title: driver.deviceId,
            });
            markersRef.current.set(driver.deviceId, marker);

            // Ajouter un écouteur d'événement pour l'InfoWindow
            const infoWindow = new window.google.maps.InfoWindow();
            infoWindowsRef.current.set(driver.deviceId, infoWindow);
            marker.addListener('click', () => {
              const content = `
                <div style="padding: 8px; min-width: 200px;">
                  <div style="font-weight: bold; margin-bottom: 4px;">
                    Conducteur ${driver.deviceId.replace('driver-', '')}
                  </div>
                  <div style="font-size: 0.9em;">
                    <div>Vitesse: ${driver.speed ? `${Math.round(driver.speed * 3.6)} km/h` : 'N/A'}</div>
                    ${driver.accuracy ? `<div>Précision: ${Math.round(driver.accuracy)} m</div>` : ''}
                    <div>Dernière mise à jour: ${new Date(driver.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              `;
              infoWindow.setContent(content);
              if (mapRef.current) {
                infoWindow.open(mapRef.current, marker);
              }
            });
          }
        } catch (error) {
          console.error('Error updating/adding marker:', error);
        }
      });

      // Ajuster la vue pour afficher tous les marqueurs
      if (mapRef.current && !bounds.isEmpty()) {
        try {
          mapRef.current.fitBounds(bounds);
        } catch (error) {
          console.error('Error fitting bounds:', error);
        }
      }
    };

    updateMarkers();
  }, [drivers, selectedDriver]);

  // Cleanup SEULEMENT au démontage du composant
  useEffect(() => {
    return () => {
      console.log('🟠 [DriversLiveMap] Component unmounting - Final cleanup');

      // Cleanup all InfoWindows first
      console.log(
        '🟠 [DriversLiveMap] Cleaning up',
        infoWindowsRef.current.size,
        'InfoWindows'
      );
      for (const [deviceId, infoWindow] of infoWindowsRef.current.entries()) {
        try {
          console.log('🟠 [DriversLiveMap] Closing InfoWindow for:', deviceId);
          infoWindow.close();
        } catch (error) {
          console.error('❌ [DriversLiveMap] Error closing InfoWindow:', deviceId, error);
        }
      }
      infoWindowsRef.current.clear();

      // Cleanup all markers on unmount
      console.log('🟠 [DriversLiveMap] Cleaning up', markersRef.current.size, 'markers');
      for (const [deviceId, marker] of markersRef.current.entries()) {
        try {
          console.log('🟠 [DriversLiveMap] Removing marker:', deviceId);
          marker.setMap(null);
        } catch (error) {
          console.error('❌ [DriversLiveMap] Error removing marker:', deviceId, error);
        }
      }
      markersRef.current.clear();
      console.log('🟠 [DriversLiveMap] Final cleanup completed');
    };
  }, []); // Dépendances vides = cleanup SEULEMENT au unmount

  const handleRefresh = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
      const token = getCookie('tsa_access_token');

      // Determine API endpoint based on user role
      const userRole = currentUser?.role || 'transporteur';
      const endpoint = userRole === 'affreteur'
        ? `${apiUrl}/api/affreteur/missions/active-locations`
        : `${apiUrl}/api/transporteur/missions/active-locations`;

      console.log(`🔄 Refreshing GPS positions for role: ${userRole}`);

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data.locations) {
        // Convert locations to driver format
        const driversData = data.data.locations
          .map((loc: any) => {
            // Ensure latitude and longitude are numbers
            const latitude = Number(loc.location?.latitude);
            const longitude = Number(loc.location?.longitude);

            // Skip if invalid coordinates
            if (isNaN(latitude) || isNaN(longitude)) {
              console.warn('Invalid coordinates for mission:', loc.missionId, loc.location);
              return null;
            }

            return {
              deviceId: `mission-${loc.missionId}`,
              missionId: loc.missionId,
              missionTitle: loc.missionTitle,
              missionStatus: loc.missionStatus,
              latitude,
              longitude,
              speed: loc.location.speed ? Number(loc.location.speed) : undefined,
              heading: loc.location.heading ? Number(loc.location.heading) : undefined,
              accuracy: loc.location.accuracy ? Number(loc.location.accuracy) : undefined,
              timestamp: loc.location.timestamp,
              driver: loc.driver,
              departure: loc.departure,
              arrival: loc.arrival,
            };
          })
          .filter((d: any) => d !== null);

        setDrivers(driversData);
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
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedDriver === driver.deviceId
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
                        <p className="font-medium text-sm">{driver.missionTitle || driver.deviceId}</p>
                        <p className="text-xs text-gray-600 font-mono">
                          {typeof driver.latitude === 'number' && typeof driver.longitude === 'number'
                            ? `${driver.latitude.toFixed(6)}, ${driver.longitude.toFixed(6)}`
                            : 'Position inconnue'}
                        </p>
                        {driver.speed !== undefined && driver.speed !== null && (
                          <p className="text-xs text-gray-600">
                            🚗 {(driver.speed * 3.6).toFixed(1)} km/h
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {driver.timestamp ? new Date(driver.timestamp).toLocaleTimeString() : 'N/A'}
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
