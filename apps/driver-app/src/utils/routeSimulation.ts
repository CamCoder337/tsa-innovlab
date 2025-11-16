import { Mission } from '../types/mission.types';

/**
 * Interpolate entre deux coordonnées GPS
 * @param start Point de départ
 * @param end Point d'arrivée
 * @param progress Progression (0-1)
 * @returns Coordonnées interpolées
 */
export const interpolateCoordinates = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  progress: number
): { latitude: number; longitude: number } => {
  return {
    latitude: start.latitude + (end.latitude - start.latitude) * progress,
    longitude: start.longitude + (end.longitude - start.longitude) * progress,
  };
};

/**
 * Génère plusieurs points intermédiaires le long d'une route
 * @param start Point de départ
 * @param end Point d'arrivée
 * @param numberOfPoints Nombre de points intermédiaires
 * @returns Tableau de coordonnées
 */
export const generateRoutePoints = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  numberOfPoints: number = 50
): Array<{ latitude: number; longitude: number }> => {
  const points = [];
  for (let i = 0; i <= numberOfPoints; i++) {
    const progress = i / numberOfPoints;
    points.push(interpolateCoordinates(start, end, progress));
  }
  return points;
};

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 * @param lat1 Latitude du point 1
 * @param lon1 Longitude du point 1
 * @param lat2 Latitude du point 2
 * @param lon2 Longitude du point 2
 * @returns Distance en km
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calcule l'ETA basé sur la distance restante et la vitesse moyenne
 * @param remainingDistance Distance restante en km
 * @param averageSpeed Vitesse moyenne en km/h (par défaut 60 km/h)
 * @returns Temps restant en minutes
 */
export const calculateETA = (
  remainingDistance: number,
  averageSpeed: number = 60
): number => {
  return Math.round((remainingDistance / averageSpeed) * 60);
};

/**
 * Formate l'ETA en format lisible (ex: "2h 30min")
 * @param minutes Nombre de minutes
 * @returns Chaîne formatée
 */
export const formatETA = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

/**
 * Interface pour la simulation de route
 */
export interface RouteSimulationState {
  currentPosition: { latitude: number; longitude: number };
  progress: number; // 0-100
  remainingDistance: number; // en km
  eta: number; // en minutes
  isRunning: boolean;
}

/**
 * Classe pour gérer la simulation de route en temps réel
 */
export class RouteSimulator {
  private mission: Mission;
  private routePoints: Array<{ latitude: number; longitude: number }>;
  private currentPointIndex: number = 0;
  private intervalId: number | null = null;
  private updateCallback: (state: RouteSimulationState) => void;
  private speed: number; // Points par seconde
  private totalDistance: number;

  constructor(
    mission: Mission,
    updateCallback: (state: RouteSimulationState) => void,
    speed: number = 2 // 2 points par seconde par défaut
  ) {
    this.mission = mission;
    this.updateCallback = updateCallback;
    this.speed = speed;

    // Générer les points de la route
    this.routePoints = generateRoutePoints(
      {
        latitude: mission.pickup.latitude,
        longitude: mission.pickup.longitude,
      },
      {
        latitude: mission.delivery.latitude,
        longitude: mission.delivery.longitude,
      },
      100 // 100 points pour une animation fluide
    );

    this.totalDistance = mission.distance;
  }

  /**
   * Démarre la simulation
   */
  start(): void {
    if (this.intervalId) {
      return; // Déjà en cours
    }

    this.intervalId = setInterval(() => {
      this.update();
    }, 1000 / this.speed) as unknown as number; // Mise à jour selon la vitesse
  }

  /**
   * Met à jour la position et les données de la simulation
   */
  private update(): void {
    if (this.currentPointIndex >= this.routePoints.length - 1) {
      // Arrivé à destination
      this.stop();
      this.updateCallback({
        currentPosition: this.routePoints[this.routePoints.length - 1],
        progress: 100,
        remainingDistance: 0,
        eta: 0,
        isRunning: false,
      });
      return;
    }

    this.currentPointIndex++;
    const currentPosition = this.routePoints[this.currentPointIndex];
    const progress = (this.currentPointIndex / (this.routePoints.length - 1)) * 100;

    // Calculer la distance restante
    const remainingDistance = this.totalDistance * (1 - progress / 100);
    const eta = calculateETA(remainingDistance);

    this.updateCallback({
      currentPosition,
      progress: Math.round(progress),
      remainingDistance: Math.round(remainingDistance * 10) / 10,
      eta,
      isRunning: true,
    });
  }

  /**
   * Met en pause la simulation
   */
  pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Arrête la simulation
   */
  stop(): void {
    this.pause();
    this.currentPointIndex = 0;
  }

  /**
   * Réinitialise la simulation
   */
  reset(): void {
    this.stop();
    this.currentPointIndex = 0;
    this.updateCallback({
      currentPosition: this.routePoints[0],
      progress: 0,
      remainingDistance: this.totalDistance,
      eta: calculateETA(this.totalDistance),
      isRunning: false,
    });
  }

  /**
   * Change la vitesse de simulation
   * @param speed Points par seconde
   */
  setSpeed(speed: number): void {
    const wasRunning = this.intervalId !== null;
    this.pause();
    this.speed = speed;
    if (wasRunning) {
      this.start();
    }
  }
}
