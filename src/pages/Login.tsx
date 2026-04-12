import { SignIn } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-6 font-sans">
      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-ink-muted hover:text-primary transition-colors mb-6 group font-medium"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to homepage</span>
        </button>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <UtensilsCrossed className="text-primary" size={20} />
          </div>
          <h1 className="text-2xl font-bold text-ink font-brand tracking-wide">bloo</h1>
        </div>

        <SignIn fallbackRedirectUrl="/auth-redirect" />
      </div>
    </div>
  );
}
