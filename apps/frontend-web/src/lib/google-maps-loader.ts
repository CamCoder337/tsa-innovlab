import { getGoogleMapsApiKey } from '@/config/env';
import i18n from '@/i18n';

declare global {
  interface Window {
    [key: string]: (() => void) | undefined;
    google?: {
      maps?: {
        Map: new (element: HTMLElement, options?: google.maps.MapOptions) => google.maps.Map;
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete;
          PlacesService: new (
            map: google.maps.Map | HTMLDivElement
          ) => google.maps.places.PlacesService;
          PlaceAutocompleteElement: typeof google.maps.places.PlaceAutocompleteElement;
        };
        geometry?: {
          spherical: typeof google.maps.geometry.spherical;
        };
        marker?: {
          AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
        };
        [key: string]: unknown;
      };
    };
  }
}

interface GoogleMapsLoaderOptions {
  libraries?: string[];
  version?: string;
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  async load(options: GoogleMapsLoaderOptions = {}): Promise<void> {
    // If already loaded and Google Maps is available, return immediately
    if (this.isLoaded && window.google?.maps && window.google.maps.Map) {
      // Check if required libraries are available
      const { libraries = [] } = options;
      const missingLibraries = libraries.filter((lib) => {
        if (lib === 'places') return !window.google.maps.places;
        if (lib === 'geometry') return !window.google.maps.geometry;
        if (lib === 'routes') return !window.google.maps.DirectionsService;
        if (lib === 'marker') return !window.google.maps.marker;
        return false;
      });

      if (missingLibraries.length === 0) {
        return Promise.resolve();
      } else {
        console.warn(`Some libraries are missing: ${missingLibraries.join(', ')}. Attempting to reload with libraries.`);
        // Libraries are missing, need to reload with them
        this.isLoaded = false;
      }
    }

    // If currently loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.loadScript(options);

    try {
      await this.loadPromise;
      this.isLoaded = true;
    } catch (error) {
      // Reset state on error so we can retry
      this.isLoaded = false;
      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private loadScript(options: GoogleMapsLoaderOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const apiKey = getGoogleMapsApiKey();
      if (!apiKey) {
        console.error('❌ Google Maps API key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
        return reject(new Error('Missing API key'));
      }

      // Check if script is already in the DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript && window.google?.maps) {
        console.log('✅ Google Maps script already loaded');
        return resolve();
      }

      // --- 1. Nettoyer les anciens scripts seulement si nécessaire ---
      if (existingScript && !window.google?.maps) {
        console.log('⚠️ Removing existing script that failed to load');
        document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach((s) => s.remove());
        document.querySelectorAll('script[src*="google.com/maps/api/js"]').forEach((s) => s.remove());
      }

      const { libraries = ['places', 'geometry', 'marker'], version = 'weekly' } = options;
      const language = i18n.language;

      // --- 2. Callback officiel ---
      const callbackName = `gmaps_cb_${Date.now()}`;
      window[callbackName] = () => {
        delete window[callbackName];
        console.log('✅ Google Maps API loaded successfully via callback');
        resolve();
      };

      const script = document.createElement('script');
      const url =
        `https://maps.googleapis.com/maps/api/js` +
        `?key=${apiKey}` +
        `&language=${language}` +
        `&libraries=${libraries.join(',')}` +
        `&v=${version}` +
        `&callback=${callbackName}`;
      
      script.src = url;
      script.async = true;
      script.defer = true;

      const timeoutId = setTimeout(() => {
        console.error('❌ Google Maps API load timeout after 20 seconds');
        reject(new Error('Timeout loading Google Maps API'));
      }, 20000);

      script.onload = () => {
        // Le vrai succès arrive dans le callback, mais onclear le timeout ici aussi
        console.log('📡 Google Maps script loaded, waiting for callback...');
      };
      
      script.onerror = (e) => {
        clearTimeout(timeoutId);
        console.error('❌ Failed to load Google Maps script:', {
          url,
          error: e,
          apiKeyPresent: !!apiKey,
          apiKeyLength: apiKey?.length || 0,
        });
        const errorType = typeof e === 'object' && e !== null && 'type' in e ? (e as Event).type : 'Unknown error';
        reject(new Error(`Script load failed: ${errorType}. Check your API key and network connection.`));
      };

      console.log('📡 Loading Google Maps API:', {
        url: url.replace(apiKey, '***'),
        libraries: libraries.join(', '),
        language,
      });

      document.head.appendChild(script);
    });
  }

  // private waitForGoogleMapsAPI(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     let attempts = 0;
  //     const maxAttempts = 50; // 5 seconds max (50 * 100ms)

  //     const checkAPI = () => {
  //       attempts++;

  //       if (window.google?.maps?.Map && typeof window.google.maps.Map === 'function') {
  //         console.log('✅ Google Maps API disponible');
  //         resolve();
  //         return;
  //       }

  //       if (attempts >= maxAttempts) {
  //         console.error('❌ Google Maps API non disponible après le chargement du script');
  //         reject(new Error('Google Maps API not available after script load'));
  //         return;
  //       }

  //       setTimeout(checkAPI, 100);
  //     };

  //     checkAPI();
  //   });
  // }

  isGoogleMapsLoaded(): boolean {
    return (
      this.isLoaded && !!window.google?.maps?.Map && typeof window.google.maps.Map === 'function'
    );
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();
