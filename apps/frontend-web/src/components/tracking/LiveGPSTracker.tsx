import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Pause, Play, RefreshCw } from 'lucide-react';
import missionTrackingService, { type LocationUpdate } from '@/services/mission-tracking.service';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface pour les routes calculées
interface RouteInfo {
  path: google.maps.LatLng[];
  distance: string;
  duration: string;
}

interface LiveGPSTrackerProps {
  missionId: string;
  departureLocation?: { lat: number; lng: number };
  arrivalLocation?: { lat: number; lng: number };
  autoStart?: boolean;
  updateInterval?: number; // en millisecondes (par défaut 5000 = 5s)
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 4.0511, // Douala, Cameroun
  lng: 9.7679,
};

export default function LiveGPSTracker({
  missionId,
  departureLocation,
  arrivalLocation,
  autoStart = true,
  updateInterval = 5000,
}: LiveGPSTrackerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [locations, setLocations] = useState<LocationUpdate[]>([]);
  const [isTracking, setIsTracking] = useState(autoStart);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [plannedRoute, setPlannedRoute] = useState<RouteInfo | null>(null); // Route départ → arrivée
  const [currentToDestRoute, setCurrentToDestRoute] = useState<RouteInfo | null>(null); // Position actuelle → arrivée
  const [routesLoading, setRoutesLoading] = useState(false);
  const stopPollingRef = useRef<(() => void) | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  // Fonction pour calculer une route
  const calculateRoute = useCallback(
    async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number }
    ): Promise<RouteInfo | null> => {
      if (!directionsServiceRef.current) return null;

      return new Promise((resolve) => {
        directionsServiceRef.current!.route(
          {
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              const route = result.routes[0];
              const leg = route.legs[0];
              resolve({
                path: route.overview_path,
                distance: leg.distance?.text || '',
                duration: leg.duration?.text || '',
              });
            } else {
              console.error('Erreur calcul route:', status);
              resolve(null);
            }
          }
        );
      });
    },
    []
  );

  // Calculer la route planifiée (départ → arrivée)
  const calculatePlannedRoute = useCallback(async () => {
    if (!departureLocation || !arrivalLocation || !isLoaded) return;

    setRoutesLoading(true);
    try {
      const route = await calculateRoute(departureLocation, arrivalLocation);
      setPlannedRoute(route);
    } catch (error) {
      console.error('Erreur calcul route planifiée:', error);
    } finally {
      setRoutesLoading(false);
    }
  }, [departureLocation, arrivalLocation, isLoaded, calculateRoute]);

  // Calculer la route depuis la position actuelle vers l'arrivée
  const calculateCurrentToDestRoute = useCallback(async () => {
    if (!arrivalLocation || !locations.length || !isLoaded) return;

    const currentLocation = locations[0];
    const currentPos = {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
    };

    try {
      const route = await calculateRoute(currentPos, arrivalLocation);
      setCurrentToDestRoute(route);
    } catch (error) {
      console.error('Erreur calcul route actuelle:', error);
    }
  }, [arrivalLocation, locations, isLoaded, calculateRoute]);

  // Démarrer le polling
  const startPolling = useCallback(() => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
    }

    const cleanup = missionTrackingService.startLocationPolling(
      missionId,
      (newLocations) => {
        // Use functional update to avoid stale closure
        setLocations((prev) => {
          // Avoid duplicates
          const existingIds = new Set(prev.map((loc) => loc.id));
          const uniqueNew = newLocations.filter((loc) => !existingIds.has(loc.id));
          return [...uniqueNew, ...prev];
        });
        setLastUpdate(new Date());

        // Centrer la carte sur la dernière position
        if (newLocations.length > 0 && mapRef.current) {
          try {
            const lastLocation = newLocations[0];
            mapRef.current.panTo({
              lat: lastLocation.latitude,
              lng: lastLocation.longitude,
            });
          } catch (error) {
            console.error('Error panning map:', error);
          }
        }
      },
      updateInterval
    );

    stopPollingRef.current = cleanup;
  }, [missionId, updateInterval]);

  // Initialiser le service de directions quand Google Maps est chargé
  useEffect(() => {
    if (isLoaded && !directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
  }, [isLoaded]);

  // Calculer la route planifiée au chargement
  useEffect(() => {
    if (isLoaded && departureLocation && arrivalLocation) {
      calculatePlannedRoute();
    }
  }, [isLoaded, departureLocation, arrivalLocation, calculatePlannedRoute]);

  // Charger les locations initiales
  useEffect(() => {
    let isMounted = true;

    const fetchInitialLocations = async () => {
      setLoading(true);
      try {
        const response = await missionTrackingService.getLocationUpdates(missionId, 100);
        if (isMounted) {
          setLocations(response.locations);
          if (response.locations.length > 0) {
            setLastUpdate(new Date(response.locations[0].timestamp));
          }
        }
      } catch (error) {
        console.error('Error fetching initial locations:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialLocations();

    return () => {
      isMounted = false;
    };
  }, [missionId]);

  // Recalculer la route actuelle → destination quand la position change
  useEffect(() => {
    if (locations.length > 0) {
      calculateCurrentToDestRoute();
    }
  }, [locations, calculateCurrentToDestRoute]);

  // Gérer le polling automatique
  useEffect(() => {
    if (isTracking) {
      startPolling();
    }

    return () => {
      if (stopPollingRef.current) {
        stopPollingRef.current();
      }
    };
  }, [isTracking, startPolling]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const refreshNow = async () => {
    setLoading(true);
    try {
      const response = await missionTrackingService.getLocationUpdates(missionId, 10);
      if (response.locations.length > 0) {
        setLocations((prev) => {
          // Avoid duplicates
          const existingIds = new Set(prev.map((loc) => loc.id));
          const uniqueNew = response.locations.filter((loc) => !existingIds.has(loc.id));
          return [...uniqueNew, ...prev];
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error refreshing locations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculer le centre et le zoom de la carte
  const getMapBounds = () => {
    if (locations.length === 0) {
      if (departureLocation) return departureLocation;
      return defaultCenter;
    }

    const lastLocation = locations[0];
    return {
      lat: lastLocation.latitude,
      lng: lastLocation.longitude,
    };
  };

  // Construire le chemin parcouru (polyline)
  const getPath = () => {
    return locations
      .slice()
      .reverse()
      .map((loc) => ({
        lat: loc.latitude,
        lng: loc.longitude,
      }));
  };

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suivi GPS en Temps Réel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Impossible de charger la carte
            </p>
            <p className="text-xs text-muted-foreground">
              Vérifiez votre connexion internet ou contactez le support
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suivi GPS en Temps Réel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentLocation = locations.length > 0 ? locations[0] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Suivi GPS en Temps Réel
            </CardTitle>
            <CardDescription>
              {locations.length} position{locations.length > 1 ? 's' : ''} enregistrée
              {locations.length > 1 ? 's' : ''}
              {lastUpdate && ` • Dernière mise à jour ${formatDistanceToNow(lastUpdate, { locale: fr, addSuffix: true })}`}
              {routesLoading && ' • Calcul des itinéraires...'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshNow} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant={isTracking ? 'default' : 'outline'} size="sm" onClick={toggleTracking}>
              {isTracking ? (
                <>
                  <Pause className="mr-1 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-1 h-4 w-4" />
                  Reprendre
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations des routes */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Route planifiée */}
          {plannedRoute && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-6 bg-green-500 border-dashed" style={{ borderStyle: 'dashed', borderWidth: '1px 0' }} />
                <h4 className="font-medium text-green-800">Route planifiée</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-green-600">Distance: {plannedRoute.distance}</p>
                </div>
                <div>
                  <p className="text-green-600">Durée: {plannedRoute.duration}</p>
                </div>
              </div>
            </div>
          )}

          {/* Route actuelle */}
          {currentToDestRoute && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-6 bg-orange-500" />
                <h4 className="font-medium text-orange-800">Route actuelle</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-orange-600">Distance: {currentToDestRoute.distance}</p>
                </div>
                <div>
                  <p className="text-orange-600">Durée: {currentToDestRoute.duration}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informations position actuelle */}
        {currentLocation && (
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Latitude</p>
              <p className="font-mono text-sm">{currentLocation.latitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Longitude</p>
              <p className="font-mono text-sm">{currentLocation.longitude.toFixed(6)}</p>
            </div>
            {currentLocation.speed !== null && currentLocation.speed !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Vitesse</p>
                <p className="font-mono text-sm">{(currentLocation.speed * 3.6).toFixed(1)} km/h</p>
              </div>
            )}
            {currentLocation.accuracy !== null && currentLocation.accuracy !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Précision</p>
                <p className="font-mono text-sm">{currentLocation.accuracy.toFixed(0)}m</p>
              </div>
            )}
          </div>
        )}

        {/* Carte Google Maps */}
        <div className="overflow-hidden rounded-lg border">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={getMapBounds()}
            zoom={13}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
            }}
            onLoad={(map: google.maps.Map) => {
              mapRef.current = map;
            }}
          >
            {/* Marker point de départ */}
            {departureLocation && (
              <Marker
                position={departureLocation}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                }}
                title="Point de départ"
              />
            )}

            {/* Marker point d'arrivée */}
            {arrivalLocation && (
              <Marker
                position={arrivalLocation}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                }}
                title="Point d'arrivée"
              />
            )}

            {/* Marker position actuelle */}
            {currentLocation && (
              <Marker
                position={{
                  lat: currentLocation.latitude,
                  lng: currentLocation.longitude,
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#4F46E5',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
                title="Position actuelle"
              />
            )}

            {/* Route planifiée (départ → arrivée) */}
            {plannedRoute && (
              <Polyline
                path={plannedRoute.path}
                options={{
                  strokeColor: '#10B981', // Vert pour la route planifiée
                  strokeOpacity: 0.7,
                  strokeWeight: 4,
                  // Note: strokeDashArray n'est pas supporté par Google Maps Polyline
                }}
              />
            )}

            {/* Route actuelle (position → arrivée) */}
            {currentToDestRoute && locations.length > 0 && (
              <Polyline
                path={currentToDestRoute.path}
                options={{
                  strokeColor: '#F59E0B', // Orange pour la route actuelle
                  strokeOpacity: 0.8,
                  strokeWeight: 5,
                }}
              />
            )}

            {/* Polyline (chemin parcouru) */}
            {locations.length > 1 && (
              <Polyline
                path={getPath()}
                options={{
                  strokeColor: '#4F46E5', // Bleu pour le chemin parcouru
                  strokeOpacity: 0.9,
                  strokeWeight: 3,
                }}
              />
            )}
          </GoogleMap>
        </div>

        {/* Légende */}
        <div className="grid grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Départ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Arrivée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-indigo-600" />
            <span className="text-muted-foreground">Position actuelle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-green-500 border-dashed border-t-2" style={{ borderStyle: 'dashed' }} />
            <span className="text-muted-foreground">Route planifiée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-6 bg-orange-500" />
            <span className="text-muted-foreground">Route actuelle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-indigo-600" />
            <span className="text-muted-foreground">Trajet parcouru</span>
          </div>
        </div>

        {/* Statut du tracking */}
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <div className="flex items-center gap-2">
            <Navigation className={`h-4 w-4 ${isTracking ? 'animate-pulse text-green-500' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">
              {isTracking ? 'Tracking actif' : 'Tracking en pause'}
            </span>
          </div>
          {isTracking && (
            <Badge variant="outline" className="font-normal">
              Mise à jour toutes les {updateInterval / 1000}s
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
