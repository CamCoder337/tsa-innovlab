import { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Pause, Play, RefreshCw } from 'lucide-react';
import missionTrackingService, { type LocationUpdate } from '@/services/mission-tracking.service';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [locations, setLocations] = useState<LocationUpdate[]>([]);
  const [isTracking, setIsTracking] = useState(autoStart);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const stopPollingRef = useRef<(() => void) | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Démarrer le polling
  const startPolling = () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
    }

    const cleanup = missionTrackingService.startLocationPolling(
      missionId,
      (newLocations) => {
        setLocations((prev) => [...newLocations, ...prev]);
        setLastUpdate(new Date());

        // Centrer la carte sur la dernière position
        if (newLocations.length > 0 && mapRef.current) {
          const lastLocation = newLocations[0];
          mapRef.current.panTo({
            lat: lastLocation.latitude,
            lng: lastLocation.longitude,
          });
        }
      },
      updateInterval
    );

    stopPollingRef.current = cleanup;
  };

  // Charger les locations initiales
  useEffect(() => {
    const fetchInitialLocations = async () => {
      setLoading(true);
      try {
        const response = await missionTrackingService.getLocationUpdates(missionId, 100);
        setLocations(response.locations);
        if (response.locations.length > 0) {
          setLastUpdate(new Date(response.locations[0].timestamp));
        }
      } catch (error) {
        console.error('Error fetching initial locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialLocations();
  }, [missionId]);

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
  }, [isTracking, missionId, updateInterval]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const refreshNow = async () => {
    setLoading(true);
    try {
      const response = await missionTrackingService.getLocationUpdates(missionId, 10);
      if (response.locations.length > 0) {
        setLocations((prev) => [...response.locations, ...prev]);
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

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suivi GPS en Temps Réel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
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

            {/* Polyline (chemin parcouru) */}
            {locations.length > 1 && (
              <Polyline
                path={getPath()}
                options={{
                  strokeColor: '#4F46E5',
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                }}
              />
            )}
          </GoogleMap>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
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
