import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { googleMapsLoader } from '@/lib/google-maps-loader';
import { getCookie } from '@/lib/cookie-utils';
import { webSocketService, WebSocketEventType } from '@/services/websocket.service';
import GoogleMapsService from '@/services/google-maps.service';
import { Navigation, Clock, RefreshCw } from 'lucide-react';
import type { Mission } from '@/types/mission.types';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

interface RealTimeRouteTrackerProps {
  mission: Mission;
  className?: string;
}

interface LocationAPIData {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

interface LocationUpdateData {
  data?: {
    missionId?: string;
    latitude: number;
    longitude: number;
    timestamp?: string;
    speed?: number;
    heading?: number;
    accuracy?: number;
  };
  missionId?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export default function RealTimeRouteTracker({ mission, className = '' }: RealTimeRouteTrackerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapsServiceRef = useRef<GoogleMapsService | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]); // Polylines du chemin parcouru
  const currentRouteIdRef = useRef<string | null>(null); // ID de la route actuelle
  const currentMarkerRef = useRef<google.maps.Marker | null>(null);
  const startMarkerRef = useRef<google.maps.Marker | null>(null);
  const endMarkerRef = useRef<google.maps.Marker | null>(null);

  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Charger Google Maps
  useEffect(() => {
    let isMounted = true;

    const loadGoogleMaps = async () => {
      try {
        console.log('📡 Loading Google Maps API for route tracker...');
        await googleMapsLoader.load({
          libraries: ['places', 'geometry'],
        });
        console.log('✅ Google Maps API loaded');

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading Google Maps:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialiser la carte (une seule fois)
  useEffect(() => {
    if (isLoading || !mapContainerRef.current || mapRef.current) {
      return;
    }

    if (!window.google?.maps) {
      console.error('❌ Google Maps not available');
      return;
    }

    console.log('🗺️ Creating route tracker map...');
    try {
      // Centre par défaut
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: 3.8480, lng: 11.5021 },
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapRef.current = map;

      // Initialiser GoogleMapsService avec la carte déjà créée
      const mapsService = new GoogleMapsService();
      mapsService.setMap(map);
      mapsServiceRef.current = mapsService;

      console.log('✅ Route tracker map created');
    } catch (error) {
      console.error('❌ Error creating map:', error);
    }

    // Cleanup function
    return () => {
      console.log('[RealTimeRouteTracker] Cleaning up map');
      if (mapsServiceRef.current) {
        mapsServiceRef.current.clearRoutes();
      }
      if (startMarkerRef.current) {
        startMarkerRef.current.setMap(null);
        startMarkerRef.current = null;
      }
      if (endMarkerRef.current) {
        endMarkerRef.current.setMap(null);
        endMarkerRef.current = null;
      }
    };
  }, [isLoading]);

  // Mettre à jour les marqueurs et la route quand la mission change
  useEffect(() => {
    if (!mapRef.current || !mapsServiceRef.current || !mission) {
      return;
    }

    console.log('[RealTimeRouteTracker] Updating markers and route for mission:', mission.id);

    // Supprimer l'ancienne route si elle existe
    if (currentRouteIdRef.current) {
      console.log('[RealTimeRouteTracker] Removing previous route:', currentRouteIdRef.current);
      mapsServiceRef.current.removeRoute(currentRouteIdRef.current);
      currentRouteIdRef.current = null;
    }

    // Supprimer les anciens marqueurs
    if (startMarkerRef.current) {
      startMarkerRef.current.setMap(null);
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.setMap(null);
      endMarkerRef.current = null;
    }

    // Centre sur le point de départ de la mission
    const centerLat = mission.adresseDepart?.latitude || 3.8480;
    const centerLng = mission.adresseDepart?.longitude || 11.5021;
    if (mapRef.current) {
      mapRef.current.setCenter({ lat: Number(centerLat), lng: Number(centerLng) });
    }

    // Ajouter les marqueurs de départ et arrivée
    console.log('[RealTimeRouteTracker] Mission data:', {
      hasDepart: !!mission.adresseDepart,
      hasArrivee: !!mission.adresseArrivee,
      departLat: mission.adresseDepart?.latitude,
      departLng: mission.adresseDepart?.longitude,
      arriveeLat: mission.adresseArrivee?.latitude,
      arriveeLng: mission.adresseArrivee?.longitude,
    });

    if (mission.adresseDepart) {
      const departLat = Number(mission.adresseDepart.latitude);
      const departLng = Number(mission.adresseDepart.longitude);
      
      console.log('[RealTimeRouteTracker] Creating departure marker:', {
        lat: departLat,
        lng: departLng,
        isValid: !isNaN(departLat) && !isNaN(departLng),
      });

      if (!isNaN(departLat) && !isNaN(departLng)) {
        startMarkerRef.current = new google.maps.Marker({
          position: {
            lat: departLat,
            lng: departLng,
          },
          map: mapRef.current,
          title: 'Départ',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(32, 32),
          },
        });
        console.log('[RealTimeRouteTracker] Departure marker created');
      } else {
        console.error('[RealTimeRouteTracker] Invalid departure coordinates:', {
          lat: mission.adresseDepart.latitude,
          lng: mission.adresseDepart.longitude,
        });
      }
    } else {
      console.warn('[RealTimeRouteTracker] No departure address');
    }

    if (mission.adresseArrivee) {
      const arriveeLat = Number(mission.adresseArrivee.latitude);
      const arriveeLng = Number(mission.adresseArrivee.longitude);
      
      console.log('[RealTimeRouteTracker] Creating arrival marker:', {
        lat: arriveeLat,
        lng: arriveeLng,
        isValid: !isNaN(arriveeLat) && !isNaN(arriveeLng),
      });

      if (!isNaN(arriveeLat) && !isNaN(arriveeLng)) {
        endMarkerRef.current = new google.maps.Marker({
          position: {
            lat: arriveeLat,
            lng: arriveeLng,
          },
          map: mapRef.current,
          title: 'Arrivée',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32),
          },
        });
        console.log('[RealTimeRouteTracker] Arrival marker created');
      } else {
        console.error('[RealTimeRouteTracker] Invalid arrival coordinates:', {
          lat: mission.adresseArrivee.latitude,
          lng: mission.adresseArrivee.longitude,
        });
      }
    } else {
      console.warn('[RealTimeRouteTracker] No arrival address');
    }

    // Calculer la route réelle entre départ et arrivée avec Google Maps Directions API
    if (mission.adresseDepart && mission.adresseArrivee && mapsServiceRef.current) {
      const departLat = Number(mission.adresseDepart.latitude);
      const departLng = Number(mission.adresseDepart.longitude);
      const arriveeLat = Number(mission.adresseArrivee.latitude);
      const arriveeLng = Number(mission.adresseArrivee.longitude);

      if (!isNaN(departLat) && !isNaN(departLng) && !isNaN(arriveeLat) && !isNaN(arriveeLng)) {
        const newRouteId = `route-${mission.id}`;
        console.log('[RealTimeRouteTracker] Calculating route with Google Maps Directions API for mission', mission.id);

        // Utiliser Google Maps Directions API pour calculer la vraie route
        mapsServiceRef.current.displayRoute(
          { lat: departLat, lng: departLng },
          { lat: arriveeLat, lng: arriveeLng },
          {
            routeId: newRouteId,
            strokeColor: '#2563eb',
            strokeOpacity: 0.6,
            strokeWeight: 3,
            departureTime: new Date(),
            trafficModel: 'best_guess',
          }
        ).then((result) => {
          if (result && result.routes && result.routes[0] && result.routes[0].overview_path) {
            currentRouteIdRef.current = newRouteId;
            console.log('[RealTimeRouteTracker] Route calculated successfully with', result.routes[0].overview_path.length, 'points');
          } else {
            console.warn('[RealTimeRouteTracker] Route calculation returned no valid route');
          }
        }).catch((error) => {
          console.error('[RealTimeRouteTracker] Error calculating route:', error);
        });
      } else {
        console.error('[RealTimeRouteTracker] Cannot calculate route - invalid coordinates');
      }
    }
  }, [mission]);

  // Récupérer l'historique des positions
  useEffect(() => {
    const fetchLocationHistory = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
        const token = getCookie('tsa_access_token');

        if (!token) {
          console.error('❌ No access token');
          return;
        }

        // Utiliser l'endpoint transporteur pour récupérer les positions
        const response = await fetch(
          `${apiUrl}/api/transporteur/missions/${mission.id}/locations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const locationPoints: LocationPoint[] = data.data.map((loc: LocationAPIData) => ({
              latitude: Number(loc.latitude),
              longitude: Number(loc.longitude),
              timestamp: loc.timestamp,
              speed: loc.speed ? Number(loc.speed) : undefined,
              heading: loc.heading ? Number(loc.heading) : undefined,
              accuracy: loc.accuracy ? Number(loc.accuracy) : undefined,
            }));

            setLocations(locationPoints);
            console.log(`📍 Loaded ${locationPoints.length} location points`);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching location history:', error);
      }
    };

    if (mission.id) {
      fetchLocationHistory();
    }
  }, [mission.id]);

  // Écouter les mises à jour WebSocket
  useEffect(() => {
    const handleLocationUpdate = (data: LocationUpdateData) => {
      console.log('📍 Real-time location update:', data);

      const locationData = data.data || data;

      // Vérifier si c'est pour notre mission
      if (locationData.missionId !== mission.id) {
        return;
      }

      const newLocation: LocationPoint = {
        latitude: Number(locationData.latitude),
        longitude: Number(locationData.longitude),
        timestamp: locationData.timestamp || new Date().toISOString(),
        speed: locationData.speed ? Number(locationData.speed) : undefined,
        heading: locationData.heading ? Number(locationData.heading) : undefined,
        accuracy: locationData.accuracy ? Number(locationData.accuracy) : undefined,
      };

      setLocations((prev) => [...prev, newLocation]);
      setLastUpdate(new Date());
    };

    // S'abonner aux mises à jour de localisation
    // La méthode subscribe() retourne une fonction de désabonnement
    const unsubscribe = webSocketService.subscribe(WebSocketEventType.LOCATION_UPDATE, handleLocationUpdate);

    return () => {
      // Appeler la fonction de désabonnement lors du cleanup
      unsubscribe();
    };
  }, [mission.id]);

  // Mettre à jour la polyline et le marqueur quand les positions changent
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) {
      return;
    }

    console.log(`🗺️ Updating route with ${locations.length} points`);

    // Supprimer UNIQUEMENT les polylines du chemin parcouru (pas la polyline de route)
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    // Si pas de locations, on affiche quand même les marqueurs de départ/arrivée et la route
    if (locations.length === 0) {
      console.log('[RealTimeRouteTracker] No locations yet, but showing departure/arrival markers and route');
      
      // Ajuster la vue pour afficher départ et arrivée
      const bounds = new google.maps.LatLngBounds();
      if (mission.adresseDepart) {
        bounds.extend({
          lat: Number(mission.adresseDepart.latitude),
          lng: Number(mission.adresseDepart.longitude),
        });
      }
      if (mission.adresseArrivee) {
        bounds.extend({
          lat: Number(mission.adresseArrivee.latitude),
          lng: Number(mission.adresseArrivee.longitude),
        });
      }
      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
      return;
    }

    // Créer le chemin à partir des positions
    const path = locations.map((loc) => ({
      lat: loc.latitude,
      lng: loc.longitude,
    }));

    // Dessiner des segments avec gradient de couleur (gris → bleu)
    // Les segments les plus anciens sont gris, les plus récents sont bleus
    if (path.length > 1) {
      const totalSegments = path.length - 1;

      for (let i = 0; i < path.length - 1; i++) {
        // Calculer l'opacité et la couleur en fonction de la position
        // Les 50% premiers segments sont gris avec opacité croissante
        // Les 50% derniers segments vont du gris au bleu
        const progress = i / totalSegments;

        let strokeColor: string;
        let strokeOpacity: number;

        if (progress < 0.5) {
          // Première moitié: gris avec opacité croissante
          strokeColor = '#9ca3af'; // Gris
          strokeOpacity = 0.3 + (progress * 0.8); // 0.3 à 0.7
        } else {
          // Deuxième moitié: transition gris → bleu
          const segmentProgress = (progress - 0.5) * 2; // 0 à 1

          // Interpolation entre gris (#9ca3af) et bleu (#3b82f6)
          const r = Math.round(156 + (59 - 156) * segmentProgress);
          const g = Math.round(163 + (130 - 163) * segmentProgress);
          const b = Math.round(175 + (246 - 175) * segmentProgress);

          strokeColor = `rgb(${r}, ${g}, ${b})`;
          strokeOpacity = 0.7 + (segmentProgress * 0.3); // 0.7 à 1.0
        }

        const segment = new google.maps.Polyline({
          path: [path[i], path[i + 1]],
          geodesic: true,
          strokeColor: strokeColor,
          strokeOpacity: strokeOpacity,
          strokeWeight: 4,
          map: mapRef.current,
        });

        polylinesRef.current.push(segment);
      }
    }

    // Mettre à jour le marqueur de position actuelle
    const currentLocation = locations[locations.length - 1];

    if (currentMarkerRef.current) {
      currentMarkerRef.current.setMap(null);
    }

    currentMarkerRef.current = new google.maps.Marker({
      position: {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      },
      map: mapRef.current,
      title: 'Position actuelle',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      animation: google.maps.Animation.BOUNCE,
    });

    // Ajuster la vue pour afficher tout le trajet
    const bounds = new google.maps.LatLngBounds();

    // Ajouter départ et arrivée
    if (mission.adresseDepart) {
      bounds.extend({
        lat: Number(mission.adresseDepart.latitude),
        lng: Number(mission.adresseDepart.longitude),
      });
    }
    if (mission.adresseArrivee) {
      bounds.extend({
        lat: Number(mission.adresseArrivee.latitude),
        lng: Number(mission.adresseArrivee.longitude),
      });
    }

    // Ajouter toutes les positions
    path.forEach((point) => bounds.extend(point));

    mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [locations, mission]);

  // Fonction de rafraîchissement manuel
  const handleRefresh = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
      const token = getCookie('tsa_access_token');

      const response = await fetch(
        `${apiUrl}/api/transporteur/missions/${mission.id}/locations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const locationPoints: LocationPoint[] = data.data.map((loc: LocationAPIData) => ({
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            timestamp: loc.timestamp,
            speed: loc.speed ? Number(loc.speed) : undefined,
            heading: loc.heading ? Number(loc.heading) : undefined,
            accuracy: loc.accuracy ? Number(loc.accuracy) : undefined,
          }));

          setLocations(locationPoints);
          setLastUpdate(new Date());
          console.log(`📍 Refreshed: ${locationPoints.length} location points`);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing locations:', error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <span>Suivi d'Itinéraire Temps Réel</span>
          </div>
          <div className="flex items-center gap-2">
            {locations.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {locations.length} points
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[500px] rounded-b-lg"
            style={{ minHeight: '500px' }}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-b-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Chargement de la carte...</p>
              </div>
            </div>
          )}

          {/* Info overlay */}
          {!isLoading && locations.length > 0 && (
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  {lastUpdate
                    ? `Mis à jour: ${lastUpdate.toLocaleTimeString()}`
                    : 'En attente...'}
                </span>
              </div>
              {locations[locations.length - 1]?.speed !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    Vitesse: {locations[locations.length - 1]?.speed?.toFixed(1) || '0.0'} km/h
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Légende */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
              <span>Départ</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
              <span>Position actuelle</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
              <span>Destination</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="w-12 h-1 rounded"
                style={{
                  background: 'linear-gradient(to right, #9ca3af 0%, #3b82f6 100%)',
                }}
              ></div>
              <span>Trajet (ancien → récent)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
