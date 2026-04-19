import { useClerk } from '@clerk/react';
import Button from '../components/Button';

export default function Unauthorized() {
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <h1 className="font-display text-4xl font-semibold italic text-primary mb-2">bloo</h1>
        <h2 className="font-display text-xl font-semibold text-ink mb-3">Access Denied</h2>
        <p className="text-ink-muted text-sm mb-8">
          You are not authorized to access this platform. Contact your administrator.
        </p>
        <Button variant="secondary" onClick={() => signOut({ redirectUrl: '/' })}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
