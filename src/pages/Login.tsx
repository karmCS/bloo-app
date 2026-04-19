import { SignIn } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back to restaurants</span>
        </button>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold italic text-primary">bloo</h1>
          <p className="text-ink-muted text-sm mt-1">Admin portal</p>
        </div>

        <SignIn fallbackRedirectUrl="/auth-redirect" />
      </div>
    </div>
  );
}
