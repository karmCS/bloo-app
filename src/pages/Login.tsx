import { SignIn } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent"></div>

      <div className="relative w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to homepage</span>
        </button>

        <div className="flex items-center justify-center gap-3 mb-6">
          <UtensilsCrossed className="text-primary" size={32} />
          <h1 className="text-3xl font-bold text-primary font-brand tracking-wide">bloo</h1>
        </div>

        <SignIn fallbackRedirectUrl="/auth-redirect" />
      </div>
    </div>
  );
}
