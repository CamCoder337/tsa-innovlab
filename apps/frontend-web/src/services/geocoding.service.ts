/**
 * Geocoding Service
 * Address ↔ Coordinates conversion with validation
 * Uses Google Maps Geocoding API with caching
 */

import { googleMapsLoader } from '@/lib/google-maps-loader';
import { mapsCacheService } from './maps-cache.service';

export interface GeocodeResult {
  formattedAddress: string;
  location: { lat: number; lng: number };
  placeId: string;
  types: string[];
  addressComponents: google.maps.GeocoderAddressComponent[];
  viewport?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  location: { lat: number; lng: number };
  placeId: string;
  types: string[];
  addressComponents: google.maps.GeocoderAddressComponent[];
}

export interface AddressValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  suggestions?: string[];
  geocodeResult?: GeocodeResult;
  error?: string;
}

export interface GeocodeOptions {
  componentRestrictions?: {
    country?: string; // Google Maps API only accepts string, not string[]
    postalCode?: string;
    locality?: string;
    administrativeArea?: string;
  };
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  region?: string;
  language?: string;
}

export class GeocodingService {
  private geocoder: google.maps.Geocoder | null = null;

  async initialize(): Promise<void> {
    await googleMapsLoader.load({ libraries: ['geocoding'] });
    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  /**
   * Convert address to coordinates (Forward Geocoding)
   */
  async geocode(address: string, options: GeocodeOptions = {}): Promise<GeocodeResult | null> {
    await this.initialize();

    // Check cache first
    const cacheKey = mapsCacheService.getGeocodeKey(address + JSON.stringify(options));
    const cached = mapsCacheService.get<GeocodeResult>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const request: google.maps.GeocoderRequest = {
        address,
        componentRestrictions: options.componentRestrictions,
        bounds: options.bounds
          ? new google.maps.LatLngBounds(
              new google.maps.LatLng(options.bounds.southwest.lat, options.bounds.southwest.lng),
              new google.maps.LatLng(options.bounds.northeast.lat, options.bounds.northeast.lng)
            )
          : undefined,
        region: options.region,
        language: options.language,
      };

      const response = await this.makeGeocodeRequest(request);

      if (response && response.length > 0) {
        const result = this.parseGeocodeResult(response[0]);
        // Cache for 30 days (addresses don't change often)
        mapsCacheService.set(cacheKey, result, 30 * 24 * 60 * 60 * 1000);
        return result;
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Batch geocode multiple addresses
   */
  async geocodeBatch(
    addresses: string[],
    options: GeocodeOptions = {}
  ): Promise<(GeocodeResult | null)[]> {
    const results = await Promise.all(addresses.map((address) => this.geocode(address, options)));
    return results;
  }

  /**
   * Convert coordinates to address (Reverse Geocoding)
   */
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    await this.initialize();

    // Check cache first
    const cacheKey = mapsCacheService.getReverseGeocodeKey(lat, lng);
    const cached = mapsCacheService.get<ReverseGeocodeResult>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const request: google.maps.GeocoderRequest = {
        location: new google.maps.LatLng(lat, lng),
      };

      const response = await this.makeGeocodeRequest(request);

      if (response && response.length > 0) {
        const result = this.parseReverseGeocodeResult(response[0]);
        // Cache for 30 days
        mapsCacheService.set(cacheKey, result, 30 * 24 * 60 * 60 * 1000);
        return result;
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Validate address and get confidence level
   */
  async validateAddress(
    address: string,
    options: GeocodeOptions = {}
  ): Promise<AddressValidationResult> {
    const result = await this.geocode(address, options);

    if (!result) {
      return {
        isValid: false,
        confidence: 'low',
        error: 'Address not found',
      };
    }

    // Determine confidence based on result types and precision
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    if (result.types.includes('street_address') || result.types.includes('premise')) {
      confidence = 'high';
    } else if (result.types.includes('locality') || result.types.includes('sublocality')) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      isValid: true,
      confidence,
      geocodeResult: result,
    };
  }

  /**
   * Get address component by type
   */
  getAddressComponent(
    addressComponents: google.maps.GeocoderAddressComponent[],
    type: string
  ): string | null {
    const component = addressComponents.find((comp) => comp.types.includes(type));
    return component?.long_name || null;
  }

  /**
   * Extract city from address components
   */
  getCityFromComponents(addressComponents: google.maps.GeocoderAddressComponent[]): string | null {
    return (
      this.getAddressComponent(addressComponents, 'locality') ||
      this.getAddressComponent(addressComponents, 'administrative_area_level_2') ||
      this.getAddressComponent(addressComponents, 'sublocality')
    );
  }

  /**
   * Extract country from address components
   */
  getCountryFromComponents(
    addressComponents: google.maps.GeocoderAddressComponent[]
  ): string | null {
    return this.getAddressComponent(addressComponents, 'country');
  }

  /**
   * Extract postal code from address components
   */
  getPostalCodeFromComponents(
    addressComponents: google.maps.GeocoderAddressComponent[]
  ): string | null {
    return this.getAddressComponent(addressComponents, 'postal_code');
  }

  /**
   * Get formatted address for Cameroon addresses
   */
  async getCameroonAddress(address: string): Promise<GeocodeResult | null> {
    return this.geocode(address, {
      componentRestrictions: { country: 'CM' },
      region: 'CM',
    });
  }

  /**
   * Check if coordinates are within Cameroon bounds
   */
  isInCameroon(lat: number, lng: number): boolean {
    // Cameroon approximate bounds
    const bounds = {
      north: 13.083,
      south: 1.652,
      east: 16.192,
      west: 8.494,
    };

    return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
  }

  /**
   * Calculate distance between two addresses
   */
  async getDistanceBetweenAddresses(address1: string, address2: string): Promise<number | null> {
    const [result1, result2] = await Promise.all([this.geocode(address1), this.geocode(address2)]);

    if (!result1 || !result2) {
      return null;
    }

    return this.calculateDistance(result1.location, result2.location);
  }

  /**
   * Calculate straight-line distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Make geocoding request with proper error handling
   */
  private async makeGeocodeRequest(
    request: google.maps.GeocoderRequest
  ): Promise<google.maps.GeocoderResult[]> {
    if (!this.geocoder) {
      throw new Error('Geocoder not initialized');
    }

    return new Promise((resolve, reject) => {
      this.geocoder!.geocode(request, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          resolve(results);
        } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Parse geocode result
   */
  private parseGeocodeResult(result: google.maps.GeocoderResult): GeocodeResult {
    return {
      formattedAddress: result.formatted_address,
      location: {
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
      },
      placeId: result.place_id,
      types: result.types,
      addressComponents: result.address_components,
      viewport: result.geometry.viewport
        ? {
            northeast: {
              lat: result.geometry.viewport.getNorthEast().lat(),
              lng: result.geometry.viewport.getNorthEast().lng(),
            },
            southwest: {
              lat: result.geometry.viewport.getSouthWest().lat(),
              lng: result.geometry.viewport.getSouthWest().lng(),
            },
          }
        : undefined,
    };
  }

  /**
   * Parse reverse geocode result
   */
  private parseReverseGeocodeResult(result: google.maps.GeocoderResult): ReverseGeocodeResult {
    return {
      formattedAddress: result.formatted_address,
      location: {
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
      },
      placeId: result.place_id,
      types: result.types,
      addressComponents: result.address_components,
    };
  }
}

// Singleton instance
export const geocodingService = new GeocodingService();
