import { authService } from './auth.service';
import { useAuthStore } from '@/stores/authStore';

interface TokenManagerConfig {
  /** Durée d'inactivité avant d'arrêter le refresh automatique (en ms) */
  inactivityTimeout: number;
  /** Durée de vie du token en ms (15 minutes) */
  tokenLifetime: number;
  /** Temps avant expiration pour déclencher le refresh (en ms) */
  refreshBeforeExpiry: number;
  /** Nombre maximum de tentatives de refresh */
  maxRetryAttempts: number;
}

export class TokenManagerService {
  private config: TokenManagerConfig = {
    inactivityTimeout: 15 * 60 * 1000, // 15 minutes (match token expiry)
    tokenLifetime: 15 * 60 * 1000, // 15 minutes
    refreshBeforeExpiry: 1 * 60 * 1000, // 1 minute before expiry
    maxRetryAttempts: 3,
  };

  private lastActivity: number = Date.now();
  private tokenStartTime: number | null = null;
  private checkTimeoutId: NodeJS.Timeout | null = null;
  private refreshTimeoutId: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private retryCount: number = 0;
  private isRefreshing: boolean = false;

  // Events pour détecter l'activité utilisateur
  private activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  constructor(config?: Partial<TokenManagerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.setupActivityListeners();
  }

  /**
   * Démarre la surveillance automatique des tokens
   */
  public startTokenManagement(): void {
    if (this.checkTimeoutId || this.refreshTimeoutId) {
      return; // Déjà démarré
    }

    // Calculer le temps de fin du token (maintenant + 15 minutes)
    this.tokenStartTime = Date.now();
    const tokenEndTime = this.tokenStartTime + this.config.tokenLifetime;

    // Programmer une vérification après 10 minutes
    const checkTime = 10 * 60 * 1000; // 10 minutes
    this.checkTimeoutId = setTimeout(() => {
      this.checkTokenStatus();
    }, checkTime);

    // Programmer le refresh 1 minute avant la fin calculée
    const refreshTime = this.config.tokenLifetime - this.config.refreshBeforeExpiry; // 14 minutes
    this.refreshTimeoutId = setTimeout(() => {
      this.performScheduledRefresh();
    }, refreshTime);

    console.log(
      `Token management started. Token expires at: ${new Date(tokenEndTime).toLocaleTimeString()}`
    );
    console.log(
      `Check scheduled at: ${new Date(this.tokenStartTime + checkTime).toLocaleTimeString()}`
    );
    console.log(
      `Refresh scheduled at: ${new Date(this.tokenStartTime + refreshTime).toLocaleTimeString()}`
    );
  }

  /**
   * Arrête la surveillance automatique des tokens
   */
  public stopTokenManagement(): void {
    if (this.checkTimeoutId) {
      clearTimeout(this.checkTimeoutId);
      this.checkTimeoutId = null;
    }
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    this.tokenStartTime = null;
    this.removeActivityListeners();
    console.log('Token management stopped');
  }

  /**
   * Vérifie si l'utilisateur est actif
   */
  private isUserActive(): boolean {
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    return timeSinceLastActivity < this.config.inactivityTimeout;
  }

  /**
   * Vérifie le statut du token après 10 minutes
   */
  private checkTokenStatus(): void {
    const { token, isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated || !token) {
      console.log('Token check: User not authenticated or no token');
      return;
    }

    if (!this.isUserActive()) {
      console.log('Token check: User inactive, stopping token management');
      this.stopTokenManagement();
      return;
    }

    const currentTime = Date.now();
    const elapsedTime = this.tokenStartTime ? currentTime - this.tokenStartTime : 0;
    const remainingTime = this.config.tokenLifetime - elapsedTime;

    console.log(
      `Token check at 10 minutes: ${Math.round(remainingTime / 1000 / 60)} minutes remaining`
    );
    console.log('User is active, refresh will proceed as scheduled');
  }

  /**
   * Effectue le refresh programmé 1 minute avant expiration
   */
  private async performScheduledRefresh(): Promise<void> {
    const { token, refreshToken, isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated || !token || !refreshToken) {
      console.log('Scheduled refresh: User not authenticated or missing tokens');
      return;
    }

    if (!this.isUserActive()) {
      console.log('Scheduled refresh: User inactive, skipping refresh');
      return;
    }

    if (this.isRefreshing) {
      console.log('Scheduled refresh: Already refreshing, skipping');
      return;
    }

    console.log('Performing scheduled token refresh (1 minute before expiry)...');
    const success = await this.refreshTokens();

    if (success) {
      // Redémarrer le cycle de gestion des tokens avec le nouveau token
      this.stopTokenManagement();
      this.startTokenManagement();
    }
  }

  /**
   * Rafraîchit les tokens
   */
  private async refreshTokens(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;

    return result;
  }

  /**
   * Effectue le rafraîchissement des tokens
   */
  private async performTokenRefresh(): Promise<boolean> {
    const { refreshToken } = useAuthStore.getState();

    if (!refreshToken) {
      console.error('No refresh token available');
      return false;
    }

    if (this.retryCount >= this.config.maxRetryAttempts) {
      console.error('Max retry attempts reached, logging out user');
      useAuthStore.getState().logout();
      return false;
    }

    this.isRefreshing = true;
    this.retryCount++;

    try {
      const response = await authService.refreshToken(refreshToken);

      if (response.data) {
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

        // Mettre à jour les tokens dans le store
        useAuthStore.getState().setToken(accessToken, expiresIn, newRefreshToken);

        console.log('Token refreshed successfully');
        this.retryCount = 0; // Reset retry count on success
        this.isRefreshing = false;
        return true;
      } else {
        console.error('Token refresh failed:', response.error);
        this.isRefreshing = false;
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.isRefreshing = false;

      // Si on a atteint le maximum de tentatives, déconnecter l'utilisateur
      if (this.retryCount >= this.config.maxRetryAttempts) {
        useAuthStore.getState().logout();
      }

      return false;
    }
  }

  /**
   * Met à jour le timestamp de la dernière activité
   */
  private updateLastActivity = (): void => {
    this.lastActivity = Date.now();
  };

  /**
   * Configure les écouteurs d'événements pour détecter l'activité
   */
  private setupActivityListeners(): void {
    this.activityEvents.forEach((event) => {
      document.addEventListener(event, this.updateLastActivity, true);
    });
  }

  /**
   * Supprime les écouteurs d'événements
   */
  private removeActivityListeners(): void {
    this.activityEvents.forEach((event) => {
      document.removeEventListener(event, this.updateLastActivity, true);
    });
  }

  /**
   * Rafraîchit manuellement les tokens (pour usage externe)
   */
  public async manualRefresh(): Promise<boolean> {
    return this.refreshTokens();
  }

  /**
   * Vérifie si un refresh est en cours
   */
  public get isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }

  /**
   * Obtient le temps depuis la dernière activité
   */
  public get timeSinceLastActivity(): number {
    return Date.now() - this.lastActivity;
  }

  /**
   * Met à jour la configuration
   */
  public updateConfig(newConfig: Partial<TokenManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Instance singleton
export const tokenManager = new TokenManagerService();
