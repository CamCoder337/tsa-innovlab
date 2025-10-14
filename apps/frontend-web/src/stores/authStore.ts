import { create } from 'zustand';
import type { User, AuthStore } from '@/types/auth.types';
import { tokenManager } from '@/services/token-manager.service';

interface CookieOptions {
  days?: number;
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
}

function persistToLocalStorage(user: User | null) {
  try {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
  } catch {
    console.error('Failed to persist user to localStorage');
  }
}

function loadUserFromLocalStorage(): User | null {
  try {
    const raw = localStorage.getItem('user');
    if (raw) return JSON.parse(raw);
  } catch {
    console.error('Failed to load user from localStorage');
  }
  return null;
}

function setCookie(name: string, value: string, options: CookieOptions = {}, expiresIn?: number) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const { days = 7, path = '/', sameSite = isHttps ? 'Strict' : 'Lax', secure = isHttps } = options;

  const expires = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toUTCString()
    : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();

  document.cookie = `${name}=${value}; path=${path}; expires=${expires}; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
}

function getCookie(cookie: string) {
  const match = document.cookie.match(new RegExp(`(^| )${cookie}=([^;]+)`));
  return match ? match[2] : null;
}

function removeCookie(name: string, options: CookieOptions = {}) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const { path = '/', sameSite = isHttps ? 'Strict' : 'Lax', secure = isHttps } = options;

  document.cookie = `${name}=; path=${path}; max-age=0; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: loadUserFromLocalStorage(),
  token: getCookie('tsa_access_token'),
  refreshToken: getCookie('tsa_refresh_token'),
  isAuthenticated: !!loadUserFromLocalStorage(),

  login: (user: User, token?: string) => {
    persistToLocalStorage(user);
    set({
      currentUser: user,
      token: token ?? get().token ?? null,
      isAuthenticated: true,
    });

    // Démarrer la gestion automatique des tokens
    tokenManager.startTokenManagement();
  },

  logout: () => {
    // Arrêter la gestion automatique des tokens
    tokenManager.stopTokenManagement();

    persistToLocalStorage(null);
    removeCookie('tsa_access_token');
    removeCookie('tsa_refresh_token');
    set({
      currentUser: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    persistToLocalStorage(updatedUser);
    set({ currentUser: updatedUser });
  },

  setToken: (token: string, expiresIn?: number, refreshToken?: string) => {
    setCookie('tsa_access_token', token, {}, expiresIn);
    if (refreshToken) setCookie('tsa_refresh_token', refreshToken);
    set({ token: token, refreshToken: refreshToken ?? get().refreshToken });

    // S'assurer que la gestion des tokens est active si l'utilisateur est connecté
    if (get().isAuthenticated) {
      tokenManager.startTokenManagement();
    }
  },

  // Nouvelle méthode pour initialiser la gestion des tokens au démarrage
  initializeTokenManagement: () => {
    const state = get();
    if (state.isAuthenticated && state.token && state.refreshToken) {
      tokenManager.startTokenManagement();
    }
  },
}));
