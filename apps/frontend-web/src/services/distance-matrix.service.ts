/**
 * Distance Matrix Service
 * Optimized batch calculations for multiple routes
 * Uses Google Maps Distance Matrix API
 */

import { googleMapsLoader } from '@/lib/google-maps-loader';
import { mapsCacheService } from './maps-cache.service';

export interface DistanceMatrixOptions {
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  departureTime?: Date;
  arrivalTime?: Date;
  trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic';
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  unitSystem?: 'METRIC' | 'IMPERIAL';
  region?: string;
}

export interface DistanceMatrixResult {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  distance: number; // in kilometers
  duration: number; // in minutes
  durationInTraffic?: number; // in minutes (with traffic)
  trafficDelay?: number; // in minutes
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'MAX_ROUTE_LENGTH_EXCEEDED';
}

export interface BatchDistanceMatrixResult {
  results: DistanceMatrixResult[];
  errors: Array<{ origin: number; destination: number; error: string }>;
  totalRequests: number;
  cachedResults: number;
}

export class DistanceMatrixService {
  private service: google.maps.DistanceMatrixService | null = null;
  private readonly MAX_ORIGINS = 25;
  private readonly MAX_DESTINATIONS = 25;

  async initialize(): Promise<void> {
    await googleMapsLoader.load({ libraries: ['routes'] });
    if (!this.service) {
      this.service = new google.maps.DistanceMatrixService();
    }
  }

  /**
   * Calculate distances for multiple origin-destination pairs (batch)
   * Automatically chunks large requests and uses caching
   */
  async calculateBatch(
    origins: { lat: number; lng: number }[],
    destinations: { lat: number; lng: number }[],
    options: DistanceMatrixOptions = {}
  ): Promise<BatchDistanceMatrixResult> {
    await this.initialize();

    const results: DistanceMatrixResult[] = [];
    const errors: Array<{ origin: number; destination: number; error: string }> = [];
    let cachedResults = 0;

    // Split into chunks if necessary
    const originChunks = this.chunkArray(origins, this.MAX_ORIGINS);
    const destinationChunks = this.chunkArray(destinations, this.MAX_DESTINATIONS);

    let totalRequests = 0;

    for (let oi = 0; oi < originChunks.length; oi++) {
      for (let di = 0; di < destinationChunks.length; di++) {
        const originChunk = originChunks[oi];
        const destChunk = destinationChunks[di];

        // Check cache first
        const cacheKey = mapsCacheService.getDistanceMatrixKey(
          originChunk,
          destChunk,
          options as Record<string, unknown>
        );

        let response = mapsCacheService.get<google.maps.DistanceMatrixResponse>(cacheKey);

        if (!response) {
          // Make API request
          totalRequests++;
          try {
            response = await this.makeRequest(originChunk, destChunk, options);
            // Cache for 5 minutes (traffic data changes)
            mapsCacheService.set(cacheKey, response, 5 * 60 * 1000);
          } catch (error) {
            console.error('Distance Matrix API error:', error);
            continue;
          }
        } else {
          cachedResults++;
        }

        // Parse response
        if (response && response.rows) {
          for (let i = 0; i < response.rows.length; i++) {
            const row = response.rows[i];
            for (let j = 0; j < row.elements.length; j++) {
              const element = row.elements[j];
              const originIndex = oi * this.MAX_ORIGINS + i;
              const destIndex = di * this.MAX_DESTINATIONS + j;

              if (element.status === 'OK') {
                const distance = Math.round((element.distance?.value || 0) / 1000); // km
                const duration = Math.round((element.duration?.value || 0) / 60); // minutes
                const durationInTraffic = element.duration_in_traffic?.value
                  ? Math.round(element.duration_in_traffic.value / 60)
                  : undefined;

                results.push({
                  origin: origins[originIndex],
                  destination: destinations[destIndex],
                  distance,
                  duration,
                  durationInTraffic,
                  trafficDelay:
                    durationInTraffic && durationInTraffic > duration
                      ? durationInTraffic - duration
                      : undefined,
                  status: 'OK',
                });
              } else {
                errors.push({
                  origin: originIndex,
                  destination: destIndex,
                  error: element.status,
                });
              }
            }
          }
        }
      }
    }

    return {
      results,
      errors,
      totalRequests,
      cachedResults,
    };
  }

  /**
   * Calculate single origin-destination distance (with caching)
   */
  async calculateSingle(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: DistanceMatrixOptions = {}
  ): Promise<DistanceMatrixResult | null> {
    const result = await this.calculateBatch([origin], [destination], options);

    if (result.results.length > 0) {
      return result.results[0];
    }

    return null;
  }

  /**
   * Calculate distances for one origin to multiple destinations
   */
  async calculateOneToMany(
    origin: { lat: number; lng: number },
    destinations: { lat: number; lng: number }[],
    options: DistanceMatrixOptions = {}
  ): Promise<BatchDistanceMatrixResult> {
    return this.calculateBatch([origin], destinations, options);
  }

  /**
   * Calculate distances for multiple origins to one destination
   */
  async calculateManyToOne(
    origins: { lat: number; lng: number }[],
    destination: { lat: number; lng: number },
    options: DistanceMatrixOptions = {}
  ): Promise<BatchDistanceMatrixResult> {
    return this.calculateBatch(origins, [destination], options);
  }

  /**
   * Get ETA with multiple traffic scenarios (optimistic, realistic, pessimistic)
   */
  async getETAScenarios(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    departureTime: Date = new Date()
  ): Promise<{
    distance: number;
    baseTime: number;
    optimistic: { duration: number; eta: Date };
    realistic: { duration: number; eta: Date; trafficDelay?: number };
    pessimistic: { duration: number; eta: Date };
  } | null> {
    // Make 3 parallel requests with different traffic models
    const [optimisticResult, realisticResult, pessimisticResult] = await Promise.all([
      this.calculateSingle(origin, destination, {
        departureTime,
        trafficModel: 'optimistic',
      }),
      this.calculateSingle(origin, destination, {
        departureTime,
        trafficModel: 'best_guess',
      }),
      this.calculateSingle(origin, destination, {
        departureTime,
        trafficModel: 'pessimistic',
      }),
    ]);

    if (!realisticResult) return null;

    const calculateETA = (minutes: number): Date => {
      const eta = new Date(departureTime);
      eta.setMinutes(eta.getMinutes() + minutes);
      return eta;
    };

    return {
      distance: realisticResult.distance,
      baseTime: realisticResult.duration,
      optimistic: {
        duration:
          optimisticResult?.durationInTraffic ||
          optimisticResult?.duration ||
          realisticResult.duration,
        eta: calculateETA(
          optimisticResult?.durationInTraffic ||
            optimisticResult?.duration ||
            realisticResult.duration
        ),
      },
      realistic: {
        duration: realisticResult.durationInTraffic || realisticResult.duration,
        eta: calculateETA(realisticResult.durationInTraffic || realisticResult.duration),
        trafficDelay: realisticResult.trafficDelay,
      },
      pessimistic: {
        duration:
          pessimisticResult?.durationInTraffic ||
          pessimisticResult?.duration ||
          realisticResult.duration,
        eta: calculateETA(
          pessimisticResult?.durationInTraffic ||
            pessimisticResult?.duration ||
            realisticResult.duration
        ),
      },
    };
  }

  /**
   * Make actual API request
   */
  private async makeRequest(
    origins: { lat: number; lng: number }[],
    destinations: { lat: number; lng: number }[],
    options: DistanceMatrixOptions
  ): Promise<google.maps.DistanceMatrixResponse> {
    if (!this.service) {
      throw new Error('Distance Matrix Service not initialized');
    }

    const request: google.maps.DistanceMatrixRequest = {
      origins: origins.map((o) => new google.maps.LatLng(o.lat, o.lng)),
      destinations: destinations.map((d) => new google.maps.LatLng(d.lat, d.lng)),
      travelMode: this.getTravelMode(options.travelMode),
      unitSystem:
        options.unitSystem === 'IMPERIAL'
          ? google.maps.UnitSystem.IMPERIAL
          : google.maps.UnitSystem.METRIC,
      avoidHighways: options.avoidHighways || false,
      avoidTolls: options.avoidTolls || false,
      avoidFerries: options.avoidFerries || false,
      region: options.region,
    };

    // Add driving options for traffic data
    if (options.travelMode === 'DRIVING' || !options.travelMode) {
      request.drivingOptions = {
        departureTime: options.departureTime || new Date(),
        trafficModel: this.getTrafficModel(options.trafficModel),
      };
    }

    // Add transit options if needed
    if (options.travelMode === 'TRANSIT' && options.arrivalTime) {
      request.transitOptions = {
        arrivalTime: options.arrivalTime,
      };
    }

    return new Promise((resolve, reject) => {
      this.service!.getDistanceMatrix(request, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          resolve(response);
        } else {
          reject(new Error(`Distance Matrix request failed: ${status}`));
        }
      });
    });
  }

  /**
   * Convert travel mode string to enum
   */
  private getTravelMode(mode?: string): google.maps.TravelMode {
    switch (mode) {
      case 'WALKING':
        return google.maps.TravelMode.WALKING;
      case 'BICYCLING':
        return google.maps.TravelMode.BICYCLING;
      case 'TRANSIT':
        return google.maps.TravelMode.TRANSIT;
      case 'DRIVING':
      default:
        return google.maps.TravelMode.DRIVING;
    }
  }

  /**
   * Convert traffic model string to enum
   */
  private getTrafficModel(model?: string): google.maps.TrafficModel {
    switch (model) {
      case 'optimistic':
        return google.maps.TrafficModel.OPTIMISTIC;
      case 'pessimistic':
        return google.maps.TrafficModel.PESSIMISTIC;
      case 'best_guess':
      default:
        return google.maps.TrafficModel.BEST_GUESS;
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Singleton instance
export const distanceMatrixService = new DistanceMatrixService();
