/**
 * Environment configuration types for TSA Driver App
 *
 * These types ensure type safety when accessing environment variables
 * throughout the application.
 */

/**
 * Available environments
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Location accuracy levels supported by Expo Location
 */
export type LocationAccuracy =
  | 'lowest'
  | 'low'
  | 'balanced'
  | 'high'
  | 'highest'
  | 'bestForNavigation';

/**
 * Complete environment configuration interface
 * All fields are required to ensure no missing configuration
 */
export interface EnvironmentConfig {
  // Environment
  env: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;

  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;

  // Google Maps
  googleMapsApiKey: string;
  googleMapsMapId: string | null;

  // Location Tracking
  locationUpdateInterval: number;
  locationDistanceFilter: number;
  locationAccuracy: LocationAccuracy;

  // Debugging
  debugMode: boolean;
  debugTracking: boolean;
  debugApi: boolean;

  // Security
  enableSsl: boolean;

  // App Info
  appName: string;
  appVersion: string;

  // Feature Flags
  enableSimulation: boolean;
  enableIssueReporting: boolean;
  enableQrValidation: boolean;
}

/**
 * Raw environment variables from process.env / Constants
 * These are the values before parsing and transformation
 */
export interface RawEnvironmentVariables {
  EXPO_PUBLIC_ENV?: string;
  EXPO_PUBLIC_API_BASE_URL?: string;
  EXPO_PUBLIC_API_TIMEOUT?: string;
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
  EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID?: string;
  EXPO_PUBLIC_LOCATION_UPDATE_INTERVAL?: string;
  EXPO_PUBLIC_LOCATION_DISTANCE_FILTER?: string;
  EXPO_PUBLIC_LOCATION_ACCURACY?: string;
  EXPO_PUBLIC_DEBUG_MODE?: string;
  EXPO_PUBLIC_DEBUG_TRACKING?: string;
  EXPO_PUBLIC_DEBUG_API?: string;
  EXPO_PUBLIC_ENABLE_SSL?: string;
  EXPO_PUBLIC_APP_NAME?: string;
  EXPO_PUBLIC_APP_VERSION?: string;
  EXPO_PUBLIC_ENABLE_SIMULATION?: string;
  EXPO_PUBLIC_ENABLE_ISSUE_REPORTING?: string;
  EXPO_PUBLIC_ENABLE_QR_VALIDATION?: string;
}

/**
 * Environment validation error
 */
export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVariables: string[]
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}
