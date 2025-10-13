import { useEffect, useRef, useState, useCallback } from 'react';
import GoogleMapsService, { type MarkerData } from '@/services/google-maps.service';
import GeolocationService, { type GeolocationPosition } from '@/services/geolocation.service';
import type { Mission } from '@/types/mission.types';
import { getGoogleMapsApiKey } from '@/config/env';
// Badge supprimé - plus utilisé
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Package, AlertTriangle } from 'lucide-react';
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

// Coordonnées des principales villes du Cameroun
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  douala: { lat: 4.0511, lng: 9.7679 },
  yaounde: { lat: 3.848, lng: 11.5021 },
  bafoussam: { lat: 5.4737, lng: 10.4158 },
  garoua: { lat: 9.3265, lng: 13.3958 },
  bamenda: { lat: 5.9597, lng: 10.1453 },
  maroua: { lat: 10.5906, lng: 14.3159 },
  ngaoundere: { lat: 7.3167, lng: 13.5833 },
  bertoua: { lat: 4.5833, lng: 13.6833 },
  kribi: { lat: 2.9333, lng: 9.9167 },
  edea: { lat: 3.8, lng: 10.1333 },
};

// Fonction pour extraire la ville d'un ID d'adresse
const getCityFromAddressId = (addressId: string): { lat: number; lng: number } => {
  const cityName = addressId.split('-')[1]?.toLowerCase() || 'douala';
  return CITY_COORDINATES[cityName] || CITY_COORDINATES['douala'];
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

  // Pas de filtrage par statut - afficher toutes les missions
  const filteredMissions = missions;

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

      const mapsService = new GoogleMapsService();
      mapsServiceRef.current = mapsService;

      // Initialiser la carte centrée sur le Cameroun
      await mapsService.initializeMap(mapRef.current, {
        center: { lat: 6.0, lng: 12.0 }, // Centre du Cameroun
        zoom: 6,
      });

      // Ajouter les marqueurs pour chaque mission
      filteredMissions.forEach((mission) => {
        // Marqueur de départ
        const departPosition = getCityFromAddressId(mission.adresseDepartId);
        const departMarkerData: MarkerData = {
          id: `${mission.id}-depart`,
          position: departPosition,
          title: `Départ: ${mission.titre}`,
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
        const arriveePosition = getCityFromAddressId(mission.adresseArriveeId);
        const arriveeMarkerData: MarkerData = {
          id: `${mission.id}-arrivee`,
          position: arriveePosition,
          title: `Arrivée: ${mission.titre}`,
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

        // Afficher la route pour toutes les missions si demandé
        if (showRoutes) {
          mapsService.displayRoute(departPosition, arriveePosition, {
            strokeColor: '#2563eb',
            strokeWeight: mission.id === selectedMission?.id ? 4 : 2,
            strokeOpacity: mission.id === selectedMission?.id ? 0.8 : 0.6,
          });
        }

        // Ajouter marqueur transporteur si la mission est assignée et a une position réelle
        if (mission.status === 'assigned' && mission.transporteurId && mission.currentPosition) {
          const transporteurMarkerData: MarkerData = {
            id: `${mission.id}-transporteur`,
            position: mission.currentPosition,
            title: `Transporteur: ${mission.titre}`,
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
      });

      // Ajuster la vue pour inclure toutes les missions
      if (filteredMissions.length > 0) {
        const allPositions = filteredMissions.flatMap((mission) => [
          getCityFromAddressId(mission.adresseDepartId),
          getCityFromAddressId(mission.adresseArriveeId),
        ]);
        mapsService.fitBounds(allPositions);
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
            <p className="text-gray-600">Chargement de la carte des missions...</p>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />

      {/* Informations missions */}
      <div className="absolute top-4 right-4 space-y-2">
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
