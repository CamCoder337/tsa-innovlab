import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import GoogleMapsService, { type MarkerData } from '@/services/google-maps.service';
import GeolocationService, { type GeolocationPosition } from '@/services/geolocation.service';
import type { Mission } from '@/types/mission.types';
import type { Address } from '@/types/address.types';
import { getGoogleMapsApiKey, getGoogleMapsMapId } from '@/config/env';
import { useTrackingTranslation } from '@/hooks/useTranslation';
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
const getCoordinatesFromAddress = (
  address: Address | undefined
): { lat: number; lng: number } | null => {
  if (!address || address.latitude === undefined || address.longitude === undefined) {
    return null;
  }
  return {
    lat: Number(address.latitude),
    lng: Number(address.longitude),
  };
};

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
  const missionMarkerIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedGeolocationRef = useRef(false);
  const hasAddedUserMarkerRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<GeolocationPosition | null>(null);
  const [routeInfo, setRouteInfo] = useState<Map<string, RouteInfo>>(new Map());

  // Translation hook
  const { t: tTracking } = useTrackingTranslation();

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
        throw new Error(tTracking('map.apiKeyNotConfigured'));
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

      // Nettoyer seulement les marqueurs de missions (pas le marqueur utilisateur)
      missionMarkerIdsRef.current.forEach((markerId) => {
        mapsService.removeMarker(markerId);
      });
      missionMarkerIdsRef.current.clear();

      // Nettoyer les routes existantes
      mapsService.clearRoutes();

      // Tableau pour stocker les promesses de calcul de routes
      const routeCalculations: Promise<void>[] = [];

      // Ajouter les marqueurs pour chaque mission
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
          title: tTracking('map.departure', { title: mission.title }),
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
        missionMarkerIdsRef.current.add(departMarkerData.id);
        if (departMarker && onMissionClick) {
          departMarker.addListener('click', () => {
            onMissionClick(mission);
          });
        }

        // Marqueur d'arrivée
        const arriveeMarkerData: MarkerData = {
          id: `${mission.id}-arrivee`,
          position: arriveePosition,
          title: tTracking('map.arrival', { title: mission.title }),
          type: 'destination',
          data: {
            mission,
            type: 'arrivee',
            status: mission.status,
            typeMarchandise: mission.typeMarchandise,
            poids: mission.poids,
            budgetMin: mission.budgetMin,
          },
        };

        const arriveeMarker = mapsService.addMarker(arriveeMarkerData);
        missionMarkerIdsRef.current.add(arriveeMarkerData.id);
        if (arriveeMarker && onMissionClick) {
          arriveeMarker.addListener('click', () => {
            onMissionClick(mission);
          });
        }

        // Calculate route and ETA
        if (showRoutes) {
          // Créer une promesse avec délai pour éviter rate limiting
          const routePromise = (async () => {
            try {
              // Ajouter un délai basé sur l'index pour échelonner les requêtes
              const delayMs = routeCalculations.length * 300; // 300ms entre chaque requête
              if (delayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
              }

              const result = await mapsService.displayRoute(departPosition, arriveePosition, {
                routeId: `route-${mission.id}`,
                strokeColor: '#2563eb',
                strokeWeight: mission.id === selectedMission?.id ? 4 : 2,
                strokeOpacity: mission.id === selectedMission?.id ? 0.8 : 0.6,
              });

              if (
                result &&
                result.routes &&
                result.routes[0] &&
                result.routes[0].legs &&
                result.routes[0].legs[0]
              ) {
                const leg = result.routes[0].legs[0];
                const distance = Math.round((leg.distance?.value || 0) / 1000); // km
                const duration = Math.round((leg.duration?.value || 0) / 60); // minutes

                // Calculate ETA based on current time
                const eta = new Date();
                eta.setMinutes(eta.getMinutes() + duration);

                // Update route info using functional form to avoid race conditions
                setRouteInfo((prev) => {
                  const updated = new Map(prev);
                  updated.set(mission.id, {
                    distance,
                    duration,
                    eta,
                  });
                  return updated;
                });
              }
            } catch (err) {
              console.error(`Failed to calculate route for mission ${mission.id}:`, err);
            }
          })();

          routeCalculations.push(routePromise);
        }

        // Ajouter marqueur transporteur si la mission est en cours et a une position réelle
        if (mission.status === 'in_progress' && mission.transporteurId && mission.currentPosition) {
          const transporteurMarkerData: MarkerData = {
            id: `${mission.id}-transporteur`,
            position: mission.currentPosition,
            title: tTracking('map.transporter', { title: mission.title }),
            type: 'vehicle',
            data: {
              mission,
              type: 'transporteur',
              status: mission.status,
            },
          };

          const transporteurMarker = mapsService.addMarker(transporteurMarkerData);
          missionMarkerIdsRef.current.add(transporteurMarkerData.id);
          if (transporteurMarker && onMissionClick) {
            transporteurMarker.addListener('click', () => {
              onMissionClick(mission);
            });
          }
        }
      }

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

      // Ajouter le marqueur utilisateur s'il existe déjà (géolocalisation terminée avant la carte)
      if (userPosition && !hasAddedUserMarkerRef.current) {
        const userMarkerData: MarkerData = {
          id: 'user-location',
          position: { lat: userPosition.lat, lng: userPosition.lng },
          title: tTracking('map.yourPosition'),
          type: 'user',
          data: {
            accuracy: userPosition.accuracy,
            timestamp: new Date(userPosition.timestamp).toISOString(),
          },
        };
        mapsService.addMarker(userMarkerData);
        hasAddedUserMarkerRef.current = true;
      }

      setIsLoading(false);
    } catch (err) {
      console.error(tTracking('map.mapInitializationError'), err);
      setError(err instanceof Error ? err.message : tTracking('map.unknownError'));
      setIsLoading(false);
    }
  }, [filteredMissions, userPosition, tTracking, onMissionClick, showRoutes, selectedMission?.id]);

  const initializeUserLocation = useCallback(async () => {
    if (!showUserLocation) return;

    // Ne pas réinitialiser si déjà fait
    if (hasInitializedGeolocationRef.current) return;

    try {
      const geolocationService = new GeolocationService();
      geolocationServiceRef.current = geolocationService;

      const position = await geolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000, // Augmenté à 30 secondes pour laisser le temps au GPS
        maximumAge: 5000, // Accepter une position de moins de 5 secondes
      });

      setUserPosition(position);
      hasInitializedGeolocationRef.current = true;

      if (mapsServiceRef.current) {
        const userMarkerData: MarkerData = {
          id: 'user-location',
          position: { lat: position.lat, lng: position.lng },
          title: tTracking('map.yourPosition'),
          type: 'user',
          data: {
            accuracy: position.accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
          },
        };

        mapsServiceRef.current.addMarker(userMarkerData);
        hasAddedUserMarkerRef.current = true;
      }
    } catch (err) {
      console.warn(tTracking('map.positionUnavailable'), err);
      hasInitializedGeolocationRef.current = true; // Marquer comme tenté même en cas d'échec
    }
  }, [showUserLocation, tTracking]);

  // Fonctions supprimées - plus de filtrage par statut

  // Effect 1: Initialiser la géolocalisation une seule fois au montage
  useEffect(() => {
    void initializeUserLocation();

    // Cleanup uniquement au démontage du composant
    return () => {
      if (mapsServiceRef.current) {
        mapsServiceRef.current.destroy();
        mapsServiceRef.current = null;
      }
      if (geolocationServiceRef.current) {
        geolocationServiceRef.current.destroy();
        geolocationServiceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendances vides = exécution unique au montage

  // Effect 2: Initialiser/mettre à jour la carte quand les missions ou la sélection changent
  useEffect(() => {
    void initializeMap();
  }, [initializeMap]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-4 sm:p-8">
          <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto text-red-500 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {tTracking('map.errorLoadingMap')}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{error}</p>
          <button
            onClick={() => void initializeMap()}
            className="px-3 sm:px-4 py-2 bg-tsa-blue/90 text-white rounded-lg hover:bg-tsa-blue transition-colors text-sm sm:text-base"
          >
            {tTracking('map.retry')}
          </button>
        </div>
      </div>
    );
  }

  // Si aucune mission, afficher un message au lieu de la carte
  if (missions.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center p-4 sm:p-8">
          <Package className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {tTracking('map.noMissionsToDisplay')}
          </h3>
          <p className="text-sm sm:text-base text-gray-600">{tTracking('map.noMissionsMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">{tTracking('map.loadingMap')}</p>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />

      {/* Informations missions */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 space-y-2 max-w-xs">
        <Card className="bg-white/95 backdrop-blur">
          <CardContent className="p-2 sm:p-3">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
              <Package className="w-3 h-3 sm:w-4 sm:h-4" />
              {tTracking('map.missions')}
            </h4>
            <div className="text-xs sm:text-sm text-gray-600">
              <p>{tTracking('map.totalMissions', { count: missions.length })}</p>
              <p>
                {tTracking('map.assignedMissions', {
                  count: missions.filter((m) => m.status === 'assigned').length,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ETA Information for selected mission */}
        {selectedMission && routeInfo.has(selectedMission.id) && (
          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-2 sm:p-3">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                <span>{tTracking('map.routeInformation')}</span>
              </h4>
              <div className="text-xs sm:text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">{tTracking('map.distance')}</span>
                  <span className="font-medium">
                    {routeInfo.get(selectedMission.id)?.distance} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{tTracking('map.duration')}</span>
                  <span className="font-medium">
                    {Math.floor((routeInfo.get(selectedMission.id)?.duration || 0) / 60)}h{' '}
                    {(routeInfo.get(selectedMission.id)?.duration || 0) % 60}min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{tTracking('map.eta')}</span>
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
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                <div>
                  <p className="text-xs sm:text-sm font-medium">
                    {tTracking('map.detectedPosition')}
                  </p>
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
