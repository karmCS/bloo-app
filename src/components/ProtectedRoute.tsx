import { useEffect, useState } from 'react';
import { useAuth, useUser, useClerk, useSession } from '@clerk/react';
import { Navigate } from 'react-router-dom';
import { getSupabaseWithAuth } from '../lib/supabaseWithAuth';

type CheckState = 'loading' | 'authorized' | 'unauthorized' | 'not-in-table';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { session } = useSession();
  const { signOut } = useClerk();
  const [state, setState] = useState<CheckState>('loading');

  useEffect(() => {
    // Once we've determined the user isn't in the table and called signOut(),
    // Clerk flips isSignedIn to false. Guard against that re-triggering this
    // effect and overwriting the 'not-in-table' state with 'unauthorized'.
    if (state === 'not-in-table') return;

    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      setState('unauthorized');
      return;
    }

    const checkVendorUser = async () => {
      // Use Clerk-authenticated client so Supabase RLS can verify the caller.
      const authedSupabase = await getSupabaseWithAuth(session);

      const { data, error } = await authedSupabase
        .from('vendor_users')
        .select('role')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        await signOut();
        setState('not-in-table');
      } else {
        setState('authorized');
      }
    };

    checkVendorUser();
  }, [isLoaded, isSignedIn, user?.id, session, state]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (state === 'not-in-table') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-700 text-lg font-medium">
          You are not authorized to access this platform.
        </p>
      </div>
    );
  }

  if (state === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
