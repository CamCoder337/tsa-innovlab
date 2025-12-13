import axios from 'axios';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../config/env';

// Use centralized environment configuration
const API_BASE_URL = env.apiBaseUrl();
const API_TIMEOUT = env.apiTimeout();
const LOCATION_UPDATE_INTERVAL = env.locationUpdateInterval();
const LOCATION_DISTANCE_FILTER = env.locationDistanceFilter();
const LOCATION_ACCURACY_MAP = {
  lowest: Location.Accuracy.Lowest,
  low: Location.Accuracy.Low,
  balanced: Location.Accuracy.Balanced,
  high: Location.Accuracy.High,
  highest: Location.Accuracy.Highest,
  bestForNavigation: Location.Accuracy.BestForNavigation,
} as const;

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
    fullAddress?: string;
  };
  arrivalAddress: {
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    fullAddress?: string;
  };
  estimatedDeparture: string;
  estimatedArrival: string;
  transporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export const ISSUE_TYPES = [
  { value: 'breakdown', label: 'Panne' },
  { value: 'delay', label: 'Retard' },
  { value: 'accident', label: 'Accident' },
  { value: 'traffic', label: 'Embouteillage' },
  { value: 'other', label: 'Autre' },
];

class DriverTrackingService {
  private accessToken: string | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking: boolean = false;

  /**
   * Authenticate driver with PIN only (new JWT-based system)
   * @param pin Alphanumeric PIN (6-8 characters)
   */
  async authenticate(pin: string): Promise<MissionDetails> {
    try {
      console.log(`[Auth] Attempting authentication with PIN: ${pin.substring(0, 2)}***`);
      console.log(`[Auth] API URL: ${API_BASE_URL}/api/driver/auth/login`);
      
      const response = await axios.post(`${API_BASE_URL}/api/driver/auth/login`, { pin });

      if (response.status === 200 && response.data.success) {
        this.accessToken = response.data.data.accessToken;
        await AsyncStorage.setItem('driver_access_token', this.accessToken);
        console.log('✅ Authentication successful with JWT. Token saved.');
        return response.data.data.mission;
      } else {
        const errorMsg = response.data?.message || 'Authentication failed';
        console.error('❌ Authentication failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      // Better error handling
      let errorMessage = 'An unknown error occurred';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        console.error(`[Auth] Server error (${error.response.status}):`, errorMessage);
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Check your connection.';
        console.error('[Auth] Network error:', errorMessage);
      } else {
        // Something else happened
        errorMessage = error.message || 'An unknown error occurred';
        console.error('[Auth] Error:', errorMessage, error);
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Get saved JWT access token
   */
  async getSavedToken(): Promise<string | null> {
     try {
      const token = await AsyncStorage.getItem('driver_access_token');

      if (token) {
        // Re-initialize the service with the saved token
        this.accessToken = token;
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving saved token:', error);
      return null;
    }
  }

  /**
   * Clear saved JWT token
   */
  async clearCredentials(): Promise<void> {
    await AsyncStorage.removeItem('driver_access_token');
    this.accessToken = null;
  }

  /**
   * Send location update with mission-scoped JWT
   */
  async sendLocationUpdate(
    location: Location.LocationObject
  ): Promise<void> {
    if (!this.accessToken) {
      console.warn('Skipping location update: not authenticated.');
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/driver/tracking/location`;
      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed,
        heading: location.coords.heading,
        accuracy: location.coords.accuracy,
      };

      await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        timeout: API_TIMEOUT,
      });
      console.log(`Location updated sent: ${location.coords.latitude}, ${location.coords.longitude}`);

    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to send location update';
        console.error('sendLocationUpdate error:', errorMessage);
        // We don't throw here to avoid stopping the background tracking
    }
  }

  async startLocationTracking(
    onLocationUpdate: (location: Location.LocationObject) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (this.isTracking) {
      console.log('Tracking is already active.');
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      onError('Permission to access location was denied');
      throw new Error('Permission to access location was denied');
    }

    console.log('Starting continuous location tracking...');
    this.isTracking = true;

    const accuracyLevel = LOCATION_ACCURACY_MAP[env.locationAccuracy()];

    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: accuracyLevel,
        timeInterval: LOCATION_UPDATE_INTERVAL,
        distanceInterval: LOCATION_DISTANCE_FILTER,
      },
      (location) => {
        console.log('New location received from watcher');
        this.sendLocationUpdate(location); // Send to server
        onLocationUpdate(location); // Update UI
      }
    );
    console.log('Location watcher started.');
  }

  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      this.isTracking = false;
      console.log('Location tracking stopped.');
    }
  }

  isTrackingActive(): boolean {
    return this.isTracking;
  }
  
  /**
   * Report issue with mission-scoped JWT
   */
  async reportIssue(
    type: string,
    description: string,
    photos?: string[],
    latitude?: number,
    longitude?: number
  ): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated for reporting an issue.');
    }

    try {
      const url = `${API_BASE_URL}/api/driver/tracking/report-issue`;
      const payload = {
        type,
        description,
        photos,
        latitude,
        longitude,
      };

      await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        timeout: API_TIMEOUT,
      });
      console.log(`Issue reported: ${type}`);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to report issue';
      console.error('reportIssue error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * 🚨 SOS - Signaler une urgence
   * 
   * Types d'urgence:
   * - breakdown: Panne grave
   * - accident: Accident de la route
   * - medical: Urgence médicale
   * - security: Problème de sécurité (agression, vol)
   */
  async reportSOS(
    type: 'breakdown' | 'accident' | 'medical' | 'security',
    description?: string
  ): Promise<{ issueId: string; conversationId: number | null; emergencyContacts: Record<string, string> }> {
    if (!this.trackingToken || !this.trackingPin) {
      throw new Error('Not authenticated for SOS.');
    }

    // Obtenir la position GPS actuelle
    let latitude: number | undefined;
    let longitude: number | undefined;
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      latitude = location.coords.latitude;
      longitude = location.coords.longitude;
    } catch (error) {
      console.warn('Could not get GPS location for SOS:', error);
      // On continue quand même - le backend retournera une erreur si GPS requis
    }

    try {
      const url = `${API_BASE_URL}/track/${this.trackingToken}/sos`;
      const payload = {
        type,
        description,
        latitude,
        longitude,
      };

      const response = await axios.post(url, payload, {
        headers: {
          'X-Tracking-Token': this.trackingToken,
          'X-Tracking-Pin': this.trackingPin,
        },
        timeout: API_TIMEOUT,
      });

      console.log(`🚨 SOS sent: ${type}`);
      
      return {
        issueId: response.data.data.issue.id,
        conversationId: response.data.data.conversationId,
        emergencyContacts: response.data.data.emergencyContacts,
      };

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send SOS';
      console.error('🚨 SOS error:', errorMessage);
      
      // Retourner les contacts d'urgence même en cas d'erreur
      const emergencyContacts = error.response?.data?.emergencyContacts || {
        police: '117',
        samu: '119',
        pompiers: '118',
      };
      
      throw { message: errorMessage, emergencyContacts };
    }
  }


  /**
   * Valide seulement le QR code sans changer le statut de la mission
   * Vérifie que le chauffeur est autorisé à scanner ce QR code
   */
  async validateQRCode(qrCodeData: string, latitude?: number, longitude?: number): Promise<{ missionId: string; token: string }> {
    try {
      const url = new URL(qrCodeData);
      const token = url.searchParams.get('token');
      const missionId = url.searchParams.get('mission_id');

      if (!token || !missionId) {
        throw new Error('QR code invalide - données manquantes');
      }

      if (!this.accessToken) {
        throw new Error('Vous devez être connecté pour scanner un QR code');
      }
      
      // Nouvelle endpoint pour valider seulement le QR code sans finaliser la mission
      let validationUrl = `${API_BASE_URL}/api/driver/tracking/validate-qr?token=${token}&mission_id=${missionId}`;
      if (latitude && longitude) {
        validationUrl += `&latitude=${latitude}&longitude=${longitude}`;
      }
      
      console.log(`[QR Validation] Validating QR code for mission ${missionId}`);
      const response = await axios.get(validationUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        timeout: API_TIMEOUT,
      });

      if (response.status !== 200 || !response.data.success) {
         throw new Error(response.data.message || 'QR code validation failed');
      }
      
      console.log('✅ QR code validated successfully');
      return { missionId, token };

    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred during QR validation';
        console.error('❌ validateQRCode error:', errorMessage);
        
        // Améliorer les messages d'erreur pour l'utilisateur
        if (errorMessage.includes('not authorized')) {
          throw new Error('Vous n\'êtes pas autorisé à scanner ce QR code');
        } else if (errorMessage.includes('different mission')) {
          throw new Error('Ce QR code appartient à une autre mission');
        } else if (errorMessage.includes('Invalid QR code')) {
          throw new Error('QR code invalide ou expiré');
        }
        
        throw new Error(errorMessage);
    }
  }

  /**
   * Finalise la livraison (à appeler après validation des preuves)
   */
  async completeDelivery(missionId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Vous devez être connecté pour finaliser une mission');
    }

    try {
      const url = `${API_BASE_URL}/api/driver/tracking/complete-delivery`;
      const payload = { missionId };

      console.log(`[Complete Delivery] Completing mission ${missionId}`);
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        timeout: API_TIMEOUT,
      });

      if (response.status !== 200 || !response.data.success) {
         throw new Error(response.data.message || 'Failed to complete delivery');
      }
      
      console.log('✅ Mission completed successfully');

    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred during delivery completion';
        console.error('❌ completeDelivery error:', errorMessage);
        throw new Error(errorMessage);
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // meters
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
