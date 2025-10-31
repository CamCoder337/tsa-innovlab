import { googleMapsLoader } from '@/lib/google-maps-loader';

export interface MapConfig {
  center: { lat: number; lng: number };
  zoom: number;
  mapId?: string;
}

export interface MarkerData {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  icon?: string;
  type: 'vehicle' | 'destination' | 'waypoint' | 'user' | 'origin';
  data?: Record<string, unknown>;
}

export class GoogleMapsService {
  private map: google.maps.Map | null = null;
  private markers: Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker> =
    new Map();
  private polylines: Map<string, google.maps.Polyline> = new Map();
  private directionsService: google.maps.DirectionsService | null = null;
  private useAdvancedMarkers: boolean = false;

  async initializeMap(container: HTMLElement, config: MapConfig): Promise<google.maps.Map> {
    try {
      // Ensure Google Maps is loaded
      await googleMapsLoader.load({ libraries: ['places', 'geometry', 'routes', 'marker'] });

      // Check if we have a valid Map ID for Advanced Markers
      this.useAdvancedMarkers = !!(config.mapId && config.mapId.trim());

      this.map = new google.maps.Map(container, {
        center: config.center,
        zoom: config.zoom,
        mapId: this.useAdvancedMarkers ? config.mapId : undefined,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      if (!this.useAdvancedMarkers) {
        console.warn(
          'Google Maps Map ID not configured. Using regular markers instead of Advanced Markers. To enable Advanced Markers, set VITE_GOOGLE_MAPS_MAP_ID in your environment variables.'
        );
      }

      this.directionsService = new google.maps.DirectionsService();

      if (!this.map) {
        throw new Error('Failed to initialize map');
      }
      return this.map;
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      throw error;
    }
  }

  addMarker(
    markerData: MarkerData
  ): google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null {
    if (!this.map) return null;

    if (this.useAdvancedMarkers) {
      // Create marker element with custom icon
      const markerElement = document.createElement('div');
      markerElement.style.width = '32px';
      markerElement.style.height = '32px';
      markerElement.style.backgroundImage = `url(${this.getMarkerIconUrl(markerData.type)})`;
      markerElement.style.backgroundSize = 'contain';
      markerElement.style.backgroundRepeat = 'no-repeat';
      markerElement.style.cursor = 'pointer';

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: markerData.position,
        map: this.map,
        title: markerData.title,
        content: markerElement,
      });

      // Info window pour afficher les détails
      const infoWindow = new google.maps.InfoWindow({
        content: this.createInfoWindowContent(markerData),
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
      });

      this.markers.set(markerData.id, marker);
      return marker;
    } else {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: this.map,
        title: markerData.title,
        icon: this.getMarkerIconUrl(markerData.type),
      });

      // Info window pour afficher les détails
      const infoWindow = new google.maps.InfoWindow({
        content: this.createInfoWindowContent(markerData),
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
      });

      this.markers.set(markerData.id, marker);
      return marker;
    }
  }

  updateMarkerPosition(markerId: string, position: { lat: number; lng: number }): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
        marker.position = position;
      } else {
        marker.setPosition(position);
      }
    }
  }

  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
        marker.map = null;
      } else {
        marker.setMap(null);
      }
      this.markers.delete(markerId);
    }
  }

  clearMarkers(): void {
    this.markers.forEach((marker) => {
      if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
        marker.map = null;
      } else {
        marker.setMap(null);
      }
    });
    this.markers.clear();
  }

  clearRoutes(): void {
    this.polylines.forEach((polyline) => {
      polyline.setMap(null);
    });
    this.polylines.clear();
  }

  async displayRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: {
      routeId?: string;
      waypoints?: { lat: number; lng: number }[];
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
    }
  ): Promise<google.maps.DirectionsResult | null> {
    if (!this.directionsService || !this.map) return null;

    try {
      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        waypoints: options?.waypoints?.map((point) => ({ location: point, stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false,
      };

      const result = await this.directionsService.route(request);

      if (result.routes && result.routes[0]) {
        const route = result.routes[0];
        const routeId = options?.routeId || `route-${Date.now()}`;

        // Get the path from overview_path or decode from overview_polyline
        let path: google.maps.LatLng[] = [];

        if (route.overview_path && route.overview_path.length > 0) {
          path = route.overview_path;
        } else if (route.overview_polyline) {
          // Decode polyline if overview_path is not available
          path = google.maps.geometry.encoding.decodePath(route.overview_polyline);
        }

        if (path.length > 0) {
          // Create polyline from the route
          const polyline = new google.maps.Polyline({
            path: path,
            strokeColor: options?.strokeColor || '#2563eb',
            strokeWeight: options?.strokeWeight || 4,
            strokeOpacity: options?.strokeOpacity || 0.8,
            geodesic: true,
            map: this.map,
          });

          // Store the polyline for later removal
          this.polylines.set(routeId, polyline);
          console.log(`Route ${routeId} displayed with ${path.length} points`);
        } else {
          console.warn(`No path found for route ${routeId}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Error displaying route:', error);
      return null;
    }
  }

  centerOnLocation(position: { lat: number; lng: number }, zoom?: number): void {
    if (this.map) {
      this.map.setCenter(position);
      if (zoom) {
        this.map.setZoom(zoom);
      }
    }
  }

  fitBounds(positions: { lat: number; lng: number }[]): void {
    if (!this.map || positions.length === 0) return;

    // console.log('fitBounds called with positions:', positions);

    const bounds = new google.maps.LatLngBounds();
    positions.forEach((pos, index) => {
      console.log(`Position ${index}:`, pos);
      // Validate position data
      if (
        pos &&
        typeof pos.lat === 'number' &&
        typeof pos.lng === 'number' &&
        !isNaN(pos.lat) &&
        !isNaN(pos.lng)
      ) {
        try {
          bounds.extend({ lat: pos.lat, lng: pos.lng });
        } catch (error) {
          console.error('Error extending bounds with position:', pos, error);
        }
      } else {
        console.warn('Invalid position data:', pos);
      }
    });

    // Only fit bounds if we have valid bounds
    if (!bounds.isEmpty()) {
      try {
        this.map.fitBounds(bounds);
      } catch (error) {
        console.error('Error calling fitBounds:', error);
      }
    } else {
      console.warn('Bounds is empty, not calling fitBounds');
    }
  }

  private getMarkerIconUrl(
    type: 'vehicle' | 'destination' | 'waypoint' | 'user' | 'origin'
  ): string {
    const iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';

    switch (type) {
      case 'vehicle':
        return iconBase + 'truck.png';
      case 'destination':
        return iconBase + 'flag.png';
      case 'origin':
        return 'https://maps.google.com/mapfiles/kml/paddle/go.png';
      case 'waypoint':
      case 'user':
        return iconBase + 'placemark_circle.png';
      default:
        return iconBase + 'placemark_circle.png';
    }
  }

  private createInfoWindowContent(markerData: MarkerData): string {
    const { title, type, data } = markerData;

    let content = `<div class="p-3 min-w-[250px] max-w-[350px]">
      <h3 class="font-semibold text-base mb-2 text-gray-800">${title}</h3>`;

    if (data && data.mission) {
      const mission = data.mission as {
        id: string;
        titre: string;
        description?: string;
        typeMarchandise?: string;
        poids?: number;
        budgetMax?: number;
        status: string;
        dateDepartEstime?: string;
        dateArriveePrevue?: string;
        lastPositionUpdate?: string;
      };

      content += `
        <div class="space-y-2 text-sm">
          <div class="border-b pb-2 mb-2">
            <p class="text-gray-600">${mission.description || 'Aucune description'}</p>
          </div>`;

      if (type === 'origin') {
        content += `
          <p><strong>Type:</strong> Point de départ</p>
          <p><strong>Marchandise:</strong> ${mission.typeMarchandise || 'N/A'}</p>
          <p><strong>Poids:</strong> ${mission.poids || 0} kg</p>
          <p><strong>Départ estimé:</strong> ${mission.dateDepartEstime ? new Date(mission.dateDepartEstime).toLocaleDateString() : 'N/A'}</p>`;
      } else if (type === 'destination') {
        content += `
          <p><strong>Type:</strong> Point d'arrivée</p>
          <p><strong>Budget:</strong> ${mission.budgetMax ? mission.budgetMax.toLocaleString() + ' FCFA' : 'N/A'}</p>
          <p><strong>Arrivée prévue:</strong> ${mission.dateArriveePrevue ? new Date(mission.dateArriveePrevue).toLocaleDateString() : 'N/A'}</p>`;
      } else if (type === 'vehicle') {
        content += `
          <p><strong>Type:</strong> Position transporteur</p>
          <p><strong>Statut:</strong> <span class="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">${mission.status}</span></p>
          <p><strong>Dernière MAJ:</strong> ${mission.lastPositionUpdate ? new Date(mission.lastPositionUpdate).toLocaleTimeString() : 'Temps réel'}</p>`;
      }

      content += `
          <div class="mt-2 pt-2 border-t">
            <p class="text-xs text-gray-500">Mission ID: ${mission.id}</p>
          </div>
        </div>`;
    } else if (type === 'user') {
      content += `
        <div class="space-y-1 text-sm">
          <p><strong>Type:</strong> Votre position actuelle</p>
          ${data?.accuracy ? `<p><strong>Précision:</strong> ±${Math.round(data.accuracy as number)}m</p>` : ''}
          ${data?.timestamp ? `<p><strong>Dernière MAJ:</strong> ${new Date(data.timestamp as string).toLocaleTimeString()}</p>` : ''}
        </div>`;
    }

    content += '</div>';
    return content;
  }

  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<number | null> {
    try {
      // Ensure Google Maps is loaded with geometry library
      await googleMapsLoader.load({ libraries: ['geometry'] });

      // Use spherical geometry to calculate distance
      const originLatLng = new google.maps.LatLng(origin.lat, origin.lng);
      const destinationLatLng = new google.maps.LatLng(destination.lat, destination.lng);

      // Calculate distance in meters, then convert to kilometers
      const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
        originLatLng,
        destinationLatLng
      );

      return Math.round(distanceInMeters / 1000); // Convert to km and round
    } catch (error) {
      console.error('Error calculating distance:', error);
      return null;
    }
  }

  async calculateDistanceWithDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distance: number; duration: number } | null> {
    try {
      // Ensure Google Maps is loaded
      await googleMapsLoader.load({ libraries: ['routes'] });

      if (!this.directionsService) {
        this.directionsService = new google.maps.DirectionsService();
      }

      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false,
      };

      const result = await this.directionsService.route(request);

      if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
        const leg = result.routes[0].legs[0];
        return {
          distance: Math.round((leg.distance?.value || 0) / 1000), // Convert to km
          duration: Math.round((leg.duration?.value || 0) / 60), // Convert to minutes
        };
      }

      return null;
    } catch (error) {
      console.error('Error calculating distance with directions:', error);
      return null;
    }
  }

  destroy(): void {
    this.markers.forEach((marker) => {
      if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
        marker.map = null;
      } else {
        marker.setMap(null);
      }
    });
    this.markers.clear();

    this.polylines.forEach((polyline) => {
      polyline.setMap(null);
    });
    this.polylines.clear();

    this.map = null;
    this.directionsService = null;
  }
}

export default GoogleMapsService;
