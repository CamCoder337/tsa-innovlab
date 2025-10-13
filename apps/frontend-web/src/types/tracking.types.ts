// Unified tracking status type
export type TrackingStatus =
  | 'pending'
  | 'in_transit'
  | 'delayed'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'returned';

export interface TrackingPoint {
  lat: number;
  lng: number;
  timestamp: string;
  status: TrackingStatus;
  speed?: number;
  batteryLevel?: number;
  address?: string;
  city?: string;
  country?: string;
  eventDescription?: string;
}

export interface WeatherData {
  condition: 'clear' | 'partly_cloudy' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'snow';
  description: string;
  temperature: number; // Celsius
  feelsLike: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  precipitation: number; // mm
  humidity: number; // percentage
  visibility: number; // km
  uvIndex: number;
  icon: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  impactOnDelivery?: string;
}

export interface TrafficData {
  severity: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'blocked';
  speedKmh: number;
  averageSpeedKmh: number;
  delayMinutes: number;
  incidentType?: 'accident' | 'roadwork' | 'congestion' | 'checkpoint' | 'closure';
  incidentDescription?: string;
  alternativeRoutesAvailable: boolean;
  estimatedClearanceTime?: string;
}

export interface RoadCheckpoint {
  id: string;
  type: 'police' | 'customs' | 'toll' | 'weighstation' | 'border';
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  averageWaitTime: number; // minutes
  currentWaitTime?: number; // minutes
  operatingHours: string;
  requirements?: string[];
  isPassed: boolean;
  passedTime?: string;
}

export interface RouteSegment {
  id: string;
  start: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  end: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  distance: number; // in meters
  duration: number; // in seconds
  trafficDelay?: number; // in seconds
  weatherConditions?: WeatherData;
  trafficData?: TrafficData;
  alerts?: TrackingAlert[];
  checkpoints?: RoadCheckpoint[];
  terrainType?: 'highway' | 'urban' | 'rural' | 'mountain';
  roadQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TrackingAlert {
  id: string;
  type:
    | 'delay'
    | 'route_change'
    | 'weather'
    | 'checkpoint'
    | 'traffic'
    | 'mechanical'
    | 'custom'
    | 'delivery_soon';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  estimatedDelay?: number; // in minutes
  delayProbability?: number; // 0-100%
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  actionRequired?: boolean;
  actionLabel?: string;
  actionUrl?: string;
  icon?: string;
  isRead?: boolean;
  canDismiss?: boolean;
}

export interface PredictiveETA {
  baseETA: string; // Without traffic/weather
  currentETA: string; // With current conditions
  optimisticETA: string; // Best case
  pessimisticETA: string; // Worst case
  confidence: number; // 0-100%
  delayRisk: {
    probability: number; // 0-100%
    primaryReasons: Array<{
      reason: string;
      impact: number; // minutes
      probability: number; // 0-100%
    }>;
    totalEstimatedDelay: number; // minutes
  };
  factors: Array<{
    type: 'traffic' | 'weather' | 'checkpoint' | 'route' | 'driver';
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    impactMinutes: number;
  }>;
}

export interface DriverProximity {
  distanceToDestination: number; // meters
  estimatedArrivalMinutes: number;
  isNearby: boolean; // within 1km
  isApproaching: boolean; // within 5km
  currentSpeed: number; // km/h
  lastLocationUpdate: string;
  bearing: number; // degrees from destination
}

export interface ShipmentDetails {
  trackingNumber: string;
  status: TrackingStatus;
  origin: {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  destination: {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
    timestamp: string;
  };
  estimatedDelivery: {
    earliest: string;
    latest: string;
    confidence: number; // 0-100%
  };
  carrier: {
    name: string;
    contact: string;
    vehicle: string;
    driver: {
      name: string;
      phone: string;
      rating: number;
      photo?: string;
    };
  };
  history: TrackingPoint[];
  route: RouteSegment[];
  alerts: TrackingAlert[];
  packageInfo: {
    weight: number; // in kg
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    description: string;
    value: number;
    items: Array<{
      description: string;
      quantity: number;
      value: number;
    }>;
  };
  lastUpdated: string;
  estimatedRouteDuration: number; // in seconds
  distanceTraveled: number; // in meters
  distanceRemaining: number; // in meters
  progress: number; // 0-100%
  speed: number; // km/h
  nextCheckpoint?: {
    name: string;
    type: 'warehouse' | 'distribution_center' | 'customs' | 'delivery_point';
    estimatedArrival: string;
    address: string;
    contact?: string;
  };
  // Enhanced predictive features
  predictiveETA?: PredictiveETA;
  driverProximity?: DriverProximity;
  currentWeather?: WeatherData;
  currentTraffic?: TrafficData;
  roadCheckpoints?: RoadCheckpoint[];
}

// Store types for Zustand state management
export interface TrackingState {
  currentTracking: ShipmentDetails | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface TrackingActions {
  setCurrentTracking: (tracking: ShipmentDetails | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: string) => void;
  clearTracking: () => void;
}

export type TrackingStore = TrackingState & TrackingActions;

// Legacy types for API compatibility (may be deprecated in future)
export interface TrackingEvent {
  id: string;
  trackingId: string;
  status: TrackingStatus;
  location: string;
  description: string;
  eventDate: string;
  isMilestone: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentTracking {
  id: string;
  trackingNumber: string;
  carrier: string;
  status: TrackingStatus;
  origin: string;
  destination: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface GoogleMapsTrafficResponse {
  routes: Array<{
    legs: Array<{
      duration_in_traffic?: {
        text: string;
        value: number;
      };
      steps: Array<{
        distance: {
          text: string;
          value: number;
        };
        duration: {
          text: string;
          value: number;
        };
        end_location: {
          lat: number;
          lng: number;
        };
        polyline: {
          points: string;
        };
        start_location: {
          lat: number;
          lng: number;
        };
        travel_mode: string;
        html_instructions: string;
      }>;
    }>;
  }>;
  status: string;
}
