import { create } from 'zustand';
import type { User } from '@/types/user.types';
import type { AuthState, AuthActions } from '@/types/store.types';

export type AuthStore = AuthState & AuthActions;

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

    const expires = expiresIn || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();

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
    isAuthenticated: !!loadUserFromLocalStorage(),

    login: (user: User, token?: string) => {
        persistToLocalStorage(user);
        set({
            currentUser: user,
            token: token ?? get().token ?? null,
            isAuthenticated: true,
        });
    },

    logout: () => {
        persistToLocalStorage(null);
        removeCookie('tsa_access_token');
        set({
            currentUser: null,
            token: null,
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

    setToken: (token: string, expiresIn?: number) => {
        setCookie('tsa_access_token', token, {}, expiresIn);
        set({ token: token });
    },
}));
