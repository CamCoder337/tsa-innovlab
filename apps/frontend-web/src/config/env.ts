/**
 * Environment configuration utilities
 * Handles runtime (Docker) and build-time environment variables
 * Priority: runtime env (window._env_) > build-time env (import.meta.env)
 *
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  GUIDE : Comment ajouter une nouvelle variable d'environnement            ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 *
 * Pour ajouter une nouvelle variable d'environnement (ex: VITE_NEW_API_KEY):
 *
 * 📝 ÉTAPE 1 : Ajouter la variable dans src/env.d.ts
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   interface ImportMetaEnv {
 *     readonly VITE_NEW_API_KEY: string;  // ← Ajouter ici
 *     // ... autres variables
 *   }
 *
 *   interface RuntimeEnv {
 *     VITE_NEW_API_KEY: string;  // ← Ajouter ici aussi
 *     // ... autres variables
 *   }
 *
 * 📝 ÉTAPE 2 : Créer une fonction getter dans ce fichier
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   export const getNewApiKey = (): string => {
 *     return window._env_?.VITE_NEW_API_KEY || import.meta.env.VITE_NEW_API_KEY || '';
 *   };
 *
 * 📝 ÉTAPE 3 : Ajouter dans l'objet env (optionnel mais recommandé)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   export const env = {
 *     newApiKey: getNewApiKey,  // ← Ajouter ici
 *     // ... autres variables
 *   } as const;
 *
 * 📝 ÉTAPE 4 : Ajouter dans docker-entrypoint.sh
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   Dans apps/frontend-web/docker-entrypoint.sh :
 *
 *   window._env_ = {
 *     VITE_NEW_API_KEY: "${VITE_NEW_API_KEY:-}",  // ← Ajouter ici
 *     // ... autres variables
 *   };
 *
 *   echo "   VITE_NEW_API_KEY = ${VITE_NEW_API_KEY:-(not set)}"  // ← Et ici
 *
 * 📝 ÉTAPE 5 : Utiliser dans votre code
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   import { getNewApiKey } from '@/config/env';
 *
 *   const apiKey = getNewApiKey();
 *   // ou
 *   import { env } from '@/config/env';
 *   const apiKey = env.newApiKey();
 *
 * ⚠️  IMPORTANT : Ne jamais utiliser directement import.meta.env ou window._env_
 *    dans votre code. Toujours passer par les getters pour garantir la priorité
 *    runtime > build-time.
 */

export const getApiUrl = (): string => {
  return window._env_?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3333';
};

export const getSupabaseUrl = (): string => {
  return window._env_?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
};

export const getSupabaseAnonKey = (): string => {
  return window._env_?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
};

export const getGoogleMapsApiKey = (): string => {
  return window._env_?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
};

export const getWebSocketUrl = (): string => {
  const apiUrl = getApiUrl();
  // Convert HTTP URL to WebSocket URL
  return apiUrl.replace(/^http/, 'ws') + '/ws';
};

// Export all environment variables as a single config object
export const env = {
  apiUrl: getApiUrl,
  supabaseUrl: getSupabaseUrl,
  supabaseAnonKey: getSupabaseAnonKey,
  googleMapsApiKey: getGoogleMapsApiKey,
  webSocketUrl: getWebSocketUrl,
} as const;
