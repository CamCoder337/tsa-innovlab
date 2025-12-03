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
  private trackingToken: string | null = null;
  private trackingPin: string | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking: boolean = false;

  async authenticate(token: string, pin: string): Promise<MissionDetails> {
    try {
      const response = await axios.post(`${API_BASE_URL}/track/${token}/authenticate`, { pin });

      if (response.status === 200 && response.data.success) {
        this.trackingToken = token;
        this.trackingPin = pin;
        await AsyncStorage.multiSet([
            ['tracking_token', token],
            ['tracking_pin', pin]
        ]);
        console.log('Authentication successful and credentials saved.');
        return response.data.data.mission;
      } else {
        throw new Error(response.data.message || 'Authentication failed');
      }
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        console.error('Authentication error:', errorMessage);
        throw new Error(errorMessage);
    }
  }

  async getSavedCredentials(): Promise<{ token: string; pin: string } | null> {
     try {
      const token = await AsyncStorage.getItem('tracking_token');
      const pin = await AsyncStorage.getItem('tracking_pin');

      if (token && pin) {
        // Re-initialize the service with the saved credentials
        this.trackingToken = token;
        this.trackingPin = pin;
        return { token, pin };
      }
      return null;
    } catch (error) {
      console.error('Error retrieving saved credentials:', error);
      return null;
    }
  }

  async clearCredentials(): Promise<void> {
    await AsyncStorage.multiRemove(['tracking_token', 'tracking_pin']);
    this.trackingToken = null;
    this.trackingPin = null;
  }

  async sendLocationUpdate(
    location: Location.LocationObject
  ): Promise<void> {
    if (!this.trackingToken || !this.trackingPin) {
      console.warn('Skipping location update: not authenticated.');
      return;
    }

    try {
      const url = `${API_BASE_URL}/track/${this.trackingToken}/location`;
      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed,
        heading: location.coords.heading,
        accuracy: location.coords.accuracy,
      };

      await axios.post(url, payload, {
        headers: {
          'X-Tracking-Token': this.trackingToken,
          'X-Tracking-Pin': this.trackingPin,
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
  
  async reportIssue(
    type: string,
    description: string,
    photos?: string[],
    latitude?: number,
    longitude?: number
  ): Promise<void> {
    if (!this.trackingToken || !this.trackingPin) {
      throw new Error('Not authenticated for reporting an issue.');
    }

    try {
      const url = `${API_BASE_URL}/track/${this.trackingToken}/report-issue`;
      const payload = {
        type,
        description,
        photos,
        latitude,
        longitude,
      };

      await axios.post(url, payload, {
        headers: {
          'X-Tracking-Token': this.trackingToken,
          'X-Tracking-Pin': this.trackingPin,
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


  async validateDelivery(qrCodeData: string, latitude?: number, longitude?: number): Promise<void> {
    try {
      const url = new URL(qrCodeData);
      const token = url.searchParams.get('token');
      const missionId = url.searchParams.get('mission_id');

      if (!token || !missionId) {
        throw new Error('Invalid QR code data.');
      }
      
      const validationUrl = `${API_BASE_URL}/delivery-proof?token=${token}&mission_id=${missionId}`;
      const response = await axios.get(validationUrl);

      if (response.status !== 200 || !response.data.success) {
         throw new Error(response.data.message || 'Delivery validation failed');
      }
      console.log('Delivery validated successfully');

    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred during validation';
        console.error('validateDelivery error:', errorMessage);
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
