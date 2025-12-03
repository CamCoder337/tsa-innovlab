/**
 * Service pour Google Places API (autocomplete)
 */

const GOOGLE_MAPS_API_KEY = 'AIzaSyD5g9ETxr6QFGf06HzSp48f6E-5HT5K0zo';

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  latitude: number;
  longitude: number;
  address: string;
  name: string;
}

/**
 * Obtenir des suggestions d'adresses depuis Google Places Autocomplete
 */
export const getPlacePredictions = async (
  input: string,
  location?: { latitude: number; longitude: number }
): Promise<PlacePrediction[]> => {
  if (!input || input.length < 2) {
    return [];
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${GOOGLE_MAPS_API_KEY}&language=fr&components=country:cm`;

    // Ajouter la position actuelle pour prioriser les résultats proches
    if (location) {
      url += `&location=${location.latitude},${location.longitude}&radius=50000`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      return data.predictions;
    }

    return [];
  } catch (error) {
    console.error("Erreur lors de l'autocomplete:", error);
    return [];
  }
};

/**
 * Obtenir les détails d'un lieu à partir de son place_id
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      const { geometry, formatted_address, name } = data.result;

      return {
        latitude: geometry.location.lat,
        longitude: geometry.location.lng,
        address: formatted_address,
        name: name || formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error);
    return null;
  }
};
