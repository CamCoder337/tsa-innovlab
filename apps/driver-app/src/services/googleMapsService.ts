/**
 * Service pour interagir avec Google Maps API
 */

const GOOGLE_MAPS_API_KEY = 'AIzaSyD5g9ETxr6QFGf06HzSp48f6E-5HT5K0zo';

export interface DirectionsResult {
  distance: number; // en mètres
  duration: number; // en secondes
  polyline: string; // Encoded polyline
  steps: Array<{
    distance: number;
    duration: number;
    startLocation: { lat: number; lng: number };
    endLocation: { lat: number; lng: number };
  }>;
}

/**
 * Décoder une polyline encodée en coordonnées
 * @param encoded Polyline encodée
 * @returns Tableau de coordonnées
 */
export const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
  const poly = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
};

/**
 * Obtenir les directions entre deux points via Google Directions API
 * @param origin Point de départ
 * @param destination Point d'arrivée
 * @returns Résultat des directions
 */
export const getDirections = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<DirectionsResult | null> => {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      console.error('Erreur Google Directions API:', data.status, data.error_message);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distance: leg.distance.value, // en mètres
      duration: leg.duration.value, // en secondes
      polyline: route.overview_polyline.points,
      steps: leg.steps.map((step: any) => ({
        distance: step.distance.value,
        duration: step.duration.value,
        startLocation: {
          lat: step.start_location.lat,
          lng: step.start_location.lng,
        },
        endLocation: {
          lat: step.end_location.lat,
          lng: step.end_location.lng,
        },
      })),
    };
  } catch (error) {
    console.error("Erreur lors de l'appel à Google Directions API:", error);
    return null;
  }
};

/**
 * Formater la durée en format lisible
 * @param seconds Durée en secondes
 * @returns Chaîne formatée (ex: "2h 30min")
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

/**
 * Formater la distance en format lisible
 * @param meters Distance en mètres
 * @returns Chaîne formatée (ex: "245.5 km" ou "850 m")
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};
