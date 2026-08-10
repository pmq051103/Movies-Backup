/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TMDB_API_KEY: string;
  readonly VITE_TMDB_BASE_URL: string;
  readonly VITE_TMDB_IMAGE_BASE_URL: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
