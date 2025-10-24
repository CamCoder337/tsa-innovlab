import axios, { type AxiosInstance, type AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { getApiUrl } from '@/config/env';
import { tokenManager } from './token-manager.service';

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: getApiUrl(),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
  });

  // Request interceptor pour ajouter automatiquement le token
  instance.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token;
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling with automatic token refresh
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 errors (unauthorized)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Tenter de rafraîchir le token si l'utilisateur est actif
        if (tokenManager.timeSinceLastActivity < 30 * 60 * 1000) {
          // 30 minutes
          const refreshSuccess = await tokenManager.manualRefresh();

          if (refreshSuccess) {
            // Retry the original request with the new token
            const newToken = useAuthStore.getState().token;
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
          }
        }

        // Si le refresh échoue ou l'utilisateur est inactif, déconnecter
        // useAuthStore.getState().logout();
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

export class BaseApi {
  axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = createAxiosInstance();
  }

  insertToken(): AxiosInstance {
    // Cette méthode est maintenant obsolète car l'intercepteur request
    // ajoute automatiquement le token. Gardée pour compatibilité.
    return this.axiosInstance;
  }

  // Helper method to handle API errors consistently
  protected handleError(error: AxiosError): never {
    if (error.response?.data) {
      throw error.response.data;
    }
    throw {
      success: false,
      message: error.message || 'An unexpected error occurred',
      errors: [error.message || 'Network error'],
    };
  }

  // CRUD helper methods
  protected async get(url: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  protected async post(url: string, data?: unknown, config?: AxiosRequestConfig) {
    try {
      const response = await this.axiosInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  protected async put(url: string, data?: unknown, config?: AxiosRequestConfig) {
    try {
      const response = await this.axiosInstance.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  protected async patch(url: string, data?: unknown, config?: AxiosRequestConfig) {
    try {
      const response = await this.axiosInstance.patch(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  protected async delete(url: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.axiosInstance.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}
