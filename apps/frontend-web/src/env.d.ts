/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Runtime environment variables injected via docker-entrypoint.sh
interface RuntimeEnv {
  VITE_API_URL: string;
}

interface Window {
  _env_?: RuntimeEnv;
}
