export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export type GeolocationCallback = (position: GeolocationPosition) => void;
export type GeolocationErrorCallback = (error: GeolocationError) => void;

export class GeolocationService {
  private watchId: number | null = null;
  private isWatching: boolean = false;
  private lastKnownPosition: GeolocationPosition | null = null;
  private callbacks: Set<GeolocationCallback> = new Set();
  private errorCallbacks: Set<GeolocationErrorCallback> = new Set();

  private defaultOptions: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
  };

  constructor() {
    this.checkGeolocationSupport();
  }

  private checkGeolocationSupport(): void {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }
  }

  async getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      const opts = { ...this.defaultOptions, ...options };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoPosition = this.transformPosition(position);
          this.lastKnownPosition = geoPosition;
          resolve(geoPosition);
        },
        (error) => {
          const geoError = this.transformError(error);
          reject(geoError);
        },
        opts
      );
    });
  }

  startWatching(options?: GeolocationOptions): void {
    if (this.isWatching) {
      console.warn('Geolocation watching is already active');
      return;
    }

    const opts = { ...this.defaultOptions, ...options };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const geoPosition = this.transformPosition(position);
        this.lastKnownPosition = geoPosition;
        this.notifyCallbacks(geoPosition);
      },
      (error) => {
        const geoError = this.transformError(error);
        this.notifyErrorCallbacks(geoError);
      },
      opts
    );

    this.isWatching = true;
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
    }
  }

  subscribe(callback: GeolocationCallback): () => void {
    this.callbacks.add(callback);

    // Si on a déjà une position, l'envoyer immédiatement
    if (this.lastKnownPosition) {
      callback(this.lastKnownPosition);
    }

    // Retourner fonction de désabonnement
    return () => {
      this.callbacks.delete(callback);
    };
  }

  subscribeToErrors(callback: GeolocationErrorCallback): () => void {
    this.errorCallbacks.add(callback);

    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  getLastKnownPosition(): GeolocationPosition | null {
    return this.lastKnownPosition;
  }

  isCurrentlyWatching(): boolean {
    return this.isWatching;
  }

  // Calculer la distance entre deux positions (en mètres)
  calculateDistance(
    pos1: { lat: number; lng: number },
    pos2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (pos1.lat * Math.PI) / 180;
    const φ2 = (pos2.lat * Math.PI) / 180;
    const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Calculer la direction entre deux positions (en degrés)
  calculateBearing(pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }): number {
    const φ1 = (pos1.lat * Math.PI) / 180;
    const φ2 = (pos2.lat * Math.PI) / 180;
    const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360;
  }

  private transformPosition(position: globalThis.GeolocationPosition): GeolocationPosition {
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp,
    };
  }

  private transformError(error: globalThis.GeolocationPositionError): GeolocationError {
    let message: string;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "Accès à la géolocalisation refusé par l'utilisateur";
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Position non disponible';
        break;
      case error.TIMEOUT:
        message = 'Timeout lors de la récupération de la position';
        break;
      default:
        message = 'Erreur inconnue lors de la géolocalisation';
    }

    return {
      code: error.code,
      message,
    };
  }

  private notifyCallbacks(position: GeolocationPosition): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(position);
      } catch (error) {
        console.error('Error in geolocation callback:', error);
      }
    });
  }

  private notifyErrorCallbacks(error: GeolocationError): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in geolocation error callback:', err);
      }
    });
  }

  destroy(): void {
    this.stopWatching();
    this.callbacks.clear();
    this.errorCallbacks.clear();
    this.lastKnownPosition = null;
  }
}

export default GeolocationService;
