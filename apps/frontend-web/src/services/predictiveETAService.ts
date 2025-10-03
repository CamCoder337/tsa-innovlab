import type {
  PredictiveETA,
  WeatherData,
  TrafficData,
  RoadCheckpoint,
} from '@/types/tracking.types';
import { analyzeWeatherRisk } from './weatherService';
import { analyzeTrafficImpact } from './trafficService';

/**
 * Predictive ETA Service - Advanced ETA calculation with risk assessment
 * Uses machine learning-like algorithms to predict delivery times and delays
 */

export interface ETAInputs {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  currentLocation: { lat: number; lng: number };
  distanceRemaining: number; // meters
  currentSpeed: number; // km/h
  weather?: WeatherData;
  traffic?: TrafficData;
  checkpoints?: RoadCheckpoint[];
  timeOfDay: number; // hour 0-23
  dayOfWeek: number; // 0-6
}

/**
 * Calculate predictive ETA with confidence levels
 */
export async function calculatePredictiveETA(inputs: ETAInputs): Promise<PredictiveETA> {
  const now = new Date();

  // Base calculation: time = distance / speed
  const baseMinutes = (inputs.distanceRemaining / 1000 / Math.max(inputs.currentSpeed, 40)) * 60;

  // Collect all delay factors
  const delayFactors: PredictiveETA['factors'] = [];
  let totalDelayMinutes = 0;

  // Weather impact
  if (inputs.weather) {
    const weatherRisk = analyzeWeatherRisk(inputs.weather);
    if (weatherRisk.estimatedDelay > 0) {
      delayFactors.push({
        type: 'weather',
        description: inputs.weather.impactOnDelivery || 'Conditions météo défavorables',
        impact: 'negative',
        impactMinutes: weatherRisk.estimatedDelay,
      });
      totalDelayMinutes += weatherRisk.estimatedDelay;
    }
  }

  // Traffic impact
  if (inputs.traffic) {
    const trafficImpact = analyzeTrafficImpact(inputs.traffic);
    if (trafficImpact.estimatedDelay > 0) {
      delayFactors.push({
        type: 'traffic',
        description: trafficImpact.recommendation,
        impact: 'negative',
        impactMinutes: trafficImpact.estimatedDelay,
      });
      totalDelayMinutes += trafficImpact.estimatedDelay;
    }
  }

  // Checkpoint delays
  if (inputs.checkpoints) {
    const upcomingCheckpoints = inputs.checkpoints.filter((cp) => !cp.isPassed);
    const checkpointDelay = upcomingCheckpoints.reduce(
      (sum, cp) => sum + (cp.currentWaitTime || cp.averageWaitTime),
      0
    );

    if (checkpointDelay > 0) {
      delayFactors.push({
        type: 'checkpoint',
        description: `${upcomingCheckpoints.length} contrôle(s) routier(s) à venir`,
        impact: 'negative',
        impactMinutes: checkpointDelay,
      });
      totalDelayMinutes += checkpointDelay;
    }
  }

  // Time of day impact (rush hours)
  const isRushHour =
    (inputs.timeOfDay >= 7 && inputs.timeOfDay <= 9) ||
    (inputs.timeOfDay >= 17 && inputs.timeOfDay <= 19);
  if (isRushHour) {
    const rushHourDelay = 10;
    delayFactors.push({
      type: 'traffic',
      description: 'Heure de pointe - Trafic dense prévu',
      impact: 'negative',
      impactMinutes: rushHourDelay,
    });
    totalDelayMinutes += rushHourDelay;
  }

  // Driver experience factor (positive impact)
  const driverExperienceBonus = 5;
  delayFactors.push({
    type: 'driver',
    description: 'Chauffeur expérimenté - Temps optimisé',
    impact: 'positive',
    impactMinutes: -driverExperienceBonus,
  });
  totalDelayMinutes -= driverExperienceBonus;

  // Calculate ETAs
  const baseETA = new Date(now.getTime() + baseMinutes * 60000);
  const currentETA = new Date(now.getTime() + (baseMinutes + totalDelayMinutes) * 60000);
  const optimisticETA = new Date(now.getTime() + (baseMinutes + totalDelayMinutes * 0.5) * 60000);
  const pessimisticETA = new Date(now.getTime() + (baseMinutes + totalDelayMinutes * 1.5) * 60000);

  // Calculate confidence based on data quality
  const dataQuality = [
    inputs.weather ? 0.2 : 0,
    inputs.traffic ? 0.3 : 0,
    inputs.checkpoints ? 0.2 : 0,
    0.3, // Base confidence
  ].reduce((a, b) => a + b, 0);

  const confidence = Math.round(dataQuality * 100);

  // Calculate delay probability
  const delayProbability = calculateDelayProbability(totalDelayMinutes);

  // Group reasons by significance
  const primaryReasons = delayFactors
    .filter((f) => f.impact === 'negative' && f.impactMinutes > 5)
    .map((f) => ({
      reason: f.description,
      impact: f.impactMinutes,
      probability: calculateReasonProbability(f),
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3); // Top 3 reasons

  return {
    baseETA: baseETA.toISOString(),
    currentETA: currentETA.toISOString(),
    optimisticETA: optimisticETA.toISOString(),
    pessimisticETA: pessimisticETA.toISOString(),
    confidence,
    delayRisk: {
      probability: delayProbability,
      primaryReasons,
      totalEstimatedDelay: Math.max(0, totalDelayMinutes),
    },
    factors: delayFactors,
  };
}

/**
 * Calculate probability of delay based on factors
 */
function calculateDelayProbability(totalDelay: number): number {
  if (totalDelay <= 0) return 0;
  if (totalDelay > 60) return 95;
  if (totalDelay > 30) return 85;
  if (totalDelay > 15) return 70;
  if (totalDelay > 5) return 50;
  return 30;
}

/**
 * Calculate individual reason probability
 */
function calculateReasonProbability(factor: PredictiveETA['factors'][0]): number {
  const baseProbability: Record<typeof factor.type, number> = {
    weather: 80,
    traffic: 75,
    checkpoint: 90,
    route: 60,
    driver: 95,
  };

  // Adjust based on impact
  const impactMultiplier = Math.min(factor.impactMinutes / 30, 1);
  return Math.round(baseProbability[factor.type] * (0.7 + impactMultiplier * 0.3));
}

/**
 * Generate user-friendly delay message
 */
export function getDelayMessage(predictiveETA: PredictiveETA): string {
  const { delayRisk } = predictiveETA;

  if (delayRisk.probability < 30) {
    return 'Livraison dans les délais prévus';
  }

  if (delayRisk.primaryReasons.length === 0) {
    return `${delayRisk.probability}% de risque de retard`;
  }

  const topReason = delayRisk.primaryReasons[0];

  if (delayRisk.probability >= 85) {
    return `Votre colis a ${delayRisk.probability}% de risque de retard à cause de: ${topReason.reason}`;
  }

  if (delayRisk.probability >= 70) {
    return `Retard probable (${delayRisk.probability}%): ${topReason.reason}`;
  }

  return `Risque modéré de retard (${delayRisk.probability}%): ${topReason.reason}`;
}

/**
 * Get color coding for risk level
 */
export function getDelayRiskColor(probability: number): string {
  if (probability >= 85) return 'text-red-600';
  if (probability >= 70) return 'text-orange-600';
  if (probability >= 50) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Format ETA for display
 */
export function formatETA(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const minutes = Math.round(diff / 60000);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return `${hours}h${remainingMinutes > 0 ? remainingMinutes : ''}`;
  }

  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
