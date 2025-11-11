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
    // If already loaded, return immediately
    if (this.isLoaded && window.google?.maps) {
      return Promise.resolve();
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
    } finally {
      this.isLoading = false;
    }
  }

  private loadScript(options: GoogleMapsLoaderOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // --- 1. Nettoyer les anciens scripts ---
      document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach((s) => s.remove());
      document.querySelectorAll('script[src*="google.com/maps/api/js"]').forEach((s) => s.remove());

      const apiKey = getGoogleMapsApiKey();
      if (!apiKey) return reject(new Error('Missing API key'));

      const { libraries = ['places', 'geometry', 'marker'], version = 'weekly' } = options;
      const language = i18n.language;

      // --- 2. Callback officiel ---
      const callbackName = `gmaps_cb_${Date.now()}`;
      window[callbackName] = () => {
        delete window[callbackName];
        console.log('Google Maps API prête via callback');
        resolve();
      };

      const script = document.createElement('script');
      script.src =
        `https://maps.googleapis.com/maps/api/js` +
        `?key=${apiKey}` +
        `&language=${language}` +
        `&libraries=${libraries.join(',')}` +
        `&v=${version}` +
        `&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      const timeoutId = setTimeout(() => reject(new Error('Timeout')), 20000);

      script.onload = () => clearTimeout(timeoutId); // le vrai succès arrive dans le callback
      script.onerror = (e) => {
        clearTimeout(timeoutId);
        reject(new Error('Script load failed: ' + e));
      };

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
