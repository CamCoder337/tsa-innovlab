import { webSocketService } from './websocket.service';
import GeolocationService, { type GeolocationPosition } from './geolocation.service';

export interface TrackingConfig {
  vehicleId: string;
  updateInterval?: number; // en millisecondes
  enableHighAccuracy?: boolean;
}

export interface PositionUpdate {
  vehicleId: string;
  position: {
    lat: number;
    lng: number;
  };
  speed?: number;
  bearing?: number;
  accuracy?: number;
  batteryLevel?: number;
  timestamp: string;
}

export type TrackingUpdateCallback = (update: PositionUpdate) => void;
export type TrackingErrorCallback = (error: string) => void;

export class TrackingService {
  private geolocationService: GeolocationService;
  private isTracking: boolean = false;
  private currentConfig: TrackingConfig | null = null;
  private updateCallbacks: Set<TrackingUpdateCallback> = new Set();
  private errorCallbacks: Set<TrackingErrorCallback> = new Set();
  private lastPosition: GeolocationPosition | null = null;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.geolocationService = new GeolocationService();
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    // Écouter les mises à jour de position d'autres véhicules
    webSocketService.subscribe<PositionUpdate>('position_updated', (update) => {
      this.notifyUpdateCallbacks(update);
    });

    // Écouter les erreurs du serveur
    webSocketService.subscribe<{ message: string }>('tracking_error', (error) => {
      this.notifyErrorCallbacks(error.message);
    });
  }

  async startTracking(config: TrackingConfig): Promise<void> {
    if (this.isTracking) {
      console.warn('Tracking is already active');
      return;
    }

    try {
      this.currentConfig = config;

      // Démarrer la géolocalisation
      this.geolocationService.startWatching({
        enableHighAccuracy: config.enableHighAccuracy ?? true,
        timeout: 10000,
        maximumAge: 5000,
      });

      // S'abonner aux mises à jour de position
      this.geolocationService.subscribe((position) => {
        this.handlePositionUpdate(position);
      });

      // S'abonner aux erreurs de géolocalisation
      this.geolocationService.subscribeToErrors((error) => {
        this.notifyErrorCallbacks(`Erreur géolocalisation: ${error.message}`);
      });

      // Rejoindre la room WebSocket du véhicule
      webSocketService.emit('join_vehicle', config.vehicleId);

      this.isTracking = true;

      // Démarrer l'envoi périodique si configuré
      if (config.updateInterval) {
        this.startPeriodicUpdates(config.updateInterval);
      }
    } catch (error) {
      this.notifyErrorCallbacks(`Impossible de démarrer le tracking: ${error}`);
      throw error;
    }
  }

  stopTracking(): void {
    if (!this.isTracking) return;

    this.geolocationService.stopWatching();

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.isTracking = false;
    this.currentConfig = null;
    this.lastPosition = null;
  }

  private startPeriodicUpdates(interval: number): void {
    this.updateTimer = setInterval(() => {
      const position = this.geolocationService.getLastKnownPosition();
      if (position) {
        this.sendPositionToServer(position);
      }
    }, interval);
  }

  private handlePositionUpdate(position: GeolocationPosition): void {
    if (!this.currentConfig) return;

    // Calculer la direction si on a une position précédente
    let bearing: number | undefined;
    if (this.lastPosition) {
      bearing = this.geolocationService.calculateBearing(
        { lat: this.lastPosition.lat, lng: this.lastPosition.lng },
        { lat: position.lat, lng: position.lng }
      );
    }

    const update: PositionUpdate = {
      vehicleId: this.currentConfig.vehicleId,
      position: {
        lat: position.lat,
        lng: position.lng,
      },
      speed: position.speed,
      bearing: bearing || position.heading,
      accuracy: position.accuracy,
      batteryLevel: this.getBatteryLevel(),
      timestamp: new Date(position.timestamp).toISOString(),
    };

    // Envoyer au serveur via WebSocket
    this.sendPositionToServer(position);

    // Notifier les callbacks locaux
    this.notifyUpdateCallbacks(update);

    this.lastPosition = position;
  }

  private sendPositionToServer(position: GeolocationPosition): void {
    if (!this.currentConfig || !webSocketService.isConnected()) return;

    webSocketService.emit('position_update', {
      vehicleId: this.currentConfig.vehicleId,
      lat: position.lat,
      lng: position.lng,
      speed: position.speed,
      bearing: position.heading,
      accuracy: position.accuracy,
      batteryLevel: this.getBatteryLevel(),
      timestamp: new Date(position.timestamp).toISOString(),
    });
  }

  private getBatteryLevel(): number | undefined {
    // Utiliser l'API Battery si disponible
    if ('getBattery' in navigator) {
      // Note: Cette API est dépréciée mais encore utilisée
      return undefined; // À implémenter si nécessaire
    }
    return undefined;
  }

  // Méthodes pour s'abonner aux mises à jour
  onPositionUpdate(callback: TrackingUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  onError(callback: TrackingErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  private notifyUpdateCallbacks(update: PositionUpdate): void {
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in tracking update callback:', error);
      }
    });
  }

  private notifyErrorCallbacks(error: string): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in tracking error callback:', err);
      }
    });
  }

  // Méthodes utilitaires
  getCurrentPosition(): GeolocationPosition | null {
    return this.geolocationService.getLastKnownPosition();
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  getTrackingConfig(): TrackingConfig | null {
    return this.currentConfig;
  }

  // Calculer distance entre deux points
  calculateDistance(
    pos1: { lat: number; lng: number },
    pos2: { lat: number; lng: number }
  ): number {
    return this.geolocationService.calculateDistance(pos1, pos2);
  }

  destroy(): void {
    this.stopTracking();
    this.updateCallbacks.clear();
    this.errorCallbacks.clear();
    this.geolocationService.destroy();
  }
}

// Instance singleton
export const trackingService = new TrackingService();
export default trackingService;
