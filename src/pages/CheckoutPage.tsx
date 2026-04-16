import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft, CreditCard } from 'lucide-react';
import {
  validateCheckoutEmail,
  validateCartQuantities,
} from '../lib/checkoutValidation';
import { supabase, OrderItem } from '../lib/supabase';

export default function CheckoutPage() {
  const { items, totalPrice, loading } = useCart();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (!loading && items.length === 0) {
      navigate('/cart');
    }
  }, [loading, items.length, navigate]);

  const quantityError = useMemo(
    () => validateCartQuantities(items.map((i) => i.quantity)),
    [items]
  );

  const handlePayWithCard = async () => {
    setFormError(null);
    setStripeError(null);

    const emailErr = validateCheckoutEmail(email);
    if (emailErr) {
      setFormError(emailErr);
      return;
    }

    const qtyErr = validateCartQuantities(items.map((i) => i.quantity));
    if (qtyErr) {
      setFormError(qtyErr);
      return;
    }

    setPayLoading(true);

    try {
      const orderItems: OrderItem[] = items.map((item) => ({
        meal_id: item.meal.id,
        meal_name: item.meal.name,
        price: item.meal.price,
        quantity: item.quantity,
      }));

      const { data: orderRow, error: insertError } = await supabase
        .from('orders')
        .insert([
          {
            user_email: email.trim(),
            items: orderItems,
            total_price: totalPrice,
            payment_method: 'card',
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const orderId = orderRow.id;

      const cartItems = items.map((item) => {
        const unitPrice = item.meal.price ?? 0;
        const entry: {
          name: string;
          price: number;
          quantity: number;
          image?: string;
        } = {
          name: item.meal.name,
          price: unitPrice,
          quantity: item.quantity,
        };
        if (item.meal.image_url?.trim()) {
          entry.image = item.meal.image_url.trim();
        }
        return entry;
      });

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, cartItems }),
      });

      const data: unknown = await response.json().catch(() => null);
      const url =
        data &&
        typeof data === 'object' &&
        'url' in data &&
        typeof (data as { url: unknown }).url === 'string'
          ? (data as { url: string }).url
          : null;

      if (!response.ok) {
        const msg =
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Could not start checkout. Please try again.';
        throw new Error(msg);
      }

      if (!url) {
        throw new Error('Invalid response from checkout.');
      }

      window.location.href = url;
    } catch (err) {
      console.error(err);
      setStripeError(err instanceof Error ? err.message : 'Something went wrong.');
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-line border-t-primary" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-page font-sans">
      <header className="bg-card border-b border-line px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="text-primary" size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-ink font-brand leading-none">bloo</h1>
              <p className="text-ink-muted text-[10px] font-medium">Checkout</p>
            </div>
          </div>
          <Link
            to="/cart"
            className="flex items-center gap-2 text-sm text-ink-muted hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft size={16} />
            Back to Cart
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-ink font-sans font-semibold mb-1">Checkout</h2>
          <p className="text-ink-muted text-sm font-normal">Complete your order details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handlePayWithCard();
              }}
            >
              <div className="bg-card rounded-xl border border-line p-6 shadow-sm">
                <h3 className="text-sm font-bold text-ink font-sans font-semibold mb-4 uppercase tracking-wider">
                  Contact Information
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFormError(null);
                      setStripeError(null);
                    }}
                    required
                    className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-ink placeholder:text-ink-faint text-sm outline-none focus:border-primary/60 transition-colors"
                    placeholder="your@email.com"
                  />
                  <p className="text-ink-muted text-xs mt-2 font-normal">
                    Order confirmation will be sent to this email
                  </p>
                </div>
              </div>

              {(formError || quantityError) && (
                <div
                  role="alert"
                  className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-700 text-sm font-medium"
                >
                  {formError ?? quantityError}
                </div>
              )}

              <div className="bg-card rounded-xl border border-line p-6 shadow-sm">
                <h3 className="text-sm font-bold text-ink font-sans font-semibold mb-4 uppercase tracking-wider">
                  Payment
                </h3>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-active disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(37,99,235,0.3)] text-sm flex items-center justify-center gap-2 font-sans"
                >
                  {payLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      Processing...
                    </span>
                  ) : (
                    <>
                      <CreditCard size={18} className="flex-shrink-0" />
                      Pay with Card
                    </>
                  )}
                </button>
                {stripeError && (
                  <p
                    role="alert"
                    className="mt-3 text-sm font-medium text-red-700"
                  >
                    {stripeError}
                  </p>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-line p-6 sticky top-6 shadow-sm">
              <h3 className="text-sm font-bold text-ink font-sans font-semibold mb-5 uppercase tracking-wider">
                Order Summary
              </h3>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.meal.image_url}
                      alt={item.meal.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-ink truncate font-sans">{item.meal.name}</div>
                      <div className="text-ink-muted text-[10px] font-normal">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-xs font-bold text-ink flex-shrink-0">
                      ${((item.meal.price ?? 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-line/80 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">Total</span>
                  <span className="text-xl font-bold text-ink">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
