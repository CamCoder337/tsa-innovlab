import type { TrackingAlert, ShipmentDetails, DriverProximity } from '@/types/tracking.types';

/**
 * Alert Service - Generates intelligent, proactive alerts for shipments
 */

/**
 * Generate all relevant alerts for a shipment
 */
export function generateShipmentAlerts(shipment: ShipmentDetails): TrackingAlert[] {
  const alerts: TrackingAlert[] = [];

  // Check for delivery proximity
  if (shipment.driverProximity) {
    const proximityAlerts = generateProximityAlerts(shipment.driverProximity);
    alerts.push(...proximityAlerts);
  }

  // Check for predictive delays
  if (
    shipment.predictiveETA?.delayRisk?.probability &&
    shipment.predictiveETA.delayRisk.probability > 50
  ) {
    alerts.push(generateDelayAlert(shipment));
  }

  // Check for weather risks
  if (
    shipment.currentWeather?.riskLevel &&
    ['high', 'severe'].includes(shipment.currentWeather.riskLevel)
  ) {
    alerts.push(generateWeatherAlert(shipment));
  }

  // Check for traffic incidents
  if (
    shipment.currentTraffic?.severity &&
    ['heavy', 'blocked'].includes(shipment.currentTraffic.severity)
  ) {
    alerts.push(generateTrafficAlert(shipment));
  }

  // Check for checkpoint delays
  if (shipment.roadCheckpoints) {
    const checkpointAlerts = generateCheckpointAlerts(shipment.roadCheckpoints);
    alerts.push(...checkpointAlerts);
  }

  // Check for unusual stops
  const stopAlert = detectUnusualStop(shipment);
  if (stopAlert) {
    alerts.push(stopAlert);
  }

  // Check for route changes
  if (shipment.status === 'in_transit' && shipment.route.length > 0) {
    const routeAlert = detectRouteChange();
    if (routeAlert) {
      alerts.push(routeAlert);
    }
  }

  return alerts.sort((a, b) => {
    // Sort by severity and timestamp
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * Generate proximity-based alerts
 */
function generateProximityAlerts(proximity: DriverProximity): TrackingAlert[] {
  const alerts: TrackingAlert[] = [];
  const now = new Date().toISOString();

  // Nearby alert (within 1km)
  if (proximity.isNearby) {
    alerts.push({
      id: `alert-nearby-${Date.now()}`,
      type: 'delivery_soon',
      severity: 'info',
      title: '🎯 Votre livreur est tout proche !',
      message: `Votre chauffeur est à ${Math.round(proximity.distanceToDestination)}m. Arrivée dans environ ${proximity.estimatedArrivalMinutes} minutes. Préparez les CFA !`,
      timestamp: now,
      icon: '📍',
      isRead: false,
      canDismiss: false,
    });
  }
  // Approaching alert (within 5km)
  else if (proximity.isApproaching) {
    alerts.push({
      id: `alert-approaching-${Date.now()}`,
      type: 'delivery_soon',
      severity: 'info',
      title: '🚚 Votre livreur approche',
      message: `Votre colis sera livré dans environ ${proximity.estimatedArrivalMinutes} minutes. Distance restante: ${(proximity.distanceToDestination / 1000).toFixed(1)} km`,
      timestamp: now,
      icon: '🚚',
      isRead: false,
      canDismiss: true,
    });
  }

  return alerts;
}

/**
 * Generate delay prediction alert
 */
function generateDelayAlert(shipment: ShipmentDetails): TrackingAlert {
  const prediction = shipment.predictiveETA!;
  const probability = prediction.delayRisk.probability;
  const delay = prediction.delayRisk.totalEstimatedDelay;
  const topReason = prediction.delayRisk.primaryReasons[0];

  return {
    id: `alert-delay-${Date.now()}`,
    type: 'delay',
    severity: probability >= 85 ? 'critical' : 'warning',
    title: probability >= 85 ? '⚠️ Retard significatif prévu' : '⏰ Risque de retard',
    message: topReason
      ? `Votre colis a ${probability}% de risque de retard (${delay} min) à cause de: ${topReason.reason}`
      : `Votre colis a ${probability}% de risque de retard de ${delay} minutes`,
    timestamp: new Date().toISOString(),
    estimatedDelay: delay,
    delayProbability: probability,
    icon: probability >= 85 ? '⚠️' : '⏰',
    isRead: false,
    canDismiss: false,
  };
}

/**
 * Generate weather-related alert
 */
function generateWeatherAlert(shipment: ShipmentDetails): TrackingAlert {
  const weather = shipment.currentWeather!;

  return {
    id: `alert-weather-${Date.now()}`,
    type: 'weather',
    severity: weather.riskLevel === 'severe' ? 'critical' : 'warning',
    title: weather.riskLevel === 'severe' ? '⛈️ Conditions météo sévères' : '🌧️ Météo défavorable',
    message:
      weather.impactOnDelivery || `${weather.description}. Impact possible sur la livraison.`,
    timestamp: new Date().toISOString(),
    location: shipment.currentLocation
      ? {
          lat: shipment.currentLocation.lat,
          lng: shipment.currentLocation.lng,
          name: shipment.currentLocation.address,
        }
      : undefined,
    icon: weather.icon,
    isRead: false,
    canDismiss: true,
  };
}

/**
 * Generate traffic-related alert
 */
function generateTrafficAlert(shipment: ShipmentDetails): TrackingAlert {
  const traffic = shipment.currentTraffic!;

  const severityMessages = {
    heavy: 'Trafic dense sur le trajet',
    blocked: 'Route bloquée ou circulation très difficile',
  };

  return {
    id: `alert-traffic-${Date.now()}`,
    type: 'traffic',
    severity: traffic.severity === 'blocked' ? 'critical' : 'warning',
    title: '🚦 Conditions de circulation',
    message: traffic.incidentDescription
      ? `${traffic.incidentDescription}. Retard estimé: ${traffic.delayMinutes} min`
      : `${severityMessages[traffic.severity as 'heavy' | 'blocked']}. Retard estimé: ${traffic.delayMinutes} min`,
    timestamp: new Date().toISOString(),
    estimatedDelay: traffic.delayMinutes,
    location: shipment.currentLocation
      ? {
          lat: shipment.currentLocation.lat,
          lng: shipment.currentLocation.lng,
          name: shipment.currentLocation.address,
        }
      : undefined,
    icon: '🚦',
    isRead: false,
    canDismiss: true,
  };
}

/**
 * Generate checkpoint alerts
 */
function generateCheckpointAlerts(
  checkpoints: ShipmentDetails['roadCheckpoints']
): TrackingAlert[] {
  if (!checkpoints) return [];

  const alerts: TrackingAlert[] = [];
  const now = new Date().toISOString();

  checkpoints
    .filter((cp) => !cp.isPassed && cp.currentWaitTime && cp.currentWaitTime > 15)
    .forEach((checkpoint) => {
      alerts.push({
        id: `alert-checkpoint-${checkpoint.id}`,
        type: 'checkpoint',
        severity: checkpoint.currentWaitTime! > 30 ? 'warning' : 'info',
        title: '🚧 Contrôle routier à venir',
        message: `${checkpoint.name} - Temps d'attente actuel: ${checkpoint.currentWaitTime} min`,
        timestamp: now,
        estimatedDelay: checkpoint.currentWaitTime,
        location: {
          lat: checkpoint.location.lat,
          lng: checkpoint.location.lng,
          name: checkpoint.name,
        },
        icon: '🚧',
        isRead: false,
        canDismiss: true,
      });
    });

  return alerts;
}

/**
 * Detect unusual stops (e.g., mechanical problems)
 */
function detectUnusualStop(shipment: ShipmentDetails): TrackingAlert | null {
  if (shipment.status !== 'in_transit') return null;
  if (!shipment.currentLocation) return null;

  // Check if speed is 0 for extended period
  const lastUpdate = new Date(shipment.currentLocation.timestamp);
  const timeSinceUpdate = Date.now() - lastUpdate.getTime();
  const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);

  if (shipment.speed === 0 && hoursSinceUpdate > 1) {
    return {
      id: `alert-stop-${Date.now()}`,
      type: 'mechanical',
      severity: 'warning',
      title: '⚠️ Arrêt prolongé détecté',
      message: `Votre chauffeur s'est arrêté depuis ${Math.round(hoursSinceUpdate * 60)} minutes à ${shipment.currentLocation.address}. Problème mécanique possible ?`,
      timestamp: new Date().toISOString(),
      location: {
        lat: shipment.currentLocation.lat,
        lng: shipment.currentLocation.lng,
        name: shipment.currentLocation.address,
      },
      actionRequired: true,
      actionLabel: 'Contacter le chauffeur',
      icon: '🔧',
      isRead: false,
      canDismiss: false,
    };
  }

  return null;
}

/**
 * Detect route changes
 */
function detectRouteChange(): TrackingAlert | null {
  // This would compare current route with original route
  // For now, simulate random route changes
  if (Math.random() > 0.95) {
    return {
      id: `alert-route-${Date.now()}`,
      type: 'route_change',
      severity: 'info',
      title: "🗺️ Changement d'itinéraire",
      message:
        'Votre chauffeur a pris un itinéraire alternatif pour éviter le trafic. ETA mis à jour.',
      timestamp: new Date().toISOString(),
      icon: '🗺️',
      isRead: false,
      canDismiss: true,
    };
  }

  return null;
}

/**
 * Get alert icon based on type
 */
export function getAlertIcon(type: TrackingAlert['type']): string {
  const icons = {
    delay: '⏰',
    route_change: '🗺️',
    weather: '🌧️',
    checkpoint: '🚧',
    traffic: '🚦',
    mechanical: '🔧',
    custom: '📢',
    delivery_soon: '📦',
  };

  return icons[type] || '📢';
}

/**
 * Get alert color based on severity
 */
export function getAlertColor(severity: TrackingAlert['severity']): {
  bg: string;
  text: string;
  border: string;
} {
  const colors = {
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      border: 'border-blue-200',
    },
    warning: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
      border: 'border-yellow-200',
    },
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-200',
    },
  };

  return colors[severity];
}
