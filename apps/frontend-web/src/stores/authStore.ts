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
import toast from 'react-hot-toast';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CookieOptions {
  days?: number;
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
}

function setCookie(name: string, value: string, options: CookieOptions = {}, expiresIn?: number) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const { days = 7, path = '/', sameSite = isHttps ? 'Strict' : 'Lax', secure = isHttps } = options;

  const expires = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toUTCString()
    : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();

  document.cookie = `${name}=${value}; path=${path}; expires=${expires}; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
}

export function getCookie(cookie: string) {
  const match = document.cookie.match(new RegExp(`(^| )${cookie}=([^;]+)`));
  return match ? match[2] : null;
}

function removeCookie(name: string, options: CookieOptions = {}) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const { path = '/', sameSite = isHttps ? 'Strict' : 'Lax', secure = isHttps } = options;

  document.cookie = `${name}=; path=${path}; max-age=0; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
}

// Helper function to get persisted user data
function getPersistedUser(): User | null {
  try {
    const persistedData = localStorage.getItem('user');
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

        // S'assurer que la gestion des tokens est active si l'utilisateur est connecté
        if (get().isAuthenticated) {
          tokenManager.startTokenManagement();
        }
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
                error: 'Email ou Mot de passe incorrect',
                isLoading: false,
              });
            } else if (response.error.errors?.[0] === 'Account is not active') {
              localStorage.setItem('verificationEmail', data.email);
              set({
                error: `Compte inactif. Veuillez consulter vos mails et récuperer votre code de validation à cet adresse : ${data.email}`,
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
            set({
              error: null,
              isLoading: false,
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
              return true;
            }
          }
        } catch (error) {
          console.error(error);
          set({ isLoading: false, error: error as string });
          return false;
        }
      },

      getUser: async () => {
        try {
          const response = await authService.getCurrentUser();
          const failed = response.error ?? null;

          if (failed) {
            set({
              error: failed.message || 'Échec de connexion',
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
          set({ isLoading: false, error: error as string });
          return;
        }
      },

      logout: () => {
        // Arrêter la gestion automatique des tokens
        tokenManager.stopTokenManagement();
        try {
          if (get().token)
            toast.promise(authService.logout(), {
              loading: 'Déconnexion...',
            });
          removeCookie('tsa_access_token');
          removeCookie('tsa_refresh_token');
          set({
            currentUser: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return true;
        } catch (error) {
          console.error(error);
          toast.error('Erreur lors de la déconnexion');
          return false;
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
      name: 'user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);
