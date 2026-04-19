import { useEffect } from 'react';
import { useUser, useClerk, useSession } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSupabaseWithAuth } from '../lib/supabaseWithAuth';

export default function AuthRedirect() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { session } = useSession();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }

    const resolveRole = async () => {
      const email = user.primaryEmailAddress?.emailAddress;
      if (email) {
        await supabase.rpc('claim_vendor_invite', {
          p_email: email,
          p_clerk_user_id: user.id,
        });
      }

      const authedSupabase = await getSupabaseWithAuth(session);

      const { data: vendorUser, error } = await authedSupabase
        .from('vendor_users')
        .select('role, vendor_id')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (error || !vendorUser) {
        await signOut();
        navigate('/unauthorized', { replace: true });
        return;
      }

      if (vendorUser.role === 'superadmin') {
        navigate('/admin', { replace: true });
        return;
      }

      if (vendorUser.role === 'vendor') {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('slug')
          .eq('id', vendorUser.vendor_id)
          .maybeSingle();

        if (!vendor?.slug) {
          await signOut();
          navigate('/unauthorized', { replace: true });
          return;
        }

        navigate(`/admin/vendor/${vendor.slug}`, { replace: true });
        return;
      }

      await signOut();
      navigate('/unauthorized', { replace: true });
    };

    resolveRole();
  }, [isLoaded, isSignedIn, user?.id, session]);

  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-primary" />
    </div>
  );
}
