import { getGoogleMapsApiKey } from '@/config/env';

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
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script exists, wait for it to load
        if (window.google?.maps) {
          console.log('🗺️ Google Maps déjà chargé');
          resolve();
          return;
        }

        console.log('🔄 Script Google Maps existant trouvé, attente du chargement...');
        // Add listener to existing script
        existingScript.addEventListener('load', () => {
          console.log('✅ Script Google Maps existant chargé');
          resolve();
        });
        existingScript.addEventListener('error', () => {
          console.error('❌ Erreur lors du chargement du script Google Maps existant');
          reject(new Error('Failed to load existing Google Maps script'));
        });
        return;
      }

      const apiKey = getGoogleMapsApiKey();
      if (!apiKey) {
        reject(
          new Error('Google Maps API key is missing. Please check your environment variables.')
        );
        return;
      }

      const { libraries = ['places', 'geometry', 'marker'], version = 'weekly' } = options;

      const script = document.createElement('script');
      const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';

      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}&v=${version}&loading=async`;
      console.log('🚀 Chargement du script Google Maps:', scriptUrl.replace(apiKey, '***'));

      script.src = scriptUrl;
      script.async = true;
      script.defer = true;

      // Add timeout
      const timeoutId = setTimeout(() => {
        console.error('⏰ Timeout lors du chargement de Google Maps');
        reject(new Error('Google Maps script loading timeout'));
      }, 15000);

      script.onload = () => {
        clearTimeout(timeoutId);
        console.log('📦 Script Google Maps chargé');

        // Wait a bit for Google Maps to initialize
        setTimeout(() => {
          if (window.google?.maps) {
            console.log('✅ Google Maps API disponible');
            resolve();
          } else {
            console.error('❌ Google Maps API non disponible après le chargement du script');
            reject(new Error('Google Maps API not available after script load'));
          }
        }, 100);
      };

      script.onerror = (event) => {
        clearTimeout(timeoutId);
        console.error('❌ Erreur lors du chargement du script Google Maps:', event);
        reject(
          new Error(
            'Failed to load Google Maps script. Please check your API key and network connection.'
          )
        );
      };

      document.head.appendChild(script);
    });
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && !!window.google?.maps;
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();
