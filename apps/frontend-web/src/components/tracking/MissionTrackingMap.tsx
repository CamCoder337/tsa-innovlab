import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import GoogleMapsService, { type MarkerData } from '@/services/google-maps.service';
import GeolocationService, { type GeolocationPosition } from '@/services/geolocation.service';
import type { Mission } from '@/types/mission.types';
import type { Address } from '@/types/address.types';
import { getGoogleMapsApiKey, getGoogleMapsMapId } from '@/config/env';
// Badge supprimé - plus utilisé
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Package, AlertTriangle, Clock } from 'lucide-react';
import MapLegend from './MapLegend';

interface MissionTrackingMapProps {
  className?: string;
  missions: Mission[];
  selectedMission?: Mission | null;
  onMissionClick?: (mission: Mission) => void;
  showUserLocation?: boolean;
  showRoutes?: boolean;
  showLegend?: boolean;
}

interface RouteInfo {
  distance: number; // in km
  duration: number; // in minutes
  eta: Date;
}

// Helper function to get coordinates from address
const getCoordinatesFromAddress = (address: Address | undefined): { lat: number; lng: number } | null => {
  if (!address || address.latitude === undefined || address.longitude === undefined) {
    return null;
  }
  return {
    lat: Number(address.latitude),
    lng: Number(address.longitude),
  };
};

// Fonction supprimée - plus utilisée

// Fonction supprimée - plus utilisée

export default function MissionTrackingMap({
  className = '',
  missions = [],
  selectedMission,
  onMissionClick,
  showUserLocation = true,
  showRoutes = true,
  showLegend = true,
}: MissionTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapsServiceRef = useRef<GoogleMapsService | null>(null);
  const geolocationServiceRef = useRef<GeolocationService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<GeolocationPosition | null>(null);
  const [routeInfo, setRouteInfo] = useState<Map<string, RouteInfo>>(new Map());

  // Afficher uniquement la mission sélectionnée, sinon toutes les missions
  // Utiliser useMemo pour éviter de recréer le tableau à chaque rendu
  const filteredMissions = useMemo(() => {
    return selectedMission ? [selectedMission] : missions;
  }, [selectedMission, missions]);

  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Vérifier si la clé API est configurée
      if (!getGoogleMapsApiKey()) {
        throw new Error(
          'Clé API Google Maps non configurée. Ajoutez VITE_GOOGLE_MAPS_API_KEY dans votre fichier .env'
        );
      }

      // N'initialiser la carte qu'une seule fois
      if (!mapsServiceRef.current) {
        const mapsService = new GoogleMapsService();
        mapsServiceRef.current = mapsService;

        // Initialiser la carte centrée sur le Cameroun
        await mapsService.initializeMap(mapRef.current, {
          center: { lat: 6.0, lng: 12.0 }, // Centre du Cameroun
          zoom: 6,
          mapId: getGoogleMapsMapId(),
        });
      }

      const mapsService = mapsServiceRef.current;

      // Nettoyer les marqueurs et routes existants
      mapsService.clearMarkers();
      mapsService.clearRoute();

      // Ajouter les marqueurs pour chaque mission
      const newRouteInfo = new Map<string, RouteInfo>();

      for (const mission of filteredMissions) {
        // Get real coordinates from addresses
        const departPosition = getCoordinatesFromAddress(mission.adresseDepart);
        const arriveePosition = getCoordinatesFromAddress(mission.adresseArrivee);

        // Skip mission if coordinates are invalid
        if (!departPosition || !arriveePosition) {
          console.warn(`Mission ${mission.id} has invalid coordinates, skipping`);
          continue;
        }

        // Marqueur de départ
        const departMarkerData: MarkerData = {
          id: `${mission.id}-depart`,
          position: departPosition,
          title: `Départ: ${mission.title}`,
          type: 'origin',
          data: {
            mission,
            type: 'depart',
            status: mission.status,
            typeMarchandise: mission.typeMarchandise,
            poids: mission.poids,
            price: mission.budgetMin,
          },
        };

        const departMarker = mapsService.addMarker(departMarkerData);
        if (departMarker && onMissionClick) {
          departMarker.addListener('click', () => {
            onMissionClick(mission);
          });
        }

        // Marqueur d'arrivée
        const arriveeMarkerData: MarkerData = {
          id: `${mission.id}-arrivee`,
          position: arriveePosition,
          title: `Arrivée: ${mission.title}`,
          type: 'destination',
          data: {
            mission,
            type: 'arrivee',
            status: mission.status,
            typeMarchandise: mission.typeMarchandise,
            poids: mission.poids,
            budgetMax: mission.budgetMax,
          },
        };

        const arriveeMarker = mapsService.addMarker(arriveeMarkerData);
        if (arriveeMarker && onMissionClick) {
          arriveeMarker.addListener('click', () => {
            onMissionClick(mission);
          });
        }

        // Calculate route and ETA
        if (showRoutes) {
          try {
            // Calculate distance and duration using Google Directions API
            const routeData = await mapsService.calculateDistanceWithDirections(
              departPosition,
              arriveePosition
            );

            if (routeData) {
              // Calculate ETA based on current time
              const eta = new Date();
              eta.setMinutes(eta.getMinutes() + routeData.duration);

              newRouteInfo.set(mission.id, {
                distance: routeData.distance,
                duration: routeData.duration,
                eta,
              });
            }

            // Display route on map
            mapsService.displayRoute(departPosition, arriveePosition, {
              strokeColor: '#2563eb',
              strokeWeight: mission.id === selectedMission?.id ? 4 : 2,
              strokeOpacity: mission.id === selectedMission?.id ? 0.8 : 0.6,
            });
          } catch (err) {
            console.error(`Failed to calculate route for mission ${mission.id}:`, err);
          }
        }

        // Ajouter marqueur transporteur si la mission est en cours et a une position réelle
        if (mission.status === 'in_progress' && mission.transporteurId && mission.currentPosition) {
          const transporteurMarkerData: MarkerData = {
            id: `${mission.id}-transporteur`,
            position: mission.currentPosition,
            title: `Transporteur: ${mission.title}`,
            type: 'vehicle',
            data: {
              mission,
              type: 'transporteur',
              status: mission.status,
            },
          };

          const transporteurMarker = mapsService.addMarker(transporteurMarkerData);
          if (transporteurMarker && onMissionClick) {
            transporteurMarker.addListener('click', () => {
              onMissionClick(mission);
            });
          }
        }
      }

      // Update route info state
      setRouteInfo(newRouteInfo);

      // Ajuster la vue pour inclure toutes les missions
      if (filteredMissions.length > 0) {
        const allPositions = filteredMissions
          .flatMap((mission) => [
            getCoordinatesFromAddress(mission.adresseDepart),
            getCoordinatesFromAddress(mission.adresseArrivee),
          ])
          .filter((pos): pos is { lat: number; lng: number } => pos !== null);

        if (allPositions.length > 0) {
          mapsService.fitBounds(allPositions);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Erreur lors de l'initialisation de la carte:", err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsLoading(false);
    }
  }, [filteredMissions, selectedMission, showRoutes, onMissionClick]);

  const initializeUserLocation = useCallback(async () => {
    if (!showUserLocation) return;

    try {
      const geolocationService = new GeolocationService();
      geolocationServiceRef.current = geolocationService;

      const position = await geolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });

      setUserPosition(position);

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
    } catch (err) {
      console.warn("Impossible d'obtenir la position de l'utilisateur:", err);
    }
  }, [showUserLocation]);

  // Fonctions supprimées - plus de filtrage par statut

  useEffect(() => {
    const init = async () => {
      await initializeMap();
      await initializeUserLocation();
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
  }, [initializeMap, initializeUserLocation]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement de la carte
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => void initializeMap()}
            className="px-4 py-2 bg-tsa-blue/90 text-white rounded-lg hover:bg-tsa-blue transition-colors"
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
            <p className="text-gray-600">Chargement de la carte des missions...</p>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />

      {/* Informations missions */}
      <div className="absolute top-4 right-4 space-y-2 max-w-xs">
        <Card className="bg-white/95 backdrop-blur">
          <CardContent className="p-3">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Missions
            </h4>
            <div className="text-sm text-gray-600">
              <p>Total: {missions.length} missions</p>
              <p>Assignées: {missions.filter((m) => m.status === 'assigned').length}</p>
            </div>
          </CardContent>
        </Card>

        {/* ETA Information for selected mission */}
        {selectedMission && routeInfo.has(selectedMission.id) && (
          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-3">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Informations de trajet
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">
                    {routeInfo.get(selectedMission.id)?.distance} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Durée:</span>
                  <span className="font-medium">
                    {Math.floor((routeInfo.get(selectedMission.id)?.duration || 0) / 60)}h{' '}
                    {(routeInfo.get(selectedMission.id)?.duration || 0) % 60}min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ETA:</span>
                  <span className="font-medium text-green-600">
                    {routeInfo.get(selectedMission.id)?.eta.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Indicateur de position utilisateur */}
        {showUserLocation && userPosition && (
          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Position détectée</p>
                  <p className="text-xs text-gray-600">±{Math.round(userPosition.accuracy)}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Légende avec vraies icônes Google Maps */}
      {showLegend && <MapLegend showUserLocation={showUserLocation} />}

      {/* Détails de mission supprimés - affichage uniquement au survol des marqueurs */}
    </div>
  );
}
