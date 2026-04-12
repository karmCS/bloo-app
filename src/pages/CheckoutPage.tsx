import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft, Smartphone, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  const { items, totalPrice, loading } = useCart();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'zelle' | 'venmo'>('zelle');

  useEffect(() => {
    if (!loading && items.length === 0) {
      navigate('/cart');
    }
  }, [loading, items.length, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/payment-instructions', {
      state: { email, paymentMethod, totalPrice, items },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-line border-t-primary" />
      </div>
    );
  }

  if (items.length === 0) return null;

  const paymentOptions = [
    {
      id: 'zelle' as const,
      label: 'Zelle',
      description: 'Pay directly with Zelle',
      icon: CreditCard,
    },
    {
      id: 'venmo' as const,
      label: 'Venmo',
      description: 'Pay via Venmo',
      icon: Smartphone,
    },
  ];

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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-ink placeholder:text-ink-faint text-sm outline-none focus:border-primary/60 transition-colors"
                    placeholder="your@email.com"
                  />
                  <p className="text-ink-muted text-xs mt-2 font-normal">
                    Order confirmation will be sent to this email
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-line p-6 shadow-sm">
                <h3 className="text-sm font-bold text-ink font-sans font-semibold mb-4 uppercase tracking-wider">
                  Payment Method
                </h3>
                <div className="space-y-3">
                  {paymentOptions.map(({ id, label, description, icon: Icon }) => (
                    <label
                      key={id}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        paymentMethod === id
                          ? 'border-primary/60 bg-primary/10'
                          : 'border-line bg-surface hover:border-primary/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={id}
                        checked={paymentMethod === id}
                        onChange={() => setPaymentMethod(id)}
                        className="sr-only"
                      />
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === id ? 'bg-primary' : 'bg-page'
                      }`}>
                        <Icon size={18} className={paymentMethod === id ? 'text-white' : 'text-ink-muted'} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold text-sm ${paymentMethod === id ? 'text-ink' : 'text-ink-muted'}`}>{label}</div>
                        <div className="text-ink-muted text-xs font-normal">{description}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === id ? 'border-primary' : 'border-line'
                      }`}>
                        {paymentMethod === id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(74,144,226,0.3)] text-sm"
              >
                Continue to Payment
              </button>
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
                      <div className="text-xs font-semibold text-ink truncate font-meal">{item.meal.name}</div>
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
