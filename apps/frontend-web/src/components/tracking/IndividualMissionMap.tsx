import { useEffect, useRef, useState, useCallback } from 'react';
import GoogleMapsService, { type MarkerData } from '@/services/google-maps.service';
import GeolocationService, { type GeolocationPosition } from '@/services/geolocation.service';
import type { Mission } from '@/types/mission.types';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Package, AlertTriangle, Navigation2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MapLegend from './MapLegend';

interface IndividualMissionMapProps {
  className?: string;
  mission: Mission;
  showUserLocation?: boolean;
  showRoutes?: boolean;
  showLegend?: boolean;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

// Fonction pour obtenir les coordonnées d'une ville à partir de l'ID d'adresse
const getCityFromAddressId = (addressId: string): { lat: number; lng: number } => {
  const addressMap: Record<string, { lat: number; lng: number }> = {
    'addr-douala-port': { lat: 4.0511, lng: 9.7679 },
    'addr-yaounde-centre': { lat: 3.848, lng: 11.5021 },
    'addr-yaounde-textile': { lat: 3.869, lng: 11.5194 },
    'addr-bafoussam-centre': { lat: 5.4781, lng: 10.4172 },
    'addr-garoua-hopital': { lat: 9.3265, lng: 13.3958 },
    'addr-ngaoundere-gare': { lat: 7.3167, lng: 13.5833 },
    'addr-bamenda-commercial': { lat: 5.9631, lng: 10.1591 },
    'addr-bertoua-marche': { lat: 4.5767, lng: 13.6848 },
    'addr-maroua-centre': { lat: 10.5913, lng: 14.3153 },
    'addr-ebolowa-carrefour': { lat: 2.9154, lng: 11.1543 },
  };
  return addressMap[addressId] || { lat: 3.848, lng: 11.5021 };
};

export default function IndividualMissionMap({
  className = '',
  mission,
  showUserLocation = false,
  showRoutes = true,
  showLegend = true,
  isFullscreen = false,
  onFullscreenToggle,
}: IndividualMissionMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsService, setMapsService] = useState<GoogleMapsService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<GeolocationPosition | null>(null);
  const [isTrackingUser, setIsTrackingUser] = useState(false);

  // Initialisation de la carte
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        const service = new GoogleMapsService();
        await service.initializeMap(mapRef.current, {
          center: getCityFromAddressId(mission.adresseDepartId),
          zoom: 10,
        });
        setMapsService(service);
        setError(null);
      } catch (err) {
        console.error("Erreur lors de l'initialisation de la carte:", err);
        setError('Impossible de charger la carte. Vérifiez votre connexion internet.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapsService) {
        mapsService.destroy();
      }
    };
  }, [mission.id, mission.adresseDepartId, mapsService]);

  // Ajout des marqueurs et itinéraires pour la mission
  useEffect(() => {
    if (!mapsService || !mission) return;

    const addMissionMarkers = () => {
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

      mapsService.addMarker(departMarkerData);

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

      mapsService.addMarker(arriveeMarkerData);

      // Marqueur du transporteur (seulement si position réelle disponible)
      if (mission.currentPosition && mission.transporteurId) {
        const transporteurMarkerData: MarkerData = {
          id: `${mission.id}-transporteur`,
          position: mission.currentPosition,
          title: `Transporteur: ${mission.titre}`,
          type: 'vehicle',
          data: {
            mission,
            type: 'transporteur',
            status: mission.status,
            lastUpdate: mission.lastPositionUpdate,
          },
        };

        mapsService.addMarker(transporteurMarkerData);
      }

      // Affichage de l'itinéraire si demandé
      if (showRoutes) {
        const waypoints = mission.currentPosition ? [mission.currentPosition] : undefined;
        mapsService.displayRoute(departPosition, arriveePosition, {
          waypoints,
          strokeColor: '#2563eb',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        });
      }

      // Centrer la carte sur la mission
      const positions = [departPosition, arriveePosition];
      if (mission.currentPosition) {
        positions.push(mission.currentPosition);
      }
      mapsService.fitBounds(positions);
    };

    addMissionMarkers();
  }, [mapsService, mission, showRoutes]);

  // Gestion de la géolocalisation
  const handleLocationToggle = useCallback(async () => {
    if (!showUserLocation) return;

    if (isTrackingUser) {
      setIsTrackingUser(false);
      setUserPosition(null);
      return;
    }

    try {
      setIsTrackingUser(true);
      const geoService = new GeolocationService();
      const position = await geoService.getCurrentPosition();
      setUserPosition(position);

      if (mapsService && position) {
        const userMarkerData: MarkerData = {
          id: 'user-position',
          position: { lat: position.lat, lng: position.lng },
          title: 'Votre position',
          type: 'user',
          data: {
            accuracy: position.accuracy,
            timestamp: new Date().toISOString(),
          },
        };

        mapsService.addMarker(userMarkerData);
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      setIsTrackingUser(false);
    }
  }, [showUserLocation, isTrackingUser, mapsService]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
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
            <p className="text-gray-600">Chargement de la carte de suivi...</p>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />

      {/* Contrôles de la carte */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Bouton plein écran */}
        {onFullscreenToggle && (
          <Button
            size="sm"
            variant="outline"
            className="bg-white/95 backdrop-blur shadow-lg"
            onClick={onFullscreenToggle}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        )}

        {/* Bouton géolocalisation */}
        {showUserLocation && (
          <Button
            size="sm"
            variant="outline"
            className={`bg-white/95 backdrop-blur shadow-lg ${
              isTrackingUser ? 'bg-blue-100 text-blue-700' : ''
            }`}
            onClick={handleLocationToggle}
          >
            <Navigation2 className="w-4 h-4" />
          </Button>
        )}

        {/* Informations de la mission */}
        <Card className="bg-white/95 backdrop-blur shadow-lg">
          <CardContent className="p-3">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              {mission.titre}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Statut:</strong> {mission.status}
              </p>
              <p>
                <strong>Marchandise:</strong> {mission.typeMarchandise}
              </p>
              <p>
                <strong>Poids:</strong> {mission.poids} kg
              </p>
              {mission.transporteurId && (
                <p>
                  <strong>Transporteur:</strong> Assigné
                </p>
              )}
              {mission.currentPosition && mission.lastPositionUpdate && (
                <p>
                  <strong>Dernière MAJ:</strong>{' '}
                  {new Date(mission.lastPositionUpdate).toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Indicateur de position utilisateur */}
        {showUserLocation && userPosition && (
          <Card className="bg-white/95 backdrop-blur shadow-lg">
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
    </div>
  );
}
