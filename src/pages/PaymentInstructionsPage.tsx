import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, CheckCircle, Copy, Check, AlertCircle } from 'lucide-react';
import { supabase, OrderItem } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { sendOrderEmails } from '../services/emailService';

const PAYMENT_INFO = {
  zelle: {
    contact: 'payments@bloo.com',
    label: 'Email/Phone',
  },
  venmo: {
    contact: '@bloo-meals',
    label: 'Venmo Handle',
  },
};

export default function PaymentInstructionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const { email, paymentMethod, totalPrice, items, csrfToken } = location.state || {};

  useEffect(() => {
    if (
      !email ||
      !paymentMethod ||
      totalPrice == null ||
      !items ||
      typeof csrfToken !== 'string' ||
      csrfToken.length === 0
    ) {
      navigate('/checkout');
      return;
    }

    const createOrder = async () => {
      try {
        const orderItems: OrderItem[] = items.map((item: any) => ({
          meal_id: item.meal.id,
          meal_name: item.meal.name,
          price: item.meal.price,
          quantity: item.quantity,
        }));

        const { data, error } = await supabase
          .from('orders')
          .insert([
            {
              user_email: email,
              items: orderItems,
              total_price: totalPrice,
              payment_method: paymentMethod,
              status: 'pending',
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setOrderId(data.id);
        setLoading(false);
      } catch (error) {
        console.error('Error creating order:', error);
        alert('Failed to create order. Please try again.');
        navigate('/checkout');
      }
    };

    createOrder();
  }, [email, paymentMethod, totalPrice, items, csrfToken, navigate]);

  if (loading || !orderId) {
    return (
      <div className="min-h-screen bg-page flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-line border-t-primary" />
      </div>
    );
  }

  const paymentInfo = PAYMENT_INFO[paymentMethod as 'zelle' | 'venmo'];

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentInfo.contact);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    setSendingEmails(true);
    setEmailError(null);

    try {
      const orderItems = items.map((item: any) => ({
        meal_name: item.meal.name,
        price: item.meal.price,
        quantity: item.quantity,
      }));

      await sendOrderEmails({
        orderId,
        email,
        paymentMethod,
        totalPrice,
        items: orderItems,
        csrfToken,
      });

      setConfirmed(true);
      await clearCart();

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error sending emails:', error);
      setEmailError(error instanceof Error ? error.message : 'Failed to send confirmation emails');
      setSendingEmails(false);
    }
  };

  return (
    <div className="min-h-screen bg-page font-sans">
      <header className="bg-card border-b border-line px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="text-primary" size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-ink font-brand leading-none">bloo</h1>
              <p className="text-ink-muted text-[10px] font-medium">Payment Instructions</p>
            </div>
          </div>
          {!confirmed && (
            <Link to="/" className="text-sm text-ink-muted hover:text-primary transition-colors font-medium">
              Return to Homepage
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {!confirmed ? (
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-line p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-ink font-sans font-semibold">Order Placed!</h2>
                  <p className="text-ink-muted text-sm font-normal">Order #{orderId.slice(0, 8)}</p>
                </div>
              </div>
              <div className="h-px bg-line/80 mb-4" />
              <div className="space-y-2">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.meal.image_url}
                        alt={item.meal.name}
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      />
                      <span className="text-ink text-sm font-medium">{item.meal.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-ink-muted text-xs">x{item.quantity}</span>
                      <span className="text-ink text-sm font-semibold">
                        ${(item.meal.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-line/80 mt-3">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">Total</span>
                  <span className="text-xl font-bold text-ink">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-primary/25 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-4 font-semibold">
                Payment Instructions
              </h3>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line">
                  <div>
                    <div className="text-ink-muted text-xs mb-1 uppercase tracking-wider font-medium">{paymentInfo.label}</div>
                    <div className="text-ink font-bold">{paymentInfo.contact}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      copied
                        ? 'bg-green-600/15 text-green-700 border border-green-600/25'
                        : 'bg-primary hover:bg-primary-hover text-white'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line">
                  <div>
                    <div className="text-ink-muted text-xs mb-1 uppercase tracking-wider font-medium">Amount to Send</div>
                    <div className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-primary">
                  Important: Include order #{orderId.slice(0, 8)} in your payment note
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-ink uppercase tracking-wider">Next Steps</p>
                <ol className="space-y-1.5">
                  {[
                    `Open ${paymentMethod === 'zelle' ? 'Zelle' : 'Venmo'} app`,
                    `Send $${totalPrice.toFixed(2)} to ${paymentInfo.contact}`,
                    `Add order #${orderId.slice(0, 8)} in the note`,
                    `Click "I've Sent Payment" below`,
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-ink text-sm font-normal">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-line p-4 shadow-sm">
              <p className="text-ink text-sm font-normal">
                A confirmation email will be sent to <span className="text-ink font-semibold">{email}</span>
              </p>
            </div>

            {emailError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 text-sm font-semibold">{emailError}</p>
                  <p className="text-red-600/80 text-xs mt-1">Please try again or contact support.</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={sendingEmails}
              className="w-full py-4 bg-primary hover:bg-primary-hover active:bg-primary-active disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(37,99,235,0.3)] text-sm"
            >
              {sendingEmails ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Sending Confirmation...
                </span>
              ) : (
                "I've Sent Payment"
              )}
            </button>

            <p className="text-center text-ink-muted text-xs font-normal">
              Our team will verify your payment and confirm your order shortly
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-line p-12 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/25 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-ink font-sans font-semibold mb-3">Thank You!</h2>
            <p className="text-ink mb-2 font-normal">We&apos;ve received your payment confirmation.</p>
            <p className="text-ink-muted text-sm mb-8 font-normal">
              You&apos;ll receive an email once we verify your payment and confirm your order.
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-line border-t-primary" />
              <p className="text-ink-muted text-sm font-normal">Redirecting to homepage...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
