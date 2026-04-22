import { SignIn, useAuth } from '@clerk/react';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

export default function VendorLogin() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/auth-redirect" replace />;
  }

  return (
    <div className="min-h-screen bg-page text-ink grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] overflow-hidden">
      {/* LEFT — editorial / welcome panel */}
      <div className="hidden lg:flex relative p-10 items-stretch">
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-primary/15 via-page to-accent/10 border border-line">
          {/* Soft blobs */}
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl bg-primary/30" aria-hidden />
          <div className="absolute top-1/3 -right-10 w-60 h-60 rounded-full blur-3xl bg-accent/25" aria-hidden />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full blur-3xl bg-macro-green/15" aria-hidden />

          <div className="relative h-full flex flex-col p-10 lg:p-12">
            <div className="flex items-center gap-2 text-[11px] font-bold text-ink-muted uppercase tracking-widest">
              <span className="live-dot" />
              Vendor portal
            </div>

            <div className="flex-1 flex items-center">
              <div>
                <h2 className="font-display text-4xl sm:text-[44px] font-semibold tracking-tight leading-[1.03] text-ink max-w-md">
                  Your kitchen, on the <span className="italic text-primary">record</span>.
                </h2>
                <p className="text-ink-muted text-[15px] leading-relaxed mt-5 max-w-md">
                  Post the week's menu, manage your photo gallery, and keep macros honest. This is the portal Loma Linda's cooks use to show up on bloo.
                </p>

                {/* Feature chips */}
                <ul className="mt-8 space-y-3 max-w-sm">
                  {[
                    ['Weekly menu toggles', 'Mark what\'s cooking for the week.'],
                    ['Editorial + gallery', 'Tell your story. Show the kitchen.'],
                    ['Direct to diner', 'Every dish links straight to you.'],
                  ].map(([title, sub]) => (
                    <li key={title} className="flex gap-3 items-start">
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-primary/15 text-primary-active flex items-center justify-center text-[11px] font-bold">✓</span>
                      <div>
                        <div className="text-sm font-semibold text-ink">{title}</div>
                        <div className="text-xs text-ink-muted italic">{sub}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-ink-faint font-mono">
              <span>Loma Linda, CA</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="relative flex flex-col px-6 sm:px-12 lg:px-20 py-10 lg:py-14">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary-active">
              <ChefHat size={12} />
              Vendor sign in
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.02] mt-8">
              Welcome <span className="italic text-primary">back</span>, chef.
            </h1>
            <p className="text-ink-muted text-[15px] leading-relaxed mt-6 max-w-[400px]">
              Sign in to manage this week's menu, update your kitchen profile, and track your public page on bloo.
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
                      'bg-primary hover:bg-primary-hover text-white rounded-xl text-[13px] font-semibold tracking-[0.01em]',
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

            <div className="mt-10 pt-6 border-t border-line space-y-2">
              <p className="text-xs text-ink-muted leading-relaxed">
                New vendor?{' '}
                <a
                  href="mailto:team@eatbloo.com?subject=Become%20a%20bloo%20vendor"
                  className="text-primary-active font-semibold hover:underline"
                >
                  Email team@eatbloo.com
                </a>{' '}
                — we'll get you set up.
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Admin?{' '}
                <Link
                  to="/admin"
                  className="text-primary-active font-semibold hover:underline"
                >
                  Sign in here →
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

