import { googleMapsLoader } from '@/lib/google-maps-loader';
import { mapsCacheService } from './maps-cache.service';
import { distanceMatrixService } from './distance-matrix.service';

export interface MapConfig {
  center: { lat: number; lng: number };
  zoom: number;
  mapId?: string;
  enableTrafficLayer?: boolean;
  enableBicycleLayer?: boolean;
  enableTransitLayer?: boolean;
  disableDefaultUI?: boolean;
  gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto';
  tilt?: number; // For 3D view (45 degrees)
  heading?: number; // Map rotation
}

export interface MarkerData {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  icon?: string;
  type: 'vehicle' | 'destination' | 'waypoint' | 'user' | 'origin';
  data?: Record<string, unknown>;
  animation?: 'DROP' | 'BOUNCE';
}

export interface HeatmapPoint {
  location: { lat: number; lng: number };
  weight?: number; // Intensity (0-100)
}

export interface RouteAlternative {
  routeIndex: number;
  distance: number;
  duration: number;
  durationInTraffic?: number;
  summary: string;
  polyline: google.maps.Polyline;
}

export class GoogleMapsService {
  private map: google.maps.Map | null = null;
  private markers: Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker> =
    new Map();
  private polylines: Map<string, google.maps.Polyline> = new Map();
  private directionsService: google.maps.DirectionsService | null = null;
  private elevationService: google.maps.ElevationService | null = null;
  private useAdvancedMarkers: boolean = false;

  // Layers
  private trafficLayer: google.maps.TrafficLayer | null = null;
  private bicycleLayer: google.maps.BicyclingLayer | null = null;
  private transitLayer: google.maps.TransitLayer | null = null;
  private heatmapLayer: google.maps.visualization.HeatmapLayer | null = null;

  // Marker clustering (type will be added when @googlemaps/markerclusterer is installed)
  private markerClusterer: unknown = null;

  // Polygons and shapes
  private polygons: Map<string, google.maps.Polygon> = new Map();
  private circles: Map<string, google.maps.Circle> = new Map();

  async initializeMap(container: HTMLElement, config: MapConfig): Promise<google.maps.Map> {
    try {
      // Ensure Google Maps is loaded with all necessary libraries
      await googleMapsLoader.load({
        libraries: ['places', 'geometry', 'routes', 'marker', 'visualization', 'elevation'],
      });

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
        // Désactiver les contrôles de type de carte (satellite, relief, etc.)
        mapTypeControl: false,
        // Désactiver Street View (ne fonctionne pas correctement)
        streetViewControl: false,
        // Garder les contrôles essentiels
        fullscreenControl: true,
        zoomControl: true,
        scaleControl: true, // Ajouter échelle pour référence
        rotateControl: false, // Désactiver rotation
        gestureHandling: config.gestureHandling || 'auto',
        tilt: config.tilt,
        heading: config.heading,
        // Force map type to roadmap (désactiver satellite/terrain)
        mapTypeId: 'roadmap',
      });

      if (!this.useAdvancedMarkers) {
        console.warn(
          'Google Maps Map ID not configured. Using regular markers instead of Advanced Markers. To enable Advanced Markers, set VITE_GOOGLE_MAPS_MAP_ID in your environment variables.'
        );
      }

      // Initialize services
      this.directionsService = new google.maps.DirectionsService();
      this.elevationService = new google.maps.ElevationService();

      // Enable layers if requested
      if (config.enableTrafficLayer) {
        this.enableTrafficLayer();
      }
      if (config.enableBicycleLayer) {
        this.enableBicycleLayer();
      }
      if (config.enableTransitLayer) {
        this.enableTransitLayer();
      }

      if (!this.map) {
        throw new Error('Failed to initialize map');
      }

      console.log('✅ Google Maps initialized with enhanced features');
      return this.map;
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      throw error;
    }
  }

  // ==================== LAYER MANAGEMENT ====================

  /**
   * Enable real-time traffic layer
   */
  enableTrafficLayer(): void {
    if (!this.map) return;
    if (!this.trafficLayer) {
      this.trafficLayer = new google.maps.TrafficLayer();
    }
    this.trafficLayer.setMap(this.map);
    console.log('✅ Traffic layer enabled');
  }

  /**
   * Disable traffic layer
   */
  disableTrafficLayer(): void {
    if (this.trafficLayer) {
      this.trafficLayer.setMap(null);
    }
  }

  /**
   * Toggle traffic layer
   */
  toggleTrafficLayer(): boolean {
    if (this.trafficLayer && this.trafficLayer.getMap()) {
      this.disableTrafficLayer();
      return false;
    } else {
      this.enableTrafficLayer();
      return true;
    }
  }

  /**
   * Enable bicycle layer
   */
  enableBicycleLayer(): void {
    if (!this.map) return;
    if (!this.bicycleLayer) {
      this.bicycleLayer = new google.maps.BicyclingLayer();
    }
    this.bicycleLayer.setMap(this.map);
  }

  /**
   * Disable bicycle layer
   */
  disableBicycleLayer(): void {
    if (this.bicycleLayer) {
      this.bicycleLayer.setMap(null);
    }
  }

  /**
   * Enable transit layer
   */
  enableTransitLayer(): void {
    if (!this.map) return;
    if (!this.transitLayer) {
      this.transitLayer = new google.maps.TransitLayer();
    }
    this.transitLayer.setMap(this.map);
  }

  /**
   * Disable transit layer
   */
  disableTransitLayer(): void {
    if (this.transitLayer) {
      this.transitLayer.setMap(null);
    }
  }

  // ==================== HEATMAP ====================

  /**
   * Create heatmap from points
   */
  createHeatmap(points: HeatmapPoint[], options?: {
    radius?: number;
    opacity?: number;
    gradient?: string[];
  }): void {
    if (!this.map) return;

    // Clear existing heatmap
    if (this.heatmapLayer) {
      this.heatmapLayer.setMap(null);
    }

    const heatmapData = points.map((point) => ({
      location: new google.maps.LatLng(point.location.lat, point.location.lng),
      weight: point.weight || 1,
    }));

    this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: this.map,
      radius: options?.radius || 20,
      opacity: options?.opacity || 0.6,
      gradient: options?.gradient,
    });

    console.log(`✅ Heatmap created with ${points.length} points`);
  }

  /**
   * Update heatmap data
   */
  updateHeatmap(points: HeatmapPoint[]): void {
    if (!this.heatmapLayer) return;

    const heatmapData = points.map((point) => ({
      location: new google.maps.LatLng(point.location.lat, point.location.lng),
      weight: point.weight || 1,
    }));

    this.heatmapLayer.setData(heatmapData);
  }

  /**
   * Clear heatmap
   */
  clearHeatmap(): void {
    if (this.heatmapLayer) {
      this.heatmapLayer.setMap(null);
      this.heatmapLayer = null;
    }
  }

  // ==================== ELEVATION ====================

  /**
   * Get elevation for a single point
   */
  async getElevation(lat: number, lng: number): Promise<number | null> {
    if (!this.elevationService) return null;

    try {
      const results = await new Promise<google.maps.ElevationResult[]>((resolve, reject) => {
        this.elevationService!.getElevationForLocations(
          {
            locations: [new google.maps.LatLng(lat, lng)],
          },
          (results, status) => {
            if (status === google.maps.ElevationStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Elevation request failed: ${status}`));
            }
          }
        );
      });

      return results[0]?.elevation || null;
    } catch (error) {
      console.error('Error getting elevation:', error);
      return null;
    }
  }

  /**
   * Get elevation profile along a path
   */
  async getElevationAlongPath(
    path: { lat: number; lng: number }[],
    samples: number = 256
  ): Promise<Array<{ lat: number; lng: number; elevation: number; distance: number }> | null> {
    if (!this.elevationService) return null;

    try {
      const pathLatLngs = path.map((p) => new google.maps.LatLng(p.lat, p.lng));

      const results = await new Promise<google.maps.ElevationResult[]>((resolve, reject) => {
        this.elevationService!.getElevationAlongPath(
          {
            path: pathLatLngs,
            samples,
          },
          (results, status) => {
            if (status === google.maps.ElevationStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Elevation path request failed: ${status}`));
            }
          }
        );
      });

      // Calculate cumulative distance along path
      let cumulativeDistance = 0;
      const profile = results.map((result, index) => {
        if (index > 0 && result.location && results[index - 1].location) {
          const prev = results[index - 1];
          cumulativeDistance += google.maps.geometry.spherical.computeDistanceBetween(
            prev.location!,
            result.location!
          );
        }

        return {
          lat: result.location ? result.location.lat() : 0,
          lng: result.location ? result.location.lng() : 0,
          elevation: result.elevation,
          distance: Math.round(cumulativeDistance / 1000), // km
        };
      });

      return profile;
    } catch (error) {
      console.error('Error getting elevation profile:', error);
      return null;
    }
  }

  // ==================== SHAPES (Polygons, Circles) ====================

  /**
   * Draw polygon on map
   */
  addPolygon(
    id: string,
    paths: { lat: number; lng: number }[],
    options?: {
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      fillColor?: string;
      fillOpacity?: number;
      editable?: boolean;
      draggable?: boolean;
    }
  ): google.maps.Polygon | null {
    if (!this.map) return null;

    const polygon = new google.maps.Polygon({
      paths,
      strokeColor: options?.strokeColor || '#FF0000',
      strokeOpacity: options?.strokeOpacity || 0.8,
      strokeWeight: options?.strokeWeight || 2,
      fillColor: options?.fillColor || '#FF0000',
      fillOpacity: options?.fillOpacity || 0.35,
      editable: options?.editable || false,
      draggable: options?.draggable || false,
      map: this.map,
    });

    this.polygons.set(id, polygon);
    return polygon;
  }

  /**
   * Remove polygon
   */
  removePolygon(id: string): void {
    const polygon = this.polygons.get(id);
    if (polygon) {
      polygon.setMap(null);
      this.polygons.delete(id);
    }
  }

  /**
   * Draw circle on map
   */
  addCircle(
    id: string,
    center: { lat: number; lng: number },
    radius: number, // in meters
    options?: {
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      fillColor?: string;
      fillOpacity?: number;
      editable?: boolean;
      draggable?: boolean;
    }
  ): google.maps.Circle | null {
    if (!this.map) return null;

    const circle = new google.maps.Circle({
      center,
      radius,
      strokeColor: options?.strokeColor || '#2196F3',
      strokeOpacity: options?.strokeOpacity || 0.8,
      strokeWeight: options?.strokeWeight || 2,
      fillColor: options?.fillColor || '#2196F3',
      fillOpacity: options?.fillOpacity || 0.35,
      editable: options?.editable || false,
      draggable: options?.draggable || false,
      map: this.map,
    });

    this.circles.set(id, circle);
    return circle;
  }

  /**
   * Remove circle
   */
  removeCircle(id: string): void {
    const circle = this.circles.get(id);
    if (circle) {
      circle.setMap(null);
      this.circles.delete(id);
    }
  }

  /**
   * Clear all shapes
   */
  clearShapes(): void {
    this.polygons.forEach((polygon) => polygon.setMap(null));
    this.polygons.clear();
    this.circles.forEach((circle) => circle.setMap(null));
    this.circles.clear();
  }

  // ==================== MARKER MANAGEMENT ====================

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

  /**
   * Validate coordinates are valid and in reasonable range
   */
  private isValidCoordinate(coord: { lat: number; lng: number }): boolean {
    return (
      coord &&
      typeof coord.lat === 'number' &&
      typeof coord.lng === 'number' &&
      !isNaN(coord.lat) &&
      !isNaN(coord.lng) &&
      coord.lat >= -90 &&
      coord.lat <= 90 &&
      coord.lng >= -180 &&
      coord.lng <= 180
    );
  }

  /**
   * Display route with caching and alternative routes support
   */
  async displayRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: {
      routeId?: string;
      waypoints?: { lat: number; lng: number }[];
      optimizeWaypoints?: boolean; // NEW: Optimize waypoint order
      provideAlternatives?: boolean; // NEW: Get alternative routes
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
      departureTime?: Date;
      trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic';
      avoidHighways?: boolean;
      avoidTolls?: boolean;
      avoidFerries?: boolean;
    }
  ): Promise<google.maps.DirectionsResult | null> {
    if (!this.directionsService || !this.map) return null;

    // Validate coordinates first
    if (!this.isValidCoordinate(origin)) {
      console.error('❌ Invalid origin coordinates:', origin);
      return null;
    }
    if (!this.isValidCoordinate(destination)) {
      console.error('❌ Invalid destination coordinates:', destination);
      return null;
    }

    // Validate waypoints if present
    if (options?.waypoints) {
      for (let i = 0; i < options.waypoints.length; i++) {
        if (!this.isValidCoordinate(options.waypoints[i])) {
          console.error(`❌ Invalid waypoint ${i} coordinates:`, options.waypoints[i]);
          return null;
        }
      }
    }

    try {
      // Check cache first
      const cacheKey = mapsCacheService.getRouteKey(origin, destination, {
        waypoints: options?.waypoints,
        trafficModel: options?.trafficModel,
        departureTime: options?.departureTime?.toISOString(),
      });

      let result = mapsCacheService.get<google.maps.DirectionsResult>(cacheKey);

      if (!result) {
        // Map string traffic model to Google Maps enum
        const getTrafficModel = (model?: string): google.maps.TrafficModel => {
          switch (model) {
            case 'optimistic':
              return google.maps.TrafficModel.OPTIMISTIC;
            case 'pessimistic':
              return google.maps.TrafficModel.PESSIMISTIC;
            case 'best_guess':
            default:
              return google.maps.TrafficModel.BEST_GUESS;
          }
        };

        const request: google.maps.DirectionsRequest = {
          origin,
          destination,
          waypoints: options?.waypoints?.map((point) => ({
            location: point,
            stopover: true,
          })),
          optimizeWaypoints: options?.optimizeWaypoints || false, // NEW
          provideRouteAlternatives: options?.provideAlternatives || false, // NEW
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: options?.avoidHighways || false,
          avoidTolls: options?.avoidTolls || false,
          avoidFerries: options?.avoidFerries || false,
          // Add driving options for real-time traffic data
          drivingOptions: {
            departureTime: options?.departureTime || new Date(),
            trafficModel: getTrafficModel(options?.trafficModel),
          },
        };

        result = await this.directionsService.route(request);

        // Cache for 3 minutes (traffic changes quickly)
        mapsCacheService.set(cacheKey, result, 3 * 60 * 1000);
      }

      if (result.routes && result.routes[0]) {
        const route = result.routes[0];
        const routeId = options?.routeId || `route-${Date.now()}`;

        // Get the path from overview_path
        let path: google.maps.LatLng[] = [];

        if (route.overview_path && route.overview_path.length > 0) {
          path = route.overview_path;
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
        } else {
          console.warn(`No path found for route ${routeId}`);
        }

        // Log if waypoints were optimized
        if (options?.optimizeWaypoints && route.waypoint_order) {
          console.log('✅ Waypoints optimized. New order:', route.waypoint_order);
        }

        // Log if alternatives were provided
        if (options?.provideAlternatives && result.routes.length > 1) {
          console.log(`✅ ${result.routes.length} alternative routes available`);
        }
      }

      return result;
    } catch (error) {
      // Better error handling for common issues
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('ZERO_RESULTS')) {
        console.warn(
          '⚠️ Aucune route trouvée entre origine et destination. Vérifiez que les coordonnées sont sur le réseau routier.',
          '\nOrigine:', origin,
          '\nDestination:', destination
        );
      } else if (errorMessage.includes('INVALID_REQUEST')) {
        console.error('❌ Requête invalide. Vérifiez les paramètres:', {
          origin,
          destination,
          waypoints: options?.waypoints,
        });
      } else if (errorMessage.includes('OVER_QUERY_LIMIT')) {
        console.error('❌ Quota API dépassé. Réessayez plus tard.');
      } else {
        console.error('❌ Error displaying route:', error);
      }
      return null;
    }
  }

  /**
   * Get alternative routes with comparison
   */
  async getRouteAlternatives(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: {
      departureTime?: Date;
      avoidHighways?: boolean;
      avoidTolls?: boolean;
    }
  ): Promise<RouteAlternative[]> {
    if (!this.directionsService || !this.map) return [];

    try {
      const result = await this.displayRoute(origin, destination, {
        ...options,
        provideAlternatives: true,
      });

      if (!result || !result.routes) return [];

      const alternatives: RouteAlternative[] = result.routes.map((route, index) => {
        const leg = route.legs[0];

        // Create a hidden polyline for each alternative
        const polyline = new google.maps.Polyline({
          path: route.overview_path,
          strokeColor: index === 0 ? '#2563eb' : '#94a3b8',
          strokeWeight: index === 0 ? 4 : 2,
          strokeOpacity: index === 0 ? 0.8 : 0.5,
          geodesic: true,
          map: null, // Don't show by default
        });

        return {
          routeIndex: index,
          distance: Math.round((leg.distance?.value || 0) / 1000),
          duration: Math.round((leg.duration?.value || 0) / 60),
          durationInTraffic: leg.duration_in_traffic?.value
            ? Math.round(leg.duration_in_traffic.value / 60)
            : undefined,
          summary: route.summary,
          polyline,
        };
      });

      console.log(`✅ Found ${alternatives.length} route alternatives`);
      return alternatives;
    } catch (error) {
      console.error('Error getting route alternatives:', error);
      return [];
    }
  }

  /**
   * Display specific route alternative
   */
  showRouteAlternative(alternative: RouteAlternative, routeId?: string): void {
    if (!this.map) return;

    // Show the polyline
    alternative.polyline.setMap(this.map);

    // Store for later removal
    if (routeId) {
      this.polylines.set(routeId, alternative.polyline);
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
        budgetMin?: number;
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
          <p><strong>Budget:</strong> ${mission.budgetMin ? mission.budgetMin.toLocaleString() + ' FCFA' : 'N/A'}</p>
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
    destination: { lat: number; lng: number },
    options?: {
      departureTime?: Date;
      trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic';
    }
  ): Promise<{
    distance: number;
    duration: number;
    durationInTraffic?: number;
  } | null> {
    try {
      // Ensure Google Maps is loaded
      await googleMapsLoader.load({ libraries: ['routes'] });

      if (!this.directionsService) {
        this.directionsService = new google.maps.DirectionsService();
      }

      // Map string traffic model to Google Maps enum
      const getTrafficModel = (model?: string): google.maps.TrafficModel => {
        switch (model) {
          case 'optimistic':
            return google.maps.TrafficModel.OPTIMISTIC;
          case 'pessimistic':
            return google.maps.TrafficModel.PESSIMISTIC;
          case 'best_guess':
          default:
            return google.maps.TrafficModel.BEST_GUESS;
        }
      };

      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false,
        // Add driving options for real-time traffic data
        drivingOptions: {
          departureTime: options?.departureTime || new Date(),
          trafficModel: getTrafficModel(options?.trafficModel),
        },
      };

      const result = await this.directionsService.route(request);

      if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
        const leg = result.routes[0].legs[0];
        const response: {
          distance: number;
          duration: number;
          durationInTraffic?: number;
        } = {
          distance: Math.round((leg.distance?.value || 0) / 1000), // Convert to km
          duration: Math.round((leg.duration?.value || 0) / 60), // Convert to minutes
        };

        // Add traffic duration if available
        if (leg.duration_in_traffic?.value) {
          response.durationInTraffic = Math.round(leg.duration_in_traffic.value / 60); // Convert to minutes
        }

        return response;
      }

      return null;
    } catch (error) {
      console.error('Error calculating distance with directions:', error);
      return null;
    }
  }

  /**
   * Calculate detailed ETA with traffic information using Distance Matrix Service
   * OPTIMIZED: Uses Distance Matrix Service instead of 3 separate Directions requests
   * Reduces API calls by 67%!
   */
  async getETAWithTraffic(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    departureTime?: Date
  ): Promise<{
    distance: number; // in km
    baseTime: number; // in minutes (without traffic)
    bestCase: {
      duration: number; // in minutes
      eta: Date;
    };
    realistic: {
      duration: number; // in minutes
      eta: Date;
      trafficDelay?: number; // in minutes
    };
    worstCase: {
      duration: number; // in minutes
      eta: Date;
    };
  } | null> {
    try {
      const departure = departureTime || new Date();

      // Use Distance Matrix Service for efficient batch calculation
      const result = await distanceMatrixService.getETAScenarios(
        origin,
        destination,
        departure
      );

      if (!result) return null;

      // Map the response to match expected format
      return {
        distance: result.distance,
        baseTime: result.baseTime,
        bestCase: {
          duration: result.optimistic.duration,
          eta: result.optimistic.eta,
        },
        realistic: {
          duration: result.realistic.duration,
          eta: result.realistic.eta,
          trafficDelay: result.realistic.trafficDelay,
        },
        worstCase: {
          duration: result.pessimistic.duration,
          eta: result.pessimistic.eta,
        },
      };
    } catch (error) {
      console.error('Error calculating ETA with traffic:', error);
      return null;
    }
  }

  /**
   * Calculate ETA for multiple missions in batch (OPTIMIZED)
   * Much more efficient than calling getETAWithTraffic multiple times
   */
  async getBatchETA(
    routes: Array<{ origin: { lat: number; lng: number }; destination: { lat: number; lng: number } }>,
    departureTime?: Date
  ): Promise<Array<{
    distance: number;
    duration: number;
    durationInTraffic?: number;
    trafficDelay?: number;
  } | null>> {
    try {
      const origins = routes.map((r) => r.origin);
      const destinations = routes.map((r) => r.destination);

      const result = await distanceMatrixService.calculateBatch(
        origins,
        destinations,
        {
          departureTime: departureTime || new Date(),
          trafficModel: 'best_guess',
        }
      );

      console.log(
        `✅ Batch ETA calculated for ${routes.length} routes (${result.totalRequests} API calls, ${result.cachedResults} from cache)`
      );

      // Map results back to original order
      return routes.map((_, index) => {
        const match = result.results.find(
          (r) =>
            r.origin.lat === origins[index].lat &&
            r.origin.lng === origins[index].lng &&
            r.destination.lat === destinations[index].lat &&
            r.destination.lng === destinations[index].lng
        );

        if (!match) return null;

        return {
          distance: match.distance,
          duration: match.duration,
          durationInTraffic: match.durationInTraffic,
          trafficDelay: match.trafficDelay,
        };
      });
    } catch (error) {
      console.error('Error calculating batch ETA:', error);
      return routes.map(() => null);
    }
  }

  destroy(): void {
    // Clean up markers
    this.markers.forEach((marker) => {
      if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
        marker.map = null;
      } else {
        marker.setMap(null);
      }
    });
    this.markers.clear();

    // Clean up polylines
    this.polylines.forEach((polyline) => {
      polyline.setMap(null);
    });
    this.polylines.clear();

    // Clean up layers
    if (this.trafficLayer) {
      this.trafficLayer.setMap(null);
      this.trafficLayer = null;
    }
    if (this.bicycleLayer) {
      this.bicycleLayer.setMap(null);
      this.bicycleLayer = null;
    }
    if (this.transitLayer) {
      this.transitLayer.setMap(null);
      this.transitLayer = null;
    }
    if (this.heatmapLayer) {
      this.heatmapLayer.setMap(null);
      this.heatmapLayer = null;
    }

    // Clean up shapes
    this.clearShapes();

    // Clean up marker clusterer if exists
    if (this.markerClusterer) {
      this.markerClusterer.clearMarkers();
      this.markerClusterer = null;
    }

    this.map = null;
    this.directionsService = null;
    this.elevationService = null;

    console.log('✅ Google Maps Service destroyed and cleaned up');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    return mapsCacheService.getStats();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    mapsCacheService.clear();
    console.log('✅ Maps cache cleared');
  }
}

export default GoogleMapsService;
