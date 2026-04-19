import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type ClerkSession = {
  getToken: (options: { template: string }) => Promise<string | null>;
} | null | undefined;

/**
 * Returns a Supabase client with the Clerk JWT attached as the Authorization
 * header. Pass the `session` object from Clerk's useSession() hook.
 *
 * Requires a "supabase" JWT template configured in the Clerk dashboard.
 */
export async function getSupabaseWithAuth(session: ClerkSession) {
  const token = (await session?.getToken({ template: 'supabase' })) ?? null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}
