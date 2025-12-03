/**
 * Shared types for GPS tracking functionality
 * Used across driver-app and frontend-web
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationUpdate extends LocationCoordinates {
  id: string;
  missionId: string;
  driverId?: string;
  speed?: number; // m/s
  heading?: number; // degrees (0-360)
  accuracy?: number; // meters
  timestamp: string; // ISO 8601
}

export interface DriverPosition extends LocationCoordinates {
  deviceId: string;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface Address extends LocationCoordinates {
  id: string;
  label: string;
  street?: string;
  city: string;
  postalCode?: string;
  country: string;
  formatted_address?: string;
}

export interface MissionAddress extends LocationCoordinates {
  id: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  label?: string;
}

export type IssueType = 'breakdown' | 'delay' | 'accident' | 'traffic' | 'other';

export type IssueStatus = 'reported' | 'acknowledged' | 'resolved';

export interface MissionIssue {
  id: string;
  missionId: string;
  reportedById: string;
  type: IssueType;
  description: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
  status: IssueStatus;
  createdAt: string;
  resolvedAt?: string;
}

export type MissionStatus =
  | 'draft'
  | 'published'
  | 'assigned'
  | 'ready_to_start'
  | 'in_progress'
  | 'delivered'
  | 'paid'
  | 'completed'
  | 'cancelled';

export interface MissionDetails {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  departureAddress: MissionAddress;
  arrivalAddress: MissionAddress;
  estimatedDeparture?: string;
  estimatedArrival?: string;
  transporter?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  currentPosition?: LocationCoordinates;
}

export interface TrackingCredentials {
  trackingToken: string;
  trackingPin: string;
  qrCodeToken?: string;
}

export interface RouteInfo {
  distance: number; // km
  duration: number; // minutes (base time without traffic)
  durationInTraffic?: number; // minutes (with real-time traffic)
  trafficDelay?: number; // minutes
  eta: Date;
  etaWithTraffic?: Date;
}
