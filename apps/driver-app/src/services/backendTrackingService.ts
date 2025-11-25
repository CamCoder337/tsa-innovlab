import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuration du backend
// Pour émulateur Android : http://10.0.2.2:3333
// Pour appareil physique : http://<IP_DE_VOTRE_PC>:3333
// Pour simulateur iOS : http://localhost:3333

// Détection automatique si on est sur Expo Go (appareil physique)
const getBackendUrl = () => {
  // Si on utilise Expo Go sur appareil physique, on doit utiliser l'IP du PC
  const expoUrl = Constants.expoConfig?.hostUri;

  if (expoUrl) {
    // Extraire l'IP de l'hôte Expo (ex: "192.168.1.100:8081" -> "192.168.1.100")
    const hostIp = expoUrl.split(':')[0];
    console.log(`📱 Détection automatique - IP de l'hôte: ${hostIp}`);
    return `http://${hostIp}:3333`;
  }

  // Sinon, utiliser la configuration par défaut selon la plateforme
  return Platform.select({
    android: 'http://10.0.2.2:3333', // Émulateur Android
    ios: 'http://localhost:3333',     // Simulateur iOS
    default: 'http://localhost:3333'
  })!;
};

const BACKEND_URL = getBackendUrl();
console.log(`🔗 Backend URL configurée: ${BACKEND_URL}`);

interface PositionUpdate {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

class BackendTrackingService {
  private deviceId: string;
  private updateInterval: NodeJS.Timeout | null = null;
  private currentPosition: { latitude: number; longitude: number; speed?: number; heading?: number } | null = null;

  constructor() {
    // Générer un ID unique pour cet appareil
    this.deviceId = `driver-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Met à jour la position actuelle (appelé par le GPS tracker)
   */
  updatePosition(latitude: number, longitude: number, speed?: number, heading?: number) {
    // Ne garder heading que s'il est valide (>= 0)
    const validHeading = heading !== null && heading !== undefined && heading >= 0 ? heading : undefined;
    // Ne garder speed que s'il est valide (>= 0)
    const validSpeed = speed !== null && speed !== undefined && speed >= 0 ? speed : undefined;

    this.currentPosition = {
      latitude,
      longitude,
      speed: validSpeed,
      heading: validHeading
    };
  }

  /**
   * Démarre l'envoi automatique des positions toutes les 5 secondes
   */
  startAutoTracking() {
    if (this.updateInterval) {
      console.log('Auto-tracking already started');
      return;
    }

    console.log(`🚀 Starting auto-tracking for device: ${this.deviceId}`);

    // Envoyer immédiatement si une position est disponible
    if (this.currentPosition) {
      this.sendPositionToBackend();
    }

    // Puis envoyer toutes les 5 secondes
    this.updateInterval = setInterval(() => {
      if (this.currentPosition) {
        this.sendPositionToBackend();
      }
    }, 5000);
  }

  /**
   * Arrête l'envoi automatique
   */
  stopAutoTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Auto-tracking stopped');
    }
  }

  /**
   * Envoie la position actuelle au backend
   */
  private async sendPositionToBackend() {
    if (!this.currentPosition) {
      console.warn('No position to send');
      return;
    }

    try {
      // Construire le payload en ne incluant que les champs valides
      const payload: PositionUpdate = {
        deviceId: this.deviceId,
        latitude: this.currentPosition.latitude,
        longitude: this.currentPosition.longitude,
      };

      // Ajouter speed et heading seulement s'ils sont définis et valides
      if (this.currentPosition.speed !== undefined && this.currentPosition.speed >= 0) {
        payload.speed = this.currentPosition.speed;
      }
      if (this.currentPosition.heading !== undefined && this.currentPosition.heading >= 0) {
        payload.heading = this.currentPosition.heading;
      }

      const url = `${BACKEND_URL}/api/tracking/update-location`;
      console.log(`📡 Sending to: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error('Response:', text);
        return;
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Position sent:', {
          lat: payload.latitude.toFixed(6),
          lng: payload.longitude.toFixed(6),
          speed: payload.speed ? `${(payload.speed * 3.6).toFixed(1)} km/h` : 'N/A',
        });
      } else {
        console.error('❌ Failed to send position:', data.message);
      }
    } catch (error: any) {
      if (error.message?.includes('Network request failed')) {
        console.error('❌ Network error - Impossible de joindre le backend');
        console.error(`   URL tentée: ${BACKEND_URL}/api/tracking/update-location`);
        console.error('   Vérifiez que:');
        console.error('   1. Le backend tourne sur le port 3333');
        console.error('   2. Vous utilisez la bonne URL (voir logs au démarrage)');
        console.error('   3. Aucun firewall ne bloque la connexion');
      } else {
        console.error('❌ Error sending position:', error.message || error);
      }
    }
  }

  /**
   * Obtient l'ID de l'appareil
   */
  getDeviceId(): string {
    return this.deviceId;
  }

  /**
   * Vérifie si le tracking est actif
   */
  isTracking(): boolean {
    return this.updateInterval !== null;
  }
}

// Instance singleton
export const backendTrackingService = new BackendTrackingService();
