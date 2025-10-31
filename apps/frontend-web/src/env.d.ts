/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Runtime environment variables injected via docker-entrypoint.sh
interface RuntimeEnv {
  VITE_API_URL: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_GOOGLE_MAPS_API_KEY: string;
  VITE_GOOGLE_MAPS_MAP_ID: string;
}

interface Window {
  _env_?: RuntimeEnv;
}
