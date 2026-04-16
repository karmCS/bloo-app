import { createClient } from '@supabase/supabase-js';

function requiredEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`[api] Missing environment variable: ${name}`);
  }
  return value;
}

/**
 * Server-side Supabase client for API routes.
 *
 * Prefer `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) for webhook/order updates.
 * Falls back to anon keys only if you explicitly haven't provided the service key.
 */
export function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL; // fallback for older setups

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;

  const url = requiredEnv('SUPABASE_URL', supabaseUrl);
  const key =
    supabaseKey && supabaseKey.trim().length > 0
      ? supabaseKey
      : requiredEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseKey);

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

