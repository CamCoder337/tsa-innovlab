import { useEffect, useRef, useState, useCallback } from 'react';
import GoogleMapsService, { type MarkerData } from '@/services/google-maps.service';
import GeolocationService, { type GeolocationPosition } from '@/services/geolocation.service';
import { MOCK_VEHICLES, MOCK_DESTINATIONS, DEFAULT_MAP_CONFIG } from '@/data/mock-tracking';
import type { PositionUpdate } from '@/services/tracking.service';

interface TrackingMapProps {
  className?: string;
  onMarkerClick?: (markerId: string, data: Record<string, unknown>) => void;
  showRoute?: boolean;
  vehicleUpdates?: PositionUpdate[];
  showUserLocation?: boolean;
}

export default function TrackingMap({
  className = '',
  onMarkerClick,
  showRoute = true,
  vehicleUpdates = [],
  showUserLocation = true,
}: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapsServiceRef = useRef<GoogleMapsService | null>(null);
  const geolocationServiceRef = useRef<GeolocationService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<GeolocationPosition | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    'granted' | 'denied' | 'prompt' | null
  >(null);

  // Mettre à jour les positions des véhicules
  useEffect(() => {
    if (vehicleUpdates.length > 0 && mapsServiceRef.current) {
      vehicleUpdates.forEach((update) => {
        mapsServiceRef.current?.updateMarkerPosition(update.vehicleId, update.position);
      });
    }
  }, [vehicleUpdates]);

  // Mettre à jour la position de l'utilisateur
  useEffect(() => {
    if (userPosition && mapsServiceRef.current) {
      mapsServiceRef.current.updateMarkerPosition('user-location', {
        lat: userPosition.lat,
        lng: userPosition.lng,
      });
    }
  }, [userPosition]);

  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Vérifier si la clé API est configurée
      if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        throw new Error(
          'Clé API Google Maps non configurée. Ajoutez VITE_GOOGLE_MAPS_API_KEY dans votre fichier .env'
        );
      }

      const mapsService = new GoogleMapsService();
      mapsServiceRef.current = mapsService;

      // Initialiser la carte
      await mapsService.initializeMap(mapRef.current, DEFAULT_MAP_CONFIG);

      // Ajouter les marqueurs des véhicules
      MOCK_VEHICLES.forEach((vehicle) => {
        const markerData: MarkerData = {
          id: vehicle.id,
          position: vehicle.position,
          title: `Véhicule ${vehicle.id}`,
          type: 'vehicle',
          data: {
            speed: vehicle.speed,
            bearing: vehicle.bearing,
            batteryLevel: vehicle.batteryLevel,
            driver: vehicle.driver,
            status: vehicle.status,
            timestamp: new Date().toISOString(),
          },
        };

        const marker = mapsService.addMarker(markerData);
        if (marker && onMarkerClick) {
          marker.addListener('click', () => {
            onMarkerClick(vehicle.id, vehicle);
          });
        }
      });

      // Ajouter les marqueurs des destinations
      MOCK_DESTINATIONS.forEach((destination) => {
        const markerData: MarkerData = {
          id: destination.id,
          position: destination.position,
          title: destination.name,
          type: destination.type === 'delivery_point' ? 'destination' : 'waypoint',
          data: {
            type: destination.type,
            name: destination.name,
          },
        };

        mapsService.addMarker(markerData);
      });

      // Afficher une route exemple si demandé
      if (showRoute && MOCK_VEHICLES.length > 0 && MOCK_DESTINATIONS.length > 0) {
        await mapsService.displayRoute(MOCK_VEHICLES[0].position, MOCK_DESTINATIONS[0].position);
      }

      // Ajuster la vue pour inclure tous les marqueurs
      const allPositions = [
        ...MOCK_VEHICLES.map((v) => v.position),
        ...MOCK_DESTINATIONS.map((d) => d.position),
      ];
      mapsService.fitBounds(allPositions);

      setIsLoading(false);
    } catch (err) {
      console.error("Erreur lors de l'initialisation de la carte:", err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsLoading(false);
    }
  }, [showRoute, onMarkerClick]);

  const initializeUserLocation = useCallback(async () => {
    try {
      // Vérifier les permissions de géolocalisation
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(permission.state);
      }

      const geolocationService = new GeolocationService();
      geolocationServiceRef.current = geolocationService;

      // Obtenir la position actuelle
      const position = await geolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });

      setUserPosition(position);
      setLocationPermission('granted');

      // Ajouter le marqueur de l'utilisateur sur la carte
      if (mapsServiceRef.current) {
        const userMarkerData: MarkerData = {
          id: 'user-location',
          position: { lat: position.lat, lng: position.lng },
          title: 'Votre position',
          type: 'user',
          data: {
            accuracy: position.accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
          },
        };

        mapsServiceRef.current.addMarker(userMarkerData);
      }

      // S'abonner aux mises à jour de position
      geolocationService.subscribe((newPosition) => {
        setUserPosition(newPosition);
      });

      geolocationService.subscribeToErrors((error) => {
        console.warn('Erreur géolocalisation:', error.message);
        setLocationPermission('denied');
      });
    } catch (err) {
      console.warn("Impossible d'obtenir la position de l'utilisateur:", err);
      setLocationPermission('denied');
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      await initializeUserLocation();
    } catch (err) {
      console.error('Erreur lors de la demande de permission:', err);
    }
  };

  // Initialize map and user location
  useEffect(() => {
    const init = async () => {
      await initializeMap();
      if (showUserLocation) {
        await initializeUserLocation();
      }
    };
    init();
    return () => {
      if (mapsServiceRef.current) {
        mapsServiceRef.current.destroy();
      }
      if (geolocationServiceRef.current) {
        geolocationServiceRef.current.destroy();
      }
    };
  }, [showUserLocation, initializeMap, initializeUserLocation]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="text-red-500 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement de la carte
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => void initializeMap()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />

      {/* Contrôles de géolocalisation */}
      {showUserLocation && locationPermission !== 'granted' && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-3">
            <div className="text-orange-500">📍</div>
            <div className="flex-1">
              <p className="text-sm font-medium">Localisation désactivée</p>
              <p className="text-xs text-gray-600">Activez pour voir votre position</p>
            </div>
            <button
              onClick={requestLocationPermission}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Activer
            </button>
          </div>
        </div>
      )}

      {/* Indicateur de position utilisateur */}
      {showUserLocation && userPosition && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-3">
            <div className="text-green-500">📍</div>
            <div className="flex-1">
              <p className="text-sm font-medium">Position détectée</p>
              <p className="text-xs text-gray-600">
                Précision: ±{Math.round(userPosition.accuracy)}m
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <h4 className="font-semibold mb-2">Légende</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Véhicules actifs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Destinations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Points de passage</span>
          </div>
          {showUserLocation && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <span>Votre position</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
