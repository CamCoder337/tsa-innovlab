import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, Clock, ExternalLink, Route } from 'lucide-react';

interface SimpleMapFallbackProps {
  missionId: string;
  departureLocation?: { lat: number; lng: number };
  arrivalLocation?: { lat: number; lng: number };
  departureAddress?: string;
  arrivalAddress?: string;
}

// Function to calculate distance between two points (Haversine formula)
const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): string => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) *
      Math.cos(point2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(1);
};

export default function SimpleMapFallback({
  departureLocation,
  arrivalLocation,
  departureAddress,
  arrivalAddress,
}: SimpleMapFallbackProps) {
  const openInMaps = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(label)}`;
    window.open(url, '_blank');
  };

  const openDirections = () => {
    if (departureLocation && arrivalLocation) {
      const url = `https://www.google.com/maps/dir/${departureLocation.lat},${departureLocation.lng}/${arrivalLocation.lat},${arrivalLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Itinéraire de la mission
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Debug info */}
        <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
          Debug: Départ coords={departureLocation ? `${departureLocation.lat},${departureLocation.lng}` : 'MANQUANT'}, 
          Arrivée coords={arrivalLocation ? `${arrivalLocation.lat},${arrivalLocation.lng}` : 'MANQUANT'}
        </div>
        
        {/* Departure */}
        {departureLocation && (
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-green-700">Point de départ</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {departureAddress || `${departureLocation.lat}, ${departureLocation.lng}`}
              </p>
              <Button
                onClick={() => openInMaps(departureLocation.lat, departureLocation.lng, 'Départ')}
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Voir sur Google Maps
              </Button>
            </div>
          </div>
        )}

        {/* Route */}
        {departureLocation && arrivalLocation && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={openDirections}
              variant="default"
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              Voir l'itinéraire complet
            </Button>
          </div>
        )}

        {/* Arrival */}
        {arrivalLocation && (
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-700">Point d'arrivée</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {arrivalAddress || `${arrivalLocation.lat}, ${arrivalLocation.lng}`}
              </p>
              <Button
                onClick={() => openInMaps(arrivalLocation.lat, arrivalLocation.lng, 'Arrivée')}
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Voir sur Google Maps
              </Button>
            </div>
          </div>
        )}

        {/* Distance estimation */}
        {departureLocation && arrivalLocation && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Route className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Informations de trajet</span>
            </div>
            <p className="text-sm text-blue-700">
              Distance approximative: {calculateDistance(departureLocation, arrivalLocation)} km
            </p>
            <p className="text-xs text-blue-600 mt-1">
              * Distance à vol d'oiseau - la distance réelle peut varier selon l'itinéraire
            </p>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Suivi GPS en temps réel disponible dans l'application mobile du chauffeur
          </span>
        </div>
      </CardContent>
    </Card>
  );
}