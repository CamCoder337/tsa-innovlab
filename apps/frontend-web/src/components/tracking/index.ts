// Export des composants de tracking
export { default as TrackingDashboard } from '../../pages/tracking/TrackingDashboard';
export { default as TrackingMap } from './TrackingMap';
export { default as MissionTrackingMap } from './MissionTrackingMap';
export { default as TrackingExample } from './TrackingExample';
export { default as AffréteurTrackingDashboard } from '../../pages/tracking/AffréteurTrackingDashboard';
export { default as TransporteurTrackingDashboard } from '../../pages/tracking/TransporteurTrackingDashboard';
export { default as AdminTrackingDashboard } from '../../pages/tracking/AdminTrackingDashboard';

// Export des services
export { default as GoogleMapsService } from '@/services/google-maps.service';
export { default as GeolocationService } from '@/services/geolocation.service';
export { trackingService } from '@/services/tracking.service';
// Export des types
export type { MarkerData, MapConfig } from '@/services/google-maps.service';
export type { GeolocationPosition, GeolocationOptions } from '@/services/geolocation.service';
export type { TrackingConfig, PositionUpdate } from '@/services/tracking.service';

// Export des données de test
export * from '@/data/mock-tracking';
