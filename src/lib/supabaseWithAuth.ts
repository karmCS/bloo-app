import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type ClerkSession = {
  getToken: (options?: { template?: string }) => Promise<string | null>;
} | null | undefined;

/**
 * Returns a Supabase client that attaches the Clerk-issued JWT to every
 * request by overriding `global.fetch`. This bypasses the supabase-js
 * internal auth header logic, which was intermittently falling back to the
 * anon key and causing RLS failures on authenticated writes.
 */
export async function getSupabaseWithAuth(session: ClerkSession) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: async (input, init = {}) => {
        const token = (await session?.getToken({ template: 'supabase' })) ?? null;
        const headers = new Headers(init.headers);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
