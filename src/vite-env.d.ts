/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AGENTATION_ENDPOINT?: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}
