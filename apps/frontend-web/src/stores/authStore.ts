import { create } from 'zustand';
import type {
  User,
  AuthStore,
  LoginCredentials,
  AuthState,
  CreateUserRequest,
} from '@/types/auth.types';
import { tokenManager } from '@/services/token-manager.service';
import { authService } from '@/services/auth.service';
import { createJSONStorage, persist } from 'zustand/middleware';
import { clearTSALocalStorage } from '@/utils/localStorage.utils';
import { deleteCookie, getCookie, setCookie } from '@/lib/cookie-utils';

// Helper function to get persisted user data
export function getPersistedUser(): User | null {
  try {
    const persistedData = localStorage.getItem('tsa_user');
    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      return parsed.state?.currentUser || null;
    }
  } catch (error) {
    console.error('Error loading persisted user data:', error);
  }
  return null;
}

const initialState: AuthState = {
  currentUser: getPersistedUser(),
  token: getCookie('tsa_access_token'),
  refreshToken: getCookie('tsa_refresh_token'),
  isAuthenticated: getPersistedUser() !== null && getCookie('tsa_access_token') !== null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setToken: (token: string, expiresIn?: number, refreshToken?: string) => {
        setCookie('tsa_access_token', token, {}, expiresIn);
        if (refreshToken) setCookie('tsa_refresh_token', refreshToken);
        set({ token: token, refreshToken: refreshToken ?? get().refreshToken });
      },

      signup: async (data: CreateUserRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.register(data);

          if (response.error) {
            const errorMessage = response.error.errors?.[0];

            if (errorMessage === 'Invalid credentials') {
              set({
                error: 'Email ou Mot de passe incorrect',
                isLoading: false,
              });
            } else if (errorMessage === 'Account is not active') {
              set({
                error: `Compte inactif. Veuillez consulter vos mails à cet adresse : ${data.email}`,
                isLoading: false,
              });
            } else if (errorMessage.includes('email has already been taken')) {
              set({
                error: 'Cette adresse mail est déjà associée à un compte',
                isLoading: false,
              });
            } else {
              set({
                error: response.error.message || 'Échec de connexion',
                isLoading: false,
              });
            }
            return false;
          }

          if (response.data) {
            localStorage.setItem('verificationEmail', response.data.email);
            return true;
          }
        } catch (error) {
          console.error(error);
          set({ isLoading: false, error: error as string });
          return false;
        }
      },

      login: async (data: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login(data);

          if (response.error) {
            if (response.error.errors?.[0] === 'Invalid credentials') {
              set({
                error: 'invalidCredentials',
                isLoading: false,
              });
            } else if (response.error.errors?.[0] === 'Account is not active') {
              localStorage.setItem('verificationEmail', data.email);
              set({
                error: `accountInactive`,
                isLoading: false,
              });
            } else if (response.error.errors?.[0] === 'Invalid MFA code') {
              set({
                error: `invalidMFA`,
                isLoading: false,
              });
            } else {
              console.error(response.error);
              set({
                error: 'loginFailed',
                isLoading: false,
              });
            }
            return false;
          }

          if (response.data) {
            set({
              error: null,
            });

            if ('requiresMFA' in response.data && response.data.requiresMFA) {
              return 'mfa_required';
            }

            if ('accessToken' in response.data && 'refreshToken' in response.data) {
              get().setToken(
                response.data.accessToken,
                response.data.expiresIn,
                response.data.refreshToken
              );
              get().getUser();
              return true;
            }
          }
        } catch (error) {
          console.error(error);
          set({ isLoading: false, error: 'loginFailed' });
          return false;
        }
      },

      getUser: async () => {
        try {
          const response = await authService.getCurrentUser();
          const failed = response.error ?? null;

          if (failed) {
            console.error(failed);
            set({
              error: 'loginFailed',
            });
            return;
          }

          if (response.data) {
            set({
              currentUser: response.data,
              isAuthenticated: true,
              error: null,
              isLoading: false,
            });
            return;
          }
        } catch (error) {
          console.error(error);
          set({ isLoading: false, error: 'loginFailed' });
          return;
        }
      },

      logout: async () => {
        // Arrêter la gestion automatique des tokens
        tokenManager.stopTokenManagement();
        try {
          await authService.logout();
        } catch (error) {
          console.error(error);
        } finally {
          deleteCookie('tsa_access_token');
          deleteCookie('tsa_refresh_token');
          set({
            currentUser: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          // Clear only TSA-specific localStorage items instead of all localStorage
          clearTSALocalStorage();
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const updatedUser: User = {
          ...currentUser,
          ...userData,
          updatedAt: new Date().toISOString(),
        };

        set({ currentUser: updatedUser });
      },

      // Nouvelle méthode pour initialiser la gestion des tokens au démarrage
      initializeTokenManagement: () => {
        const state = get();
        if (state.isAuthenticated && state.token && state.refreshToken) {
          tokenManager.startTokenManagement();
        }
      },
    }),
    {
      name: 'tsa_user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);
