import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, UtensilsCrossed } from 'lucide-react';

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const hasStripeSession = Boolean(sessionId?.trim());

  const heading = hasStripeSession ? 'Payment Successful!' : 'Order Confirmed';
  const subtext = hasStripeSession
    ? "Your order has been confirmed. You'll receive a confirmation email shortly."
    : 'Thank you for your order.';

  return (
    <div className="min-h-screen bg-page font-sans">
      <header className="bg-card border-b border-line px-6 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <UtensilsCrossed className="text-primary" size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-ink font-brand leading-none">bloo</h1>
            <p className="text-ink-muted text-[10px] font-medium">Order</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="bg-card rounded-2xl border border-line p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/25 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={36} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-ink font-sans font-semibold mb-3">{heading}</h2>
          <p className="text-ink-muted text-sm font-normal mb-8 leading-relaxed">{subtext}</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(37,99,235,0.3)] text-sm font-sans"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
