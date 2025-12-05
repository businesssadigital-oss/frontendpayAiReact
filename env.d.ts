// Type definitions for Vite environment variables used in this project
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
