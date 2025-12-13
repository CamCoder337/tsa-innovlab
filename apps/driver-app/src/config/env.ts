/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  TSA Driver App - Environment Configuration System                        ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 *
 * Système centralisé de gestion des variables d'environnement avec :
 * - Type safety complet
 * - Validation au démarrage
 * - Fallbacks intelligents
 * - Support multi-environnements (dev, staging, prod)
 * - Logging détaillé en mode debug
 *
 * IMPORTANT: Ne jamais accéder directement à process.env ou Constants.expoConfig
 * dans votre code. Toujours utiliser les getters de ce fichier ou l'objet `env`.
 *
 * @example
 * ```typescript
 * import { getApiBaseUrl, env } from '@/config/env';
 *
 * // Option 1: Fonction directe
 * const apiUrl = getApiBaseUrl();
 *
 * // Option 2: Via l'objet env
 * const apiUrl = env.apiBaseUrl();
 *
 * // Option 3: Configuration complète
 * const config = env.getConfig();
 * console.log(config.apiBaseUrl, config.debugMode);
 * ```
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type {
  Environment,
  LocationAccuracy,
  EnvironmentConfig,
  RawEnvironmentVariables,
  EnvironmentValidationError,
} from './environment.types';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default values used as fallbacks when environment variables are not set
 */
const DEFAULTS = {
  ENV: 'development' as Environment,
  API_BASE_URL: 'http://localhost:3333',
  API_TIMEOUT: 30000,
  GOOGLE_MAPS_API_KEY: '',
  LOCATION_UPDATE_INTERVAL: 5000,
  LOCATION_DISTANCE_FILTER: 10,
  LOCATION_ACCURACY: 'bestForNavigation' as LocationAccuracy,
  DEBUG_MODE: true,
  DEBUG_TRACKING: true,
  DEBUG_API: true,
  ENABLE_SSL: false,
  APP_NAME: 'TSA Driver',
  APP_VERSION: '1.0.0',
  ENABLE_SIMULATION: false,
  ENABLE_ISSUE_REPORTING: true,
  ENABLE_QR_VALIDATION: true,
} as const;

/**
 * Detect local IP address automatically for iOS Simulator
 * Falls back to localhost if detection fails
 */
function getLocalIpAddress(): string {
  try {
    // Try to get local IP from Expo Constants (auto-detected)
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3333`;
      }
    }
  } catch (error) {
    console.warn('Failed to detect local IP, falling back to localhost');
  }
  return 'http://localhost:3333';
}

/**
 * Platform-specific API base URLs for development
 * iOS automatically detects your machine's IP address
 */
const PLATFORM_DEFAULTS = {
  android: 'http://10.0.2.2:3333', // Android Emulator
  ios: getLocalIpAddress(), // iOS Simulator - Auto-detected!
  web: 'http://localhost:3333', // Web
  default: 'http://localhost:3333',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get raw environment variable from multiple sources with priority:
 * 1. expo-constants extra config (from app.json extra field)
 * 2. process.env (from .env file)
 * 3. Default value
 */
function getEnvVar(key: keyof RawEnvironmentVariables): string | undefined {
  // Try expo-constants first (highest priority)
  const expoValue = Constants.expoConfig?.extra?.[key];
  if (expoValue !== undefined && expoValue !== null && expoValue !== '') {
    return String(expoValue);
  }

  // Try process.env (with safe check for React Native)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const envValue = process.env[key];
      if (envValue !== undefined && envValue !== null && envValue !== '') {
        return String(envValue);
      }
    }
  } catch (error) {
    // process.env not available in this environment, skip
  }

  return undefined;
}

/**
 * Parse string value to boolean
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const normalized = value.toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * Parse string value to number
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate environment and return typed value
 */
function parseEnvironment(value: string | undefined): Environment {
  const normalized = value?.toLowerCase().trim();
  if (normalized === 'production' || normalized === 'prod') return 'production';
  if (normalized === 'staging' || normalized === 'stage') return 'staging';
  return 'development';
}

/**
 * Get platform-specific API URL if in development and no explicit URL is set
 */
function getPlatformDefaultApiUrl(env: Environment): string {
  if (env !== 'development') {
    return DEFAULTS.API_BASE_URL;
  }

  return Platform.select({
    android: PLATFORM_DEFAULTS.android,
    ios: PLATFORM_DEFAULTS.ios,
    web: PLATFORM_DEFAULTS.web,
    default: PLATFORM_DEFAULTS.default,
  })!;
}

/**
 * Normalize URL by removing trailing slash
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT GETTERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get current environment (development, staging, or production)
 */
export function getEnvironment(): Environment {
  const env = getEnvVar('EXPO_PUBLIC_ENV');
  return parseEnvironment(env);
}

/**
 * Check if app is running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development' || __DEV__;
}

/**
 * Check if app is running in staging mode
 */
export function isStaging(): boolean {
  return getEnvironment() === 'staging';
}

/**
 * Check if app is running in production mode
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production' && !__DEV__;
}

// ═══════════════════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get API base URL
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_BASE_URL from app.json extra or .env
 * 2. Platform-specific default (if in development)
 * 3. Generic default
 */
export function getApiBaseUrl(): string {
  const envUrl = getEnvVar('EXPO_PUBLIC_API_BASE_URL');

  if (envUrl) {
    return normalizeUrl(envUrl);
  }

  const env = getEnvironment();
  return normalizeUrl(getPlatformDefaultApiUrl(env));
}

/**
 * Get API request timeout in milliseconds
 */
export function getApiTimeout(): number {
  const timeout = getEnvVar('EXPO_PUBLIC_API_TIMEOUT');
  return parseNumber(timeout, DEFAULTS.API_TIMEOUT);
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE MAPS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Google Maps API key
 */
export function getGoogleMapsApiKey(): string {
  return getEnvVar('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY') || DEFAULTS.GOOGLE_MAPS_API_KEY;
}

/**
 * Get Google Maps Map ID (optional)
 */
export function getGoogleMapsMapId(): string | null {
  const mapId = getEnvVar('EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID');
  return mapId || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION TRACKING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get location update interval in milliseconds
 */
export function getLocationUpdateInterval(): number {
  const interval = getEnvVar('EXPO_PUBLIC_LOCATION_UPDATE_INTERVAL');
  return parseNumber(interval, DEFAULTS.LOCATION_UPDATE_INTERVAL);
}

/**
 * Get location distance filter in meters
 */
export function getLocationDistanceFilter(): number {
  const distance = getEnvVar('EXPO_PUBLIC_LOCATION_DISTANCE_FILTER');
  return parseNumber(distance, DEFAULTS.LOCATION_DISTANCE_FILTER);
}

/**
 * Get location accuracy level
 */
export function getLocationAccuracy(): LocationAccuracy {
  const accuracy = getEnvVar('EXPO_PUBLIC_LOCATION_ACCURACY');
  const validAccuracies: LocationAccuracy[] = [
    'lowest',
    'low',
    'balanced',
    'high',
    'highest',
    'bestForNavigation',
  ];

  if (accuracy && validAccuracies.includes(accuracy as LocationAccuracy)) {
    return accuracy as LocationAccuracy;
  }

  return DEFAULTS.LOCATION_ACCURACY;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBUGGING & LOGGING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  const debug = getEnvVar('EXPO_PUBLIC_DEBUG_MODE');
  return parseBoolean(debug, DEFAULTS.DEBUG_MODE && isDevelopment());
}

/**
 * Check if tracking debug logs are enabled
 */
export function isDebugTracking(): boolean {
  const debug = getEnvVar('EXPO_PUBLIC_DEBUG_TRACKING');
  return parseBoolean(debug, DEFAULTS.DEBUG_TRACKING && isDevelopment());
}

/**
 * Check if API debug logs are enabled
 */
export function isDebugApi(): boolean {
  const debug = getEnvVar('EXPO_PUBLIC_DEBUG_API');
  return parseBoolean(debug, DEFAULTS.DEBUG_API && isDevelopment());
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if SSL/TLS is enabled
 */
export function isSSLEnabled(): boolean {
  const ssl = getEnvVar('EXPO_PUBLIC_ENABLE_SSL');
  return parseBoolean(ssl, DEFAULTS.ENABLE_SSL);
}

// ═══════════════════════════════════════════════════════════════════════════
// APP INFORMATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get app name
 */
export function getAppName(): string {
  return (
    getEnvVar('EXPO_PUBLIC_APP_NAME') ||
    Constants.expoConfig?.name ||
    DEFAULTS.APP_NAME
  );
}

/**
 * Get app version
 */
export function getAppVersion(): string {
  return (
    getEnvVar('EXPO_PUBLIC_APP_VERSION') ||
    Constants.expoConfig?.version ||
    DEFAULTS.APP_VERSION
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if simulation mode is enabled
 */
export function isSimulationEnabled(): boolean {
  const simulation = getEnvVar('EXPO_PUBLIC_ENABLE_SIMULATION');
  return parseBoolean(simulation, DEFAULTS.ENABLE_SIMULATION);
}

/**
 * Check if issue reporting is enabled
 */
export function isIssueReportingEnabled(): boolean {
  const reporting = getEnvVar('EXPO_PUBLIC_ENABLE_ISSUE_REPORTING');
  return parseBoolean(reporting, DEFAULTS.ENABLE_ISSUE_REPORTING);
}

/**
 * Check if QR validation is enabled
 */
export function isQrValidationEnabled(): boolean {
  const qr = getEnvVar('EXPO_PUBLIC_ENABLE_QR_VALIDATION');
  return parseBoolean(qr, DEFAULTS.ENABLE_QR_VALIDATION);
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get complete environment configuration as a single object
 * This is useful for debugging and for passing config to services
 */
export function getConfig(): EnvironmentConfig {
  return {
    // Environment
    env: getEnvironment(),
    isDevelopment: isDevelopment(),
    isStaging: isStaging(),
    isProduction: isProduction(),

    // API
    apiBaseUrl: getApiBaseUrl(),
    apiTimeout: getApiTimeout(),

    // Google Maps
    googleMapsApiKey: getGoogleMapsApiKey(),
    googleMapsMapId: getGoogleMapsMapId(),

    // Location Tracking
    locationUpdateInterval: getLocationUpdateInterval(),
    locationDistanceFilter: getLocationDistanceFilter(),
    locationAccuracy: getLocationAccuracy(),

    // Debugging
    debugMode: isDebugMode(),
    debugTracking: isDebugTracking(),
    debugApi: isDebugApi(),

    // Security
    enableSsl: isSSLEnabled(),

    // App Info
    appName: getAppName(),
    appVersion: getAppVersion(),

    // Feature Flags
    enableSimulation: isSimulationEnabled(),
    enableIssueReporting: isIssueReportingEnabled(),
    enableQrValidation: isQrValidationEnabled(),
  };
}

/**
 * Log environment configuration (useful for debugging)
 * Only logs in debug mode
 */
export function logEnvironmentConfig(): void {
  if (!isDebugMode()) return;

  const config = getConfig();

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  TSA Driver App - Environment Configuration                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🌍 Environment:', config.env);
  console.log('📱 Platform:', Platform.OS);
  console.log('');
  console.log('🔌 API Configuration:');
  console.log(`   Base URL: ${config.apiBaseUrl}`);
  console.log(`   Timeout: ${config.apiTimeout}ms`);
  console.log('');
  console.log('🗺️  Google Maps:');
  console.log(`   API Key: ${config.googleMapsApiKey ? '✓ Set' : '✗ Not Set'}`);
  console.log(`   Map ID: ${config.googleMapsMapId || 'Not Set'}`);
  console.log('');
  console.log('📍 Location Tracking:');
  console.log(`   Update Interval: ${config.locationUpdateInterval}ms`);
  console.log(`   Distance Filter: ${config.locationDistanceFilter}m`);
  console.log(`   Accuracy: ${config.locationAccuracy}`);
  console.log('');
  console.log('🐛 Debug Flags:');
  console.log(`   Debug Mode: ${config.debugMode ? '✓' : '✗'}`);
  console.log(`   Debug Tracking: ${config.debugTracking ? '✓' : '✗'}`);
  console.log(`   Debug API: ${config.debugApi ? '✓' : '✗'}`);
  console.log('');
  console.log('🔐 Security:');
  console.log(`   SSL Enabled: ${config.enableSsl ? '✓' : '✗'}`);
  console.log('');
  console.log('🎯 Feature Flags:');
  console.log(`   Simulation: ${config.enableSimulation ? '✓' : '✗'}`);
  console.log(`   Issue Reporting: ${config.enableIssueReporting ? '✓' : '✗'}`);
  console.log(`   QR Validation: ${config.enableQrValidation ? '✓' : '✗'}`);
  console.log('');
  console.log('════════════════════════════════════════════════════════════════════════════');
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main environment object with all getters
 * Use this for cleaner imports in your code
 *
 * @example
 * ```typescript
 * import { env } from '@/config/env';
 *
 * const apiUrl = env.apiBaseUrl();
 * const config = env.getConfig();
 * ```
 */
export const env = {
  // Environment
  environment: getEnvironment,
  isDevelopment,
  isStaging,
  isProduction,

  // API
  apiBaseUrl: getApiBaseUrl,
  apiTimeout: getApiTimeout,

  // Google Maps
  googleMapsApiKey: getGoogleMapsApiKey,
  googleMapsMapId: getGoogleMapsMapId,

  // Location
  locationUpdateInterval: getLocationUpdateInterval,
  locationDistanceFilter: getLocationDistanceFilter,
  locationAccuracy: getLocationAccuracy,

  // Debugging
  debugMode: isDebugMode,
  debugTracking: isDebugTracking,
  debugApi: isDebugApi,

  // Security
  sslEnabled: isSSLEnabled,

  // App Info
  appName: getAppName,
  appVersion: getAppVersion,

  // Feature Flags
  simulationEnabled: isSimulationEnabled,
  issueReportingEnabled: isIssueReportingEnabled,
  qrValidationEnabled: isQrValidationEnabled,

  // Utils
  getConfig,
  logConfig: logEnvironmentConfig,
} as const;

// Export default for convenience
export default env;
