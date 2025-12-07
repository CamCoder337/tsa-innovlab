/**
 * Simulateur de mission avec suivi de trajet réel
 */

export interface SimulationState {
  currentPosition: { latitude: number; longitude: number };
  currentIndex: number; // Index actuel dans le tableau des coordonnées
  totalPoints: number; // Nombre total de points
  progress: number; // Progression en pourcentage (0-100)
  remainingDistance: number; // Distance restante en mètres
  elapsedTime: number; // Temps écoulé en secondes
  isRunning: boolean;
  isCompleted: boolean;
}

export class MissionSimulator {
  private routePoints: Array<{ latitude: number; longitude: number }>;
  private currentIndex: number = 0;
  private intervalId: number | null = null;
  // eslint-disable-next-line no-unused-vars
  private updateCallback: (state: SimulationState) => void;
  private completionCallback?: () => void;
  private speed: number; // Points par seconde
  private totalDistance: number; // Distance totale en mètres
  private startTime: number = 0;

  constructor(
    routePoints: Array<{ latitude: number; longitude: number }>,
    totalDistance: number,
    // eslint-disable-next-line no-unused-vars
    updateCallback: (state: SimulationState) => void,
    completionCallback?: () => void,
    speed: number = 2
  ) {
    this.routePoints = routePoints;
    this.totalDistance = totalDistance;
    this.updateCallback = updateCallback;
    this.completionCallback = completionCallback;
    this.speed = speed;
  }

  /**
   * Démarre la simulation
   */
  start(): void {
    if (this.intervalId) {
      return; // Déjà en cours
    }

    this.startTime = Date.now();
    this.intervalId = setInterval(() => {
      this.update();
    }, 1000 / this.speed) as unknown as number;
  }

  /**
   * Met à jour la position et les données de la simulation
   */
  private update(): void {
    if (this.currentIndex >= this.routePoints.length - 1) {
      // Arrivé à destination
      this.stop();
      this.updateCallback({
        currentPosition: this.routePoints[this.routePoints.length - 1],
        currentIndex: this.routePoints.length - 1,
        totalPoints: this.routePoints.length,
        progress: 100,
        remainingDistance: 0,
        elapsedTime: Math.floor((Date.now() - this.startTime) / 1000),
        isRunning: false,
        isCompleted: true,
      });

      // Appeler le callback de completion
      if (this.completionCallback) {
        this.completionCallback();
      }
      return;
    }

    this.currentIndex++;
    const currentPosition = this.routePoints[this.currentIndex];
    const progress = (this.currentIndex / (this.routePoints.length - 1)) * 100;
    const remainingDistance = this.totalDistance * (1 - progress / 100);
    const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);

    this.updateCallback({
      currentPosition,
      currentIndex: this.currentIndex,
      totalPoints: this.routePoints.length,
      progress: Math.round(progress),
      remainingDistance: Math.round(remainingDistance),
      elapsedTime,
      isRunning: true,
      isCompleted: false,
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
   * Arrête et réinitialise la simulation
   */
  stop(): void {
    this.pause();
    this.currentIndex = 0;
  }

  /**
   * Réinitialise la simulation
   */
  reset(): void {
    this.stop();
    this.currentIndex = 0;
    this.startTime = 0;
    this.updateCallback({
      currentPosition: this.routePoints[0],
      currentIndex: 0,
      totalPoints: this.routePoints.length,
      progress: 0,
      remainingDistance: this.totalDistance,
      elapsedTime: 0,
      isRunning: false,
      isCompleted: false,
    });
  }

  /**
   * Change la vitesse de simulation
   */
  setSpeed(speed: number): void {
    const wasRunning = this.intervalId !== null;
    this.pause();
    this.speed = speed;
    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Obtient les coordonnées parcourues (pour afficher en gris)
   */
  getCompletedRoute(): Array<{ latitude: number; longitude: number }> {
    return this.routePoints.slice(0, this.currentIndex + 1);
  }

  /**
   * Obtient les coordonnées restantes (pour afficher en bleu)
   */
  getRemainingRoute(): Array<{ latitude: number; longitude: number }> {
    return this.routePoints.slice(this.currentIndex);
  }
}

/**
 * Formater le temps écoulé
 */
export const formatElapsedTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formater la distance en format lisible
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};
