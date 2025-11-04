/**
 * ETA Utilities
 * Helpers for calculating and formatting ETA with real-time Google Maps traffic data
 */

import { GoogleMapsService } from '@/services/google-maps.service';

export interface ETAData {
  distance: number; // in km
  baseTime: number; // in minutes (without traffic)
  durationInTraffic?: number; // in minutes (with real-time traffic)
  trafficDelay?: number; // in minutes
  eta: Date;
  etaWithTraffic?: Date;
  confidence: 'high' | 'medium' | 'low';
}

export interface DetailedETAData {
  distance: number;
  baseTime: number;
  bestCase: {
    duration: number;
    eta: Date;
  };
  realistic: {
    duration: number;
    eta: Date;
    trafficDelay?: number;
  };
  worstCase: {
    duration: number;
    eta: Date;
  };
}

/**
 * Calculate ETA with real-time traffic using Google Maps
 */
export async function calculateETAWithTraffic(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  departureTime?: Date
): Promise<ETAData | null> {
  try {
    const mapsService = new GoogleMapsService();
    const result = await mapsService.calculateDistanceWithDirections(origin, destination, {
      departureTime: departureTime || new Date(),
      trafficModel: 'best_guess',
    });

    if (!result) return null;

    const { distance, duration, durationInTraffic } = result;
    const now = departureTime || new Date();

    // Calculate ETAs
    const eta = new Date(now);
    eta.setMinutes(eta.getMinutes() + duration);

    const etaWithTraffic = durationInTraffic ? new Date(now) : undefined;
    if (etaWithTraffic && durationInTraffic) {
      etaWithTraffic.setMinutes(etaWithTraffic.getMinutes() + durationInTraffic);
    }

    // Calculate traffic delay
    const trafficDelay =
      durationInTraffic && durationInTraffic > duration ? durationInTraffic - duration : undefined;

    // Determine confidence based on traffic delay
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (trafficDelay) {
      if (trafficDelay > 30) confidence = 'low';
      else if (trafficDelay > 15) confidence = 'medium';
    }

    return {
      distance,
      baseTime: duration,
      durationInTraffic,
      trafficDelay,
      eta,
      etaWithTraffic,
      confidence,
    };
  } catch (error) {
    console.error('Error calculating ETA with traffic:', error);
    return null;
  }
}

/**
 * Get detailed ETA with best/worst case scenarios
 */
export async function getDetailedETA(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  departureTime?: Date
): Promise<DetailedETAData | null> {
  try {
    const mapsService = new GoogleMapsService();
    const result = await mapsService.getETAWithTraffic(origin, destination, departureTime);

    if (!result) return null;

    return result;
  } catch (error) {
    console.error('Error getting detailed ETA:', error);
    return null;
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}min`;
  }

  return `${hours}h ${mins}min`;
}

/**
 * Format ETA time
 */
export function formatETA(eta: Date): string {
  return eta.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format ETA with date if not today
 */
export function formatETAWithDate(eta: Date): string {
  const today = new Date();
  const isSameDay =
    eta.getDate() === today.getDate() &&
    eta.getMonth() === today.getMonth() &&
    eta.getFullYear() === today.getFullYear();

  if (isSameDay) {
    return formatETA(eta);
  }

  return eta.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get traffic condition label
 */
export function getTrafficCondition(trafficDelay?: number): {
  label: string;
  color: string;
  severity: 'none' | 'light' | 'moderate' | 'heavy';
} {
  if (!trafficDelay || trafficDelay <= 0) {
    return {
      label: 'Fluide',
      color: 'text-green-600',
      severity: 'none',
    };
  }

  if (trafficDelay <= 10) {
    return {
      label: 'Trafic léger',
      color: 'text-yellow-600',
      severity: 'light',
    };
  }

  if (trafficDelay <= 30) {
    return {
      label: 'Trafic modéré',
      color: 'text-orange-600',
      severity: 'moderate',
    };
  }

  return {
    label: 'Trafic dense',
    color: 'text-red-600',
    severity: 'heavy',
  };
}

/**
 * Calculate time remaining until ETA
 */
export function getTimeRemaining(eta: Date): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  formatted: string;
} {
  const now = new Date();
  const diff = eta.getTime() - now.getTime();
  const totalMinutes = Math.max(0, Math.round(diff / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${minutes}min`;
  } else {
    formatted = `${minutes}min`;
  }

  return {
    hours,
    minutes,
    totalMinutes,
    formatted,
  };
}

/**
 * Check if ETA is delayed based on original estimate
 */
export function isDelayed(
  originalETA: Date,
  currentETA: Date,
  thresholdMinutes: number = 15
): boolean {
  const diff = currentETA.getTime() - originalETA.getTime();
  const delayMinutes = Math.round(diff / 60000);
  return delayMinutes > thresholdMinutes;
}

/**
 * Get delay message for notifications
 */
export function getDelayMessage(trafficDelay: number): string {
  if (trafficDelay <= 0) return '';

  if (trafficDelay <= 10) {
    return `Léger retard de ${trafficDelay} minutes dû au trafic`;
  }

  if (trafficDelay <= 30) {
    return `Retard modéré de ${trafficDelay} minutes dû au trafic`;
  }

  return `Retard important de ${trafficDelay} minutes dû au trafic`;
}
