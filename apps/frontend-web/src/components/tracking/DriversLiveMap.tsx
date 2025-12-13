import { useEffect, useState, useRef } from 'react';
// Composants UI nécessaires
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { webSocketService, WebSocketEventType } from '@/services/websocket.service';
import { googleMapsLoader } from '@/lib/google-maps-loader';
import { getCookie } from '@/lib/cookie-utils';
import { useAuthStore } from '@/stores/authStore';
import GoogleMapsService from '@/services/google-maps.service';
import { RefreshCw, Clock, MapPin, Activity, Navigation } from 'lucide-react';

interface DriverPosition {
  deviceId: string;
  missionId?: string;
  missionTitle?: string;
  missionStatus?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  driver?: {
    id: string;
    name: string;
  };
  departure?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  arrival?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface DriversLiveMapProps {
  className?: string;
}

interface LocationAPIResponse {
  missionId: string;
  missionTitle?: string;
  missionStatus?: string;
  location?: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp: string;
  };
  driver?: {
    id: string;
    name: string;
  };
  departure?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  arrival?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface ConnectionStatus {
  connected: boolean;
}

interface LocationUpdateData {
  data?: {
    missionId?: string;
    deviceId?: string;
    driverId?: string;
    latitude: number;
    longitude: number;
    timestamp?: string;
    speed?: number;
    heading?: number;
    accuracy?: number;
  };
  missionId?: string;
  deviceId?: string;
  driverId?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
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
  const mapsServiceRef = useRef<GoogleMapsService | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowsRef = useRef<Map<string, google.maps.InfoWindow>>(new Map());
  const departureMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const arrivalMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const routePolylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map());
  const traveledPathPolylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map());

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
    console.log('🗺️ [DriversLiveMap] useEffect - initializeMap triggered', {
      mapLoading,
      hasContainer: !!mapContainerRef.current,
      hasMap: !!mapRef.current,
      hasGoogleMaps: !!window.google?.maps,
    });

    if (mapLoading || !mapContainerRef.current || mapRef.current) {
      console.log('🗺️ [DriversLiveMap] Skipping map initialization:', {
        mapLoading,
        hasContainer: !!mapContainerRef.current,
        hasMap: !!mapRef.current,
      });
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
      
      // Initialiser GoogleMapsService avec la carte déjà créée
      const mapsService = new GoogleMapsService();
      mapsService.setMap(map);
      mapsServiceRef.current = mapsService;
      
      console.log('✅ Map created successfully');
    } catch (error) {
      console.error('❌ Error creating map:', error);
    }
  }, [mapLoading]);

  // Récupérer les positions initiales
  useEffect(() => {
    console.log('📡 [DriversLiveMap] useEffect - fetchInitialPositions triggered', {
      hasCurrentUser: !!currentUser,
      userRole: currentUser?.role,
    });

    const fetchInitialPositions = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
        const token = getCookie('tsa_access_token');

        console.log('📡 [DriversLiveMap] fetchInitialPositions - Start', {
          hasToken: !!token,
          apiUrl,
        });

        if (!token) {
          console.error('❌ No access token found - cannot fetch initial positions');
          return;
        }

        // Determine API endpoint based on user role
        const userRole = currentUser?.role || 'transporteur';
        const endpoint = userRole === 'affreteur'
          ? `${apiUrl}/api/affreteur/missions/active-locations`
          : `${apiUrl}/api/transporteur/missions/active-locations`;

        console.log(`📡 [DriversLiveMap] Fetching GPS positions for role: ${userRole} from ${endpoint}`);

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        console.log('📥 Response from active-locations:', {
          success: data.success,
          hasData: !!data.data,
          hasLocations: !!data.data?.locations,
          locationsCount: data.data?.locations?.length || 0,
        });

        // Log détaillé de la première location pour debug
        if (data.data?.locations && data.data.locations.length > 0) {
          const firstLoc = data.data.locations[0];
          console.log('📥 First location details:', {
            missionId: firstLoc.missionId,
            hasLocation: !!firstLoc.location,
            hasDeparture: !!firstLoc.departure,
            hasArrival: !!firstLoc.arrival,
            departure: firstLoc.departure,
            arrival: firstLoc.arrival,
          });
        }

        if (data.success && data.data.locations) {
          // Convert locations to driver format
          const driversData = data.data.locations
            .map((loc: LocationAPIResponse) => {
              // Si pas de position GPS, utiliser les coordonnées de départ comme position par défaut
              let latitude: number | undefined;
              let longitude: number | undefined;

              if (loc.location?.latitude !== undefined && loc.location?.longitude !== undefined) {
                latitude = Number(loc.location.latitude);
                longitude = Number(loc.location.longitude);
              } else if (loc.departure?.latitude !== undefined && loc.departure?.longitude !== undefined) {
                // Utiliser les coordonnées de départ si pas de position GPS
                latitude = Number(loc.departure.latitude);
                longitude = Number(loc.departure.longitude);
              }

              // Skip si aucune coordonnée valide
              if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
                console.warn('Invalid coordinates for mission:', loc.missionId, {
                  hasLocation: !!loc.location,
                  hasDeparture: !!loc.departure,
                });
                return null;
              }

              const driverData = {
                deviceId: `mission-${loc.missionId}`,
                missionId: loc.missionId,
                missionTitle: loc.missionTitle,
                missionStatus: loc.missionStatus,
                latitude,
                longitude,
                speed: loc.location?.speed ? Number(loc.location.speed) : undefined,
                heading: loc.location?.heading ? Number(loc.location.heading) : undefined,
                accuracy: loc.location?.accuracy ? Number(loc.location.accuracy) : undefined,
                timestamp: loc.location?.timestamp || new Date().toISOString(),
                driver: loc.driver,
                departure: loc.departure,
                arrival: loc.arrival,
              };

              // Log pour debug
              if (!driverData.departure || !driverData.arrival) {
                console.warn(`[Map] Mission ${loc.missionId} missing departure or arrival:`, {
                  hasDeparture: !!driverData.departure,
                  hasArrival: !!driverData.arrival,
                  departure: driverData.departure,
                  arrival: driverData.arrival,
                });
              }

              return driverData;
            })
            .filter((d: DriverPosition | null): d is DriverPosition => d !== null);

          setDrivers(driversData);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error fetching initial positions:', error);
      }
    };

    fetchInitialPositions();
    
    // Polling automatique toutes les 5 secondes pour récupérer les positions même sans WebSocket
    const pollingInterval = setInterval(() => {
      fetchInitialPositions();
    }, 5000); // Polling toutes les 5 secondes
    
    return () => {
      clearInterval(pollingInterval);
    };
  }, [currentUser]);

  // Connexion WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    const handleLocationUpdate = (data: LocationUpdateData) => {
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

      // Validate that we have valid coordinates
      if (locationData.latitude === undefined || locationData.longitude === undefined) {
        console.error('Invalid location data: missing coordinates', locationData);
        return;
      }

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
    const handleConnectionChange = (status: ConnectionStatus) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Supprimer les markers et polylines obsolètes
      const currentDeviceIds = new Set(drivers.map((d) => d.deviceId));
      const currentMissionIds = new Set(drivers.map((d) => d.missionId).filter(Boolean));

      // Nettoyer les markers de driver obsolètes
      for (const [deviceId, marker] of markersRef.current.entries()) {
        if (!currentDeviceIds.has(deviceId)) {
          try {
            const infoWindow = infoWindowsRef.current.get(deviceId);
            if (infoWindow) {
              infoWindow.close();
              infoWindowsRef.current.delete(deviceId);
            }
            marker.setMap(null);
            markersRef.current.delete(deviceId);
          } catch (error) {
            console.error('Error removing driver marker:', deviceId, error);
          }
        }
      }

      // Nettoyer les marqueurs de départ/arrivée obsolètes
      for (const [missionId, marker] of departureMarkersRef.current.entries()) {
        if (!currentMissionIds.has(missionId)) {
          try {
            marker.setMap(null);
            departureMarkersRef.current.delete(missionId);
          } catch (error) {
            console.error('Error removing departure marker:', missionId, error);
          }
        }
      }

      for (const [missionId, marker] of arrivalMarkersRef.current.entries()) {
        if (!currentMissionIds.has(missionId)) {
          try {
            marker.setMap(null);
            arrivalMarkersRef.current.delete(missionId);
          } catch (error) {
            console.error('Error removing arrival marker:', missionId, error);
          }
        }
      }

      // Nettoyer les polylines obsolètes
      for (const [missionId, polyline] of routePolylinesRef.current.entries()) {
        if (!currentMissionIds.has(missionId)) {
          try {
            polyline.setMap(null);
            routePolylinesRef.current.delete(missionId);
          } catch (error) {
            console.error('Error removing route polyline:', missionId, error);
          }
        }
      }

      // Ajouter/mettre à jour les markers et routes
      const bounds = new window.google.maps.LatLngBounds();

      drivers.forEach((driver) => {
        try {
          // Marqueur du driver (position actuelle) - seulement si on a une position GPS récente
          // On vérifie si on a un timestamp récent (moins de 5 minutes) pour afficher le marqueur
          const hasRecentLocation = driver.timestamp && 
            (new Date().getTime() - new Date(driver.timestamp).getTime()) < 5 * 60 * 1000;

          if (hasRecentLocation) {
            const position = { lat: driver.latitude, lng: driver.longitude };
            bounds.extend(position);

            if (markersRef.current.has(driver.deviceId)) {
              const marker = markersRef.current.get(driver.deviceId);
              if (marker) {
                marker.setPosition(position);
                // Mettre à jour l'icône avec heading si disponible
                if (driver.heading !== undefined) {
                  marker.setIcon({
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    rotation: driver.heading,
                    scale: 5,
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  });
                }
              }
            } else {
              const marker = new window.google.maps.Marker({
                position,
                map: mapRef.current,
                title: driver.missionTitle || driver.deviceId,
                icon: driver.heading !== undefined ? {
                  path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  rotation: driver.heading,
                  scale: 5,
                  fillColor: '#2563eb',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                } : {
                  url: 'https://maps.google.com/mapfiles/kml/shapes/truck.png',
                  scaledSize: new window.google.maps.Size(32, 32),
                },
              });
              markersRef.current.set(driver.deviceId, marker);

              const infoWindow = new window.google.maps.InfoWindow();
              infoWindowsRef.current.set(driver.deviceId, infoWindow);
              marker.addListener('click', () => {
                const content = `
                  <div style="padding: 8px; min-width: 200px;">
                    <div style="font-weight: bold; margin-bottom: 4px;">
                      ${driver.missionTitle || driver.deviceId}
                    </div>
                    <div style="font-size: 0.9em;">
                      ${driver.driver?.name ? `<div>Chauffeur: ${driver.driver.name}</div>` : ''}
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
          } else {
            // Supprimer le marqueur si la position n'est plus récente
            if (markersRef.current.has(driver.deviceId)) {
              const marker = markersRef.current.get(driver.deviceId);
              if (marker) {
                marker.setMap(null);
                markersRef.current.delete(driver.deviceId);
              }
            }
          }

          // Marqueurs de départ et d'arrivée - TOUJOURS affichés même sans position GPS
          if (driver.missionId) {
            // Marqueur de départ (vert)
            if (driver.departure?.latitude && driver.departure?.longitude) {
              const depKey = `${driver.missionId}-departure`;
              const depPosition = { lat: driver.departure.latitude, lng: driver.departure.longitude };
              bounds.extend(depPosition);

              if (!departureMarkersRef.current.has(depKey)) {
                const depMarker = new window.google.maps.Marker({
                  position: depPosition,
                  map: mapRef.current,
                  title: 'Point de départ',
                  icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    scaledSize: new window.google.maps.Size(32, 32),
                  },
                });
                departureMarkersRef.current.set(depKey, depMarker);
              } else {
                // Mettre à jour la position si le marqueur existe déjà
                const depMarker = departureMarkersRef.current.get(depKey);
                if (depMarker) {
                  depMarker.setPosition(depPosition);
                }
              }
            }

            // Marqueur d'arrivée (rouge)
            if (driver.arrival?.latitude && driver.arrival?.longitude) {
              const arrKey = `${driver.missionId}-arrival`;
              const arrPosition = { lat: driver.arrival.latitude, lng: driver.arrival.longitude };
              bounds.extend(arrPosition);

              if (!arrivalMarkersRef.current.has(arrKey)) {
                const arrMarker = new window.google.maps.Marker({
                  position: arrPosition,
                  map: mapRef.current,
                  title: "Point d'arrivée",
                  icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    scaledSize: new window.google.maps.Size(32, 32),
                  },
                });
                arrivalMarkersRef.current.set(arrKey, arrMarker);
              } else {
                // Mettre à jour la position si le marqueur existe déjà
                const arrMarker = arrivalMarkersRef.current.get(arrKey);
                if (arrMarker) {
                  arrMarker.setPosition(arrPosition);
                }
              }
            }

            // Calculer la route réelle entre départ et arrivée avec Google Maps Directions API
            if (driver.departure?.latitude && driver.departure?.longitude &&
                driver.arrival?.latitude && driver.arrival?.longitude &&
                mapsServiceRef.current) {
              const routeKey = `${driver.missionId}-route`;
              console.log(`[Map] Calculating route with Google Maps Directions API for mission ${driver.missionId}:`, {
                departure: { lat: driver.departure.latitude, lng: driver.departure.longitude },
                arrival: { lat: driver.arrival.latitude, lng: driver.arrival.longitude },
                routeKey,
                alreadyExists: routePolylinesRef.current.has(routeKey),
              });

              if (!routePolylinesRef.current.has(routeKey) && mapsServiceRef.current) {
                try {
                  // Utiliser Google Maps Directions API pour calculer la vraie route
                  mapsServiceRef.current.displayRoute(
                    { lat: driver.departure.latitude, lng: driver.departure.longitude },
                    { lat: driver.arrival.latitude, lng: driver.arrival.longitude },
                    {
                      routeId: routeKey,
                      strokeColor: '#2563eb',
                      strokeOpacity: 0.6,
                      strokeWeight: 3,
                      departureTime: new Date(),
                      trafficModel: 'best_guess',
                    }
                  ).then((result) => {
                    if (result && result.routes && result.routes[0] && result.routes[0].overview_path) {
                      // La polyline est déjà créée par displayRoute, on la marque comme existante
                      routePolylinesRef.current.set(routeKey, null as any); // Marquer comme créée
                      console.log(`[Map] Route calculated successfully for mission ${driver.missionId} with`, result.routes[0].overview_path.length, 'points');
                    } else {
                      console.warn(`[Map] Route calculation returned no valid route for mission ${driver.missionId}`);
                    }
                  }).catch((error) => {
                    console.error(`[Map] Error calculating route for mission ${driver.missionId}:`, error);
                  });
                } catch (error) {
                  console.error(`[Map] Error creating route for mission ${driver.missionId}:`, error);
                }
              } else {
                console.log(`[Map] Route already calculated for mission ${driver.missionId}`);
              }
            } else {
              console.log(`[Map] Missing departure or arrival coordinates for mission ${driver.missionId}:`, {
                hasDeparture: !!driver.departure,
                hasArrival: !!driver.arrival,
                hasMapsService: !!mapsServiceRef.current,
                departureLat: driver.departure?.latitude,
                departureLng: driver.departure?.longitude,
                arrivalLat: driver.arrival?.latitude,
                arrivalLng: driver.arrival?.longitude,
              });
            }
          }
        } catch (error) {
          console.error('Error updating/adding markers:', error);
        }
      });

      // Ajuster la vue pour afficher tous les marqueurs
      if (mapRef.current && !bounds.isEmpty()) {
        try {
          mapRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        } catch (error) {
          console.error('Error fitting bounds:', error);
        }
      }
    };

    updateMarkers();
  }, [drivers, selectedDriver]);

  // Cleanup SEULEMENT au démontage du composant
  useEffect(() => {
    // Capture refs values in local variables for cleanup
    const infoWindows = infoWindowsRef.current;
    const markers = markersRef.current;
    const departureMarkers = departureMarkersRef.current;
    const arrivalMarkers = arrivalMarkersRef.current;
    const routePolylines = routePolylinesRef.current;
    const traveledPathPolylines = traveledPathPolylinesRef.current;

    return () => {
      console.log('🟠 [DriversLiveMap] Component unmounting - Final cleanup');

      // Cleanup all InfoWindows first
      for (const [deviceId, infoWindow] of infoWindows.entries()) {
        try {
          infoWindow.close();
        } catch (error) {
          console.error('Error closing InfoWindow:', deviceId, error);
        }
      }
      infoWindows.clear();

      // Cleanup all driver markers
      for (const [deviceId, marker] of markers.entries()) {
        try {
          marker.setMap(null);
        } catch (error) {
          console.error('Error removing marker:', deviceId, error);
        }
      }
      markers.clear();

      // Cleanup departure markers
      for (const [missionId, marker] of departureMarkers.entries()) {
        try {
          marker.setMap(null);
        } catch (error) {
          console.error('Error removing departure marker:', missionId, error);
        }
      }
      departureMarkers.clear();

      // Cleanup arrival markers
      for (const [missionId, marker] of arrivalMarkers.entries()) {
        try {
          marker.setMap(null);
        } catch (error) {
          console.error('Error removing arrival marker:', missionId, error);
        }
      }
      arrivalMarkers.clear();

      // Cleanup route polylines
      for (const [missionId, polyline] of routePolylines.entries()) {
        try {
          polyline.setMap(null);
        } catch (error) {
          console.error('Error removing route polyline:', missionId, error);
        }
      }
      routePolylines.clear();

      // Cleanup traveled path polylines
      for (const [missionId, polyline] of traveledPathPolylines.entries()) {
        try {
          polyline.setMap(null);
        } catch (error) {
          console.error('Error removing traveled path polyline:', missionId, error);
        }
      }
      traveledPathPolylines.clear();

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

      console.log('📥 Response from handleRefresh:', {
        success: data.success,
        hasData: !!data.data,
        hasLocations: !!data.data?.locations,
        locationsCount: data.data?.locations?.length || 0,
      });

      // Log détaillé de la première location pour debug
      if (data.data?.locations && data.data.locations.length > 0) {
        const firstLoc = data.data.locations[0];
        console.log('📥 First location details (handleRefresh):', {
          missionId: firstLoc.missionId,
          hasLocation: !!firstLoc.location,
          hasDeparture: !!firstLoc.departure,
          hasArrival: !!firstLoc.arrival,
          departure: firstLoc.departure,
          arrival: firstLoc.arrival,
        });
      }

      if (data.success && data.data.locations) {
        // Convert locations to driver format
        const driversData = data.data.locations
          .map((loc: LocationAPIResponse) => {
            // Si pas de position GPS, utiliser les coordonnées de départ comme position par défaut
            let latitude: number | undefined;
            let longitude: number | undefined;

            if (loc.location?.latitude !== undefined && loc.location?.longitude !== undefined) {
              latitude = Number(loc.location.latitude);
              longitude = Number(loc.location.longitude);
            } else if (loc.departure?.latitude !== undefined && loc.departure?.longitude !== undefined) {
              // Utiliser les coordonnées de départ si pas de position GPS
              latitude = Number(loc.departure.latitude);
              longitude = Number(loc.departure.longitude);
            }

            // Skip si aucune coordonnée valide
            if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
              console.warn('Invalid coordinates for mission:', loc.missionId, {
                hasLocation: !!loc.location,
                hasDeparture: !!loc.departure,
              });
              return null;
            }

            return {
              deviceId: `mission-${loc.missionId}`,
              missionId: loc.missionId,
              missionTitle: loc.missionTitle,
              missionStatus: loc.missionStatus,
              latitude,
              longitude,
              speed: loc.location?.speed ? Number(loc.location.speed) : undefined,
              heading: loc.location?.heading ? Number(loc.location.heading) : undefined,
              accuracy: loc.location?.accuracy ? Number(loc.location.accuracy) : undefined,
              timestamp: loc.location?.timestamp || new Date().toISOString(),
              driver: loc.driver,
              departure: loc.departure,
              arrival: loc.arrival,
            };
          })
          .filter((d: DriverPosition | null): d is DriverPosition => d !== null);

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
