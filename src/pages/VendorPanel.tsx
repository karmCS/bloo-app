import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClerk, UserProfile } from '@clerk/react';
import { supabase } from '../lib/supabase';
import { UtensilsCrossed, LogOut, UserCog } from 'lucide-react';
import Button from '../components/Button';

// TODO: Build out the vendor panel UI for managing vendor-specific meals and orders.
export default function VendorPanel() {
  const { slug } = useParams<{ slug: string }>();
  const { signOut } = useClerk();
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchVendor = async () => {
      const { data } = await supabase
        .from('vendors')
        .select('name')
        .eq('slug', slug)
        .maybeSingle();
      if (data?.name) setVendorName(data.name);
    };
    fetchVendor();
  }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="text-primary" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-primary font-brand tracking-wide">bloo</h1>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Vendor Portal</p>
                {vendorName && (
                  <p className="text-xs text-primary font-medium mt-0.5">Welcome, {vendorName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setShowProfile(true)}>
                <UserCog size={18} className="mr-2" />
                Manage Account
              </Button>
              <Button variant="secondary" onClick={() => signOut({ redirectUrl: '/' })}>
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
          <UtensilsCrossed className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-gray-500 text-lg">Vendor dashboard coming soon.</p>
        </div>
      </main>

      {showProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowProfile(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <UserProfile />
          </div>
        </div>
      )}
    </div>
  );
}
