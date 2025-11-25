import axios from 'axios';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3333'; // TODO: Move to env config

export interface MissionDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  departureAddress: {
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  arrivalAddress: {
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  estimatedDeparture: string;
  estimatedArrival: string;
  transporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface LocationUpdate {
  id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
}

export interface IssueType {
  value: 'breakdown' | 'delay' | 'accident' | 'traffic' | 'other';
  label: string;
}

export const ISSUE_TYPES: IssueType[] = [
  { value: 'breakdown', label: 'Panne' },
  { value: 'delay', label: 'Retard' },
  { value: 'accident', label: 'Accident' },
  { value: 'traffic', label: 'Embouteillage' },
  { value: 'other', label: 'Autre' },
];

class DriverTrackingService {
  private trackingToken: string | null = null;
  private trackingPin: string | null = null;
  private locationWatchId: Location.LocationSubscription | null = null;
  private isTracking: boolean = false;

  /**
   * Authentifier le chauffeur avec le token et le PIN
   */
  async authenticate(token: string, pin: string): Promise<MissionDetails> {
    try {
      const response = await axios.post(`${API_BASE_URL}/track/${token}/authenticate`, {
        pin,
      });

      if (response.data.success) {
        this.trackingToken = token;
        this.trackingPin = pin;

        // Sauvegarder les credentials localement
        await AsyncStorage.setItem('tracking_token', token);
        await AsyncStorage.setItem('tracking_pin', pin);

        return response.data.data.mission;
      } else {
        throw new Error(response.data.message || 'Authentification échouée');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      throw new Error(
        error.response?.data?.message || 'Impossible de se connecter. Vérifiez vos identifiants.'
      );
    }
  }

  /**
   * Récupérer les credentials sauvegardés
   */
  async getSavedCredentials(): Promise<{ token: string; pin: string } | null> {
    try {
      const token = await AsyncStorage.getItem('tracking_token');
      const pin = await AsyncStorage.getItem('tracking_pin');

      if (token && pin) {
        return { token, pin };
      }
      return null;
    } catch (error) {
      console.error('Error retrieving saved credentials:', error);
      return null;
    }
  }

  /**
   * Supprimer les credentials sauvegardés
   */
  async clearCredentials(): Promise<void> {
    try {
      await AsyncStorage.removeItem('tracking_token');
      await AsyncStorage.removeItem('tracking_pin');
      this.trackingToken = null;
      this.trackingPin = null;
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  }

  /**
   * Envoyer une mise à jour de position GPS
   */
  async sendLocationUpdate(
    latitude: number,
    longitude: number,
    speed?: number,
    heading?: number,
    accuracy?: number
  ): Promise<void> {
    if (!this.trackingToken || !this.trackingPin) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/track/${this.trackingToken}/location`,
        {
          latitude,
          longitude,
          speed,
          heading,
          accuracy,
        },
        {
          headers: {
            'X-Tracking-Token': this.trackingToken,
            'X-Tracking-Pin': this.trackingPin,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de l\'envoi de la position');
      }
    } catch (error: any) {
      console.error('Error sending location:', error);
      throw new Error(
        error.response?.data?.message || 'Impossible d\'envoyer la position GPS'
      );
    }
  }

  /**
   * Démarrer le tracking GPS automatique
   */
  async startLocationTracking(
    onLocationUpdate?: (location: Location.LocationObject) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (this.isTracking) {
      console.log('Tracking already active');
      return;
    }

    try {
      // Demander les permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission de localisation refusée');
      }

      // Démarrer le tracking
      this.locationWatchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // 5 secondes
          distanceInterval: 10, // 10 mètres
        },
        async (location) => {
          try {
            // Envoyer la position au serveur
            await this.sendLocationUpdate(
              location.coords.latitude,
              location.coords.longitude,
              location.coords.speed ?? undefined,
              location.coords.heading ?? undefined,
              location.coords.accuracy ?? undefined
            );

            // Callback pour mise à jour locale
            if (onLocationUpdate) {
              onLocationUpdate(location);
            }
          } catch (error: any) {
            console.error('Error in location callback:', error);
            if (onError) {
              onError(error.message);
            }
          }
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error: any) {
      console.error('Error starting location tracking:', error);
      if (onError) {
        onError(error.message);
      }
      throw error;
    }
  }

  /**
   * Arrêter le tracking GPS
   */
  stopLocationTracking(): void {
    if (this.locationWatchId) {
      this.locationWatchId.remove();
      this.locationWatchId = null;
      this.isTracking = false;
      console.log('Location tracking stopped');
    }
  }

  /**
   * Vérifier si le tracking est actif
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Signaler un problème
   */
  async reportIssue(
    type: string,
    description: string,
    photos?: string[],
    latitude?: number,
    longitude?: number
  ): Promise<void> {
    if (!this.trackingToken || !this.trackingPin) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/track/${this.trackingToken}/report-issue`,
        {
          type,
          description,
          photos,
          latitude,
          longitude,
        },
        {
          headers: {
            'X-Tracking-Token': this.trackingToken,
            'X-Tracking-Pin': this.trackingPin,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors du signalement');
      }
    } catch (error: any) {
      console.error('Error reporting issue:', error);
      throw new Error(
        error.response?.data?.message || 'Impossible de signaler le problème'
      );
    }
  }

  /**
   * Récupérer les problèmes signalés
   */
  async getIssues(): Promise<any[]> {
    if (!this.trackingToken || !this.trackingPin) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/track/${this.trackingToken}/issues`,
        {
          headers: {
            'X-Tracking-Token': this.trackingToken,
            'X-Tracking-Pin': this.trackingPin,
          },
        }
      );

      if (response.data.success) {
        return response.data.data.issues;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching issues:', error);
      return [];
    }
  }

  /**
   * Valider la livraison avec le QR code
   */
  async validateDelivery(qrCodeData: string, latitude?: number, longitude?: number): Promise<void> {
    try {
      // Extraire le token et mission_id du QR code
      const url = new URL(qrCodeData);
      const token = url.searchParams.get('token');
      const missionId = url.searchParams.get('mission_id');

      if (!token || !missionId) {
        throw new Error('QR code invalide');
      }

      const params = new URLSearchParams({
        token,
        mission_id: missionId,
      });

      if (latitude) params.append('latitude', latitude.toString());
      if (longitude) params.append('longitude', longitude.toString());

      const response = await axios.get(
        `${API_BASE_URL}/delivery-proof?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la validation');
      }
    } catch (error: any) {
      console.error('Error validating delivery:', error);
      throw new Error(
        error.response?.data?.message || 'Impossible de valider la livraison'
      );
    }
  }

  /**
   * Calculer la distance entre deux points (en mètres)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const driverTrackingService = new DriverTrackingService();
export default driverTrackingService;
