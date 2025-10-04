import { getGoogleMapsApiKey } from '@/config/env';

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
  private markers: Map<string, google.maps.Marker> = new Map();
  private directionsService: google.maps.DirectionsService | null = null;
  private directionsRenderer: google.maps.DirectionsRenderer | null = null;
  private isLoaded: boolean = false;

  constructor() {
    this.loadGoogleMapsScript();
  }

  private async loadGoogleMapsScript(): Promise<void> {
    if (this.isLoaded || window.google?.maps) {
      this.isLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${getGoogleMapsApiKey()}&libraries=places,geometry,routes&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });
  }

  async initializeMap(container: HTMLElement, config: MapConfig): Promise<google.maps.Map> {
    try {
      // Ensure Google Maps is loaded
      await this.loadGoogleMapsScript();

      this.map = new google.maps.Map(container, {
        center: config.center,
        zoom: config.zoom,
        mapId: config.mapId,
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

      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });

      if (this.map) {
        this.directionsRenderer.setMap(this.map);
      }

      if (!this.map) {
        throw new Error('Failed to initialize map');
      }
      return this.map;
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      throw error;
    }
  }

  addMarker(markerData: MarkerData): google.maps.Marker | null {
    if (!this.map) return null;

    const marker = new google.maps.Marker({
      position: markerData.position,
      map: this.map,
      title: markerData.title,
      icon: this.getMarkerIcon(markerData.type),
      animation: markerData.type === 'vehicle' ? google.maps.Animation.DROP : undefined,
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

  updateMarkerPosition(markerId: string, position: { lat: number; lng: number }): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.setPosition(position);
    }
  }

  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.setMap(null);
      this.markers.delete(markerId);
    }
  }

  async displayRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: {
      waypoints?: { lat: number; lng: number }[];
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
    }
  ): Promise<google.maps.DirectionsResult | null> {
    if (!this.directionsService || !this.directionsRenderer) return null;

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

      // Update renderer options if provided
      if (options?.strokeColor || options?.strokeWeight || options?.strokeOpacity) {
        this.directionsRenderer.setOptions({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: options?.strokeColor || '#2563eb',
            strokeWeight: options?.strokeWeight || 4,
            strokeOpacity: options?.strokeOpacity || 0.8,
          },
        });
      }

      this.directionsRenderer.setDirections(result);
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

    console.log('fitBounds called with positions:', positions);

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

  private getMarkerIcon(
    type: 'vehicle' | 'destination' | 'waypoint' | 'user' | 'origin'
  ): google.maps.Icon {
    const iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';

    switch (type) {
      case 'vehicle':
        return {
          url: iconBase + 'truck.png',
          scaledSize: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 32),
        };
      case 'destination':
        return {
          url: iconBase + 'flag.png',
          scaledSize: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 32),
        };
      case 'origin':
        return {
          url: 'https://maps.google.com/mapfiles/kml/paddle/go.png',
          scaledSize: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 32),
        };
      case 'waypoint':
        return {
          url: iconBase + 'placemark_circle.png',
          scaledSize: new google.maps.Size(24, 24),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(12, 24),
        };
      case 'user':
        return {
          url: iconBase + 'placemark_circle.png',
          scaledSize: new google.maps.Size(24, 24),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(12, 24),
        };
      default:
        return {
          url: iconBase + 'placemark_circle.png',
          scaledSize: new google.maps.Size(24, 24),
        };
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

  destroy(): void {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers.clear();
    this.map = null;
    this.directionsService = null;
    this.directionsRenderer = null;
  }
}

export default GoogleMapsService;
