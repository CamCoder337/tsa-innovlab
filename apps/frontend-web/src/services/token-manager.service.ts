// token-manager.service.ts
import { authService } from './auth.service';
import { useAuthStore } from '@/stores/authStore';
import { getCookie, getCookieExpiry, getCookieSecondsRemaining } from '@/lib/cookie-utils';
import type { AxiosError } from 'axios';

// Type pour les erreurs qui peuvent survenir lors des requêtes
type NetworkError =
  | AxiosError
  | Error
  | {
      response?: unknown;
      code?: string;
      message?: string;
    }
  | unknown;

interface TokenManagerConfig {
  inactivityTimeout: number; // Stop refresh if inactive (ms)
  refreshBeforeExpiry: number; // Refresh X seconds before expiry
  maxRetryAttempts: number;
}

const TSA_ACCESS_COOKIE = 'tsa_access_token';

export class TokenManagerService {
  private config: TokenManagerConfig = {
    inactivityTimeout: 15 * 60 * 1000, // 15 min
    refreshBeforeExpiry: 2.5 * 60 * 1000, // 2.5 min before expiry
    maxRetryAttempts: 3,
  };

  private refreshTimeoutId: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing = false;
  private isStarted = false;
  private retryCount = 0;
  private lastActivity = Date.now();

  private activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  constructor(config?: Partial<TokenManagerConfig>) {
    if (config) this.config = { ...this.config, ...config };
    this.setupActivityListeners();
  }

  // ========================
  // Public API
  // ========================

  public startTokenManagement(): void {
    if (this.isStarted) {
      return;
    }

    const token = getCookie(TSA_ACCESS_COOKIE);
    const expiresAt = getCookieExpiry(TSA_ACCESS_COOKIE);

    if (!token || !expiresAt) {
      console.warn('No token or expiry found in cookie. Token management not started.');
      this.handleLogout(); // Optional: force logout
      return;
    }

    this.isStarted = true;
    this.scheduleRefresh();
  }

  public stopTokenManagement(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    this.refreshPromise = null;
    this.isRefreshing = false;
    this.isStarted = false;
    this.retryCount = 0;
  }

  public cleanup(): void {
    this.stopTokenManagement();
    this.removeActivityListeners();
  }

  public async manualRefresh(): Promise<boolean> {
    return this.refreshTokens();
  }

  public get isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }

  public isUserActive(): boolean {
    return Date.now() - this.lastActivity < this.config.inactivityTimeout;
  }

  // ========================
  // Private Methods
  // ========================

  private scheduleRefresh(): void {
    const secondsRemaining = getCookieSecondsRemaining(TSA_ACCESS_COOKIE);
    console.log(`Token management started. Expires in ${Math.round(secondsRemaining / 60)} min`);

    if (secondsRemaining <= 0) {
      console.warn('Token expired');
      this.handleLogout();
      return;
    }

    const refreshInMs = Math.max(
      secondsRemaining * 1000 - this.config.refreshBeforeExpiry,
      30_000 // At least 30 seconds
    );

    console.log(`Next refresh scheduled in ${Math.round(refreshInMs / 1000 / 60)} min`);

    this.refreshTimeoutId = setTimeout(() => {
      if (!this.isUserActive()) {
        console.log('User inactive for too long → skipping refresh');
        return;
      }
      this.performScheduledRefresh();
    }, refreshInMs);
  }

  private async performScheduledRefresh(): Promise<void> {
    if (this.isRefreshing) return;

    console.log('Performing scheduled token refresh...');
    const success = await this.refreshTokens();

    if (success) {
      this.scheduleRefresh(); // Reschedule with new expiry
    }
  }

  private async refreshTokens(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    const { refreshToken, isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated || !refreshToken) {
      console.log(isAuthenticated);
      console.log(refreshToken);
      console.log('No refresh token → logging out');
      this.handleLogout();
      return false;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise.finally(() => {
      this.refreshPromise = null;
    });

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
      console.error('Max refresh attempts reached');
      this.handleLogout();
      return false;
    }

    this.isRefreshing = true;
    this.retryCount++;

    try {
      const response = await authService.refreshToken(refreshToken);

      if (response.data?.accessToken && response.data?.expiresIn) {
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

        // Update store
        useAuthStore.getState().setToken(accessToken, expiresIn, newRefreshToken);

        console.log('Token refreshed & cookie updated successfully');
        this.retryCount = 0;
        this.isRefreshing = false;
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);

      if (this.isNetworkError(error) && this.retryCount < this.config.maxRetryAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10_000);
        console.log(
          `Network error → retry ${this.retryCount}/${this.config.maxRetryAttempts} in ${delay}ms`
        );
        setTimeout(() => this.performTokenRefresh(), delay);
        this.isRefreshing = false;
        return false;
      }
    }

    this.isRefreshing = false;
    console.warn('Token refresh failed');
    this.handleLogout();
    return false;
  }

  private handleLogout(): void {
    console.log('Token expired or refresh failed → logging out');
    useAuthStore.getState().logout();
  }

  private updateLastActivity = () => {
    this.lastActivity = Date.now();
  };

  private setupActivityListeners(): void {
    this.activityEvents.forEach((event) =>
      document.addEventListener(event, this.updateLastActivity, true)
    );
  }

  private removeActivityListeners(): void {
    this.activityEvents.forEach((event) =>
      document.removeEventListener(event, this.updateLastActivity, true)
    );
  }

  private isNetworkError(error: NetworkError): boolean {
    // Type guard pour vérifier si l'erreur a les propriétés attendues
    const hasResponse = error && typeof error === 'object' && 'response' in error;
    const hasCode = error && typeof error === 'object' && 'code' in error;

    if (!hasResponse) return true; // Pas de response = erreur réseau

    if (hasCode) {
      const code = (error as { code: string }).code;
      return code === 'NETWORK_ERROR' || code === 'ECONNABORTED';
    }

    return false;
  }
}

// Singleton
export const tokenManager = new TokenManagerService();
