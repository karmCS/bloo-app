import { SignIn, useAuth } from '@clerk/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

export default function AdminLogin() {
  const { isLoaded, isSignedIn } = useAuth();

  // If already signed in, bounce through the role router.
  if (isLoaded && isSignedIn) {
    return <Navigate to="/auth-redirect" replace />;
  }

  return (
    <div className="min-h-screen bg-ink text-white grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] overflow-hidden">
      {/* LEFT — form */}
      <div className="relative flex flex-col px-6 sm:px-12 lg:px-20 py-10 lg:py-14 bg-page text-ink">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-[0_4px_16px_rgba(124,185,232,.25)]">
              <img src="/favicon-minimal.svg" alt="" className="w-5 h-5" />
            </div>
            <span className="font-display text-xl font-semibold italic text-primary">bloo</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={13} /> Back to bloo
          </Link>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[440px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink/6 border border-ink/10 text-[10px] font-bold uppercase tracking-widest text-ink">
              <ShieldCheck size={12} />
              Admin access
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.02] mt-8">
              Keep the <span className="italic text-primary">catalog</span><br />honest.
            </h1>
            <p className="text-ink-muted text-[15px] leading-relaxed mt-6 max-w-[400px]">
              Sign in to manage vendors, meals, macros, and the weekly editorial. This portal is for Loma Linda bloo administrators.
            </p>

            <div className="mt-12">
              <SignIn
                fallbackRedirectUrl="/auth-redirect"
                signUpUrl={undefined}
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none border border-line bg-white rounded-2xl',
                    formButtonPrimary:
                      'bg-ink hover:bg-black text-white rounded-xl text-[13px] font-semibold tracking-[0.01em]',
                    socialButtonsBlockButton: 'rounded-xl border-line',
                    formFieldInput: 'rounded-xl border-line',
                    headerTitle: 'font-display text-lg',
                    footerActionText: 'hidden',
                    footerActionLink: 'hidden',
                    footer: 'hidden',
                  },
                }}
              />
            </div>

            <p className="text-xs text-ink-muted italic leading-relaxed mt-10 pt-6 border-t border-line">
              Not an admin?{' '}
              <Link
                to="/vendor"
                className="text-primary-active font-semibold hover:underline not-italic"
              >
                Vendors sign in here →
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 text-[11px] text-ink-faint font-mono mt-8">
          <span>eatbloo.com</span>
          <span>Loma Linda, CA</span>
        </div>
      </div>

      {/* RIGHT — editorial panel */}
      <div className="hidden lg:flex relative p-10 items-stretch">
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-ink via-ink to-[#1a1a1a]">
          {/* Glow */}
          <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] bg-primary/30" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] bg-accent/30" />
          </div>

          {/* Grain */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              mixBlendMode: 'overlay',
            }}
            aria-hidden
          />

          <div className="relative h-full flex flex-col p-10 lg:p-12">
            <div className="flex items-center gap-2 text-[11px] font-mono text-white/60 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Admin portal
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur">
                  <img src="/favicon-minimal.svg" alt="" className="w-12 h-12" />
                </div>
                <p className="font-display italic text-2xl sm:text-3xl font-medium text-white mt-6">
                  for the <span className="text-primary">bloo</span> crew
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
