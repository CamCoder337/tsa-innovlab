import MapView, { Marker, Polyline, Region, LatLng, PROVIDER_GOOGLE } from 'react-native-maps';
import { env } from '../config/env';

// Type pour les coordonnées de localisation
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface MarkerData {
  id: string;
  coordinate: LatLng;
  title: string;
  description?: string;
  pinColor?: string;
  type: 'origin' | 'destination' | 'vehicle' | 'user';
}

export interface RouteData {
  id: string;
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * Google Maps Service for React Native
 * Provides a consistent interface for map operations similar to the web version
 */
export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private mapRef: MapView | null = null;
  private markers: Map<string, MarkerData> = new Map();
  private routes: Map<string, RouteData> = new Map();

  private constructor() {}

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }
  
  /**
   * Fetches directions between two points from Google Directions API
   * @returns A promise that resolves with an array of coordinates for the route polyline
   */
  async getDirections(
    origin: LatLng,
    destination: LatLng
  ): Promise<LatLng[]> {
    const apiKey = env.googleMapsApiKey();
    if (!apiKey) {
      throw new Error("Google Maps API key is not configured.");
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const json = await response.json();

      if (json.routes.length > 0) {
        const points = json.routes[0].overview_polyline.points;
        return this.decodePolyline(points);
      }
      return [];
    } catch (error) {
      console.error("Error fetching directions:", error);
      throw new Error("Failed to fetch directions.");
    }
  }

  /**
   * Decodes a polyline string into an array of LatLng coordinates.
   */
  private decodePolyline(t: string): LatLng[] {
    let points: LatLng[] = [];
    for (let step = 0, index = 0, lat = 0, lng = 0; index < t.length; ) {
        let b, shift = 0, result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

  /**
   * Set the map reference
   */
  setMapRef(ref: MapView | null): void {
    this.mapRef = ref;
  }

  /**
   * Get the map reference
   */
  getMapRef(): MapView | null {
    return this.mapRef;
  }

  /**
   * Add a marker to the map
   */
  addMarker(markerData: MarkerData): void {
    this.markers.set(markerData.id, markerData);
  }

  /**
   * Remove a marker from the map
   */
  removeMarker(markerId: string): void {
    this.markers.delete(markerId);
  }

  /**
   * Get all markers
   */
  getMarkers(): MarkerData[] {
    return Array.from(this.markers.values());
  }

  /**
   * Clear all markers
   */
  clearMarkers(): void {
    this.markers.clear();
  }

  /**
   * Add a route (polyline) to the map
   */
  addRoute(routeData: RouteData): void {
    this.routes.set(routeData.id, routeData);
  }

  /**
   * Remove a route from the map
   */
  removeRoute(routeId: string): void {
    this.routes.delete(routeId);
  }

  /**
   * Get all routes
   */
  getRoutes(): RouteData[] {
    return Array.from(this.routes.values());
  }

  /**
   * Clear all routes
   */
  clearRoutes(): void {
    this.routes.clear();
  }

  /**
   * Animate camera to a specific region
   */
  animateToRegion(region: Region, duration?: number): void {
    if (this.mapRef) {
      this.mapRef.animateToRegion(region, duration);
    }
  }

  /**
   * Animate camera to a specific coordinate
   */
  animateToCoordinate(coordinate: LatLng, zoom?: number): void {
    if (this.mapRef) {
      const region: Region = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: zoom ? 1 / Math.pow(2, zoom - 8) : 0.01,
        longitudeDelta: zoom ? 1 / Math.pow(2, zoom - 8) : 0.01,
      };
      this.mapRef.animateToRegion(region, 1000);
    }
  }

  /**
   * Fit map to show all coordinates
   */
  fitToCoordinates(coordinates: LatLng[], animated: boolean = true): void {
    if (this.mapRef && coordinates.length > 0) {
      this.mapRef.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated,
      });
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  calculateDistance(
    point1: LocationCoordinates,
    point2: LocationCoordinates
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (point1.latitude * Math.PI) / 180;
    const phi2 = (point2.latitude * Math.PI) / 180;
    const deltaPhi = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const deltaLambda = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get marker color based on type
   */
  getMarkerColor(type: MarkerData['type']): string {
    switch (type) {
      case 'origin':
        return 'green';
      case 'destination':
        return 'red';
      case 'vehicle':
        return 'blue';
      case 'user':
        return 'purple';
      default:
        return 'red';
    }
  }

  /**
   * Clear all map data (markers and routes)
   */
  clearAll(): void {
    this.clearMarkers();
    this.clearRoutes();
  }

  /**
   * Destroy the service instance
   */
  destroy(): void {
    this.clearAll();
    this.mapRef = null;
  }

  /**
   * Validate Google Maps API key
   */
  static validateApiKey(): boolean {
    const apiKey = env.googleMapsApiKey();
    return !!apiKey && apiKey.length > 0;
  }
}

// Types pour les directions
export interface DirectionsResult {
  distance: number; // en mètres
  duration: number; // en secondes
  polyline: string; // polyline encodée
  bounds?: {
    northeast: LatLng;
    southwest: LatLng;
  };
}

/**
 * Obtenir les directions entre deux points (Google Maps Directions API)
 */
export async function getDirections(
  origin: LatLng,
  destination: LatLng
): Promise<DirectionsResult | null> {
  try {
    const apiKey = env.googleMapsApiKey();
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        polyline: route.overview_polyline.points,
        bounds: route.bounds,
      };
    }

    console.error('No routes found:', data.status);
    return null;
  } catch (error) {
    console.error('Error fetching directions:', error);
    return null;
  }
}

/**
 * Décoder une polyline encodée en coordonnées
 */
export function decodePolyline(encoded: string): LatLng[] {
  const coordinates: LatLng[] = [];
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

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

/**
 * Formater une durée en secondes en format lisible (ex: "15 min", "1h 30min")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

export const googleMapsService = GoogleMapsService.getInstance();
export default googleMapsService;
