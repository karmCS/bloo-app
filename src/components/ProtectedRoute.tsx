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
    if (state === 'not-in-table') return;
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      setState('unauthorized');
      return;
    }

    const checkVendorUser = async () => {
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
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-primary" />
      </div>
    );
  }

  if (state === 'not-in-table') {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <p className="text-ink font-sans font-medium">You are not authorized to access this platform.</p>
      </div>
    );
  }

  if (state === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
