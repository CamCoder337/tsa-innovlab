import { authService } from './auth.service';
import { useAuthStore } from '@/stores/authStore';

interface TokenManagerConfig {
  /** Durée d'inactivité avant d'arrêter le refresh automatique (en ms) */
  inactivityTimeout: number;
  /** Intervalle de vérification des tokens (en ms) */
  checkInterval: number;
  /** Temps avant expiration pour déclencher le refresh (en ms) */
  refreshBeforeExpiry: number;
  /** Nombre maximum de tentatives de refresh */
  maxRetryAttempts: number;
}

export class TokenManagerService {
  private config: TokenManagerConfig = {
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    checkInterval: 60 * 1000, // 1 minute
    refreshBeforeExpiry: 5 * 60 * 1000, // 5 minutes avant expiration
    maxRetryAttempts: 3,
  };

  private lastActivity: number = Date.now();
  private checkIntervalId: NodeJS.Timeout | null = null;
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
    if (this.checkIntervalId) {
      return; // Déjà démarré
    }

    this.checkIntervalId = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.config.checkInterval);

    console.log('Token management started');
  }

  /**
   * Arrête la surveillance automatique des tokens
   */
  public stopTokenManagement(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
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
   * Décode un JWT pour extraire les informations d'expiration
   */
  private decodeJWT(token: string): { exp?: number; iat?: number } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Vérifie si le token va expirer bientôt
   */
  private isTokenExpiringSoon(token: string): boolean {
    const decoded = this.decodeJWT(token);
    if (!decoded?.exp) {
      return true; // Si on ne peut pas décoder, on considère qu'il expire
    }

    const expirationTime = decoded.exp * 1000; // Conversion en ms
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    return timeUntilExpiry <= this.config.refreshBeforeExpiry;
  }

  /**
   * Vérifie et rafraîchit le token si nécessaire
   */
  private async checkAndRefreshToken(): Promise<void> {
    const { token, refreshToken, isAuthenticated } = useAuthStore.getState();

    // Vérifications préliminaires
    if (!isAuthenticated || !token || !refreshToken) {
      return;
    }

    // Ne pas rafraîchir si l'utilisateur n'est pas actif
    if (!this.isUserActive()) {
      console.log('User inactive, skipping token refresh');
      return;
    }

    // Vérifier si le token va expirer
    if (!this.isTokenExpiringSoon(token)) {
      this.retryCount = 0; // Reset retry count si tout va bien
      return;
    }

    // Éviter les refreshs multiples simultanés
    if (this.isRefreshing) {
      return;
    }

    console.log('Token expiring soon, attempting refresh...');
    await this.refreshTokens();
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
