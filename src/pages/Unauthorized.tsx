import { useClerk } from '@clerk/react';
import { UtensilsCrossed } from 'lucide-react';
import Button from '../components/Button';

export default function Unauthorized() {
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <UtensilsCrossed className="text-primary" size={32} />
          <h1 className="text-3xl font-bold text-primary font-brand tracking-wide">bloo</h1>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-3">Access Denied</h2>
        <p className="text-gray-600 mb-8">
          You are not authorized to access this platform. Contact your administrator.
        </p>

        <Button variant="secondary" onClick={() => signOut({ redirectUrl: '/' })}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
