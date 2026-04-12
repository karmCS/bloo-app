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

  const { email, paymentMethod, totalPrice, items } = location.state || {};

  useEffect(() => {
    if (!email || !paymentMethod || totalPrice == null || !items) {
      navigate('/cart');
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
  }, [email, paymentMethod, totalPrice, items, navigate]);

  if (loading || !orderId) {
    return (
      <div className="min-h-screen bg-dark-bg-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-dark-border border-t-primary"></div>
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
    <div className="min-h-screen bg-dark-bg-1 font-sans">
      <header className="bg-dark-bg-2 border-b border-dark-border/40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="text-primary" size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white font-brand leading-none">bloo</h1>
              <p className="text-dark-text-muted text-[10px]">Payment Instructions</p>
            </div>
          </div>
          {!confirmed && (
            <Link to="/" className="text-sm text-dark-text hover:text-white transition-colors">
              Return to Homepage
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {!confirmed ? (
          <div className="space-y-4">
            <div className="bg-dark-bg-2 rounded-xl border border-dark-border/40 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-meal">Order Placed!</h2>
                  <p className="text-dark-text-muted text-sm">Order #{orderId.slice(0, 8)}</p>
                </div>
              </div>
              <div className="h-px bg-dark-border/40 mb-4"></div>
              <div className="space-y-2">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.meal.image_url}
                        alt={item.meal.name}
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      />
                      <span className="text-dark-text text-sm">{item.meal.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-dark-text-muted text-xs">x{item.quantity}</span>
                      <span className="text-white text-sm font-semibold">
                        ${(item.meal.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-dark-border/40 mt-3">
                  <span className="text-xs font-bold text-dark-text uppercase tracking-wider">Total</span>
                  <span className="text-xl font-bold text-white">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-dark-bg-2 rounded-xl border border-primary/30 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Payment Instructions
              </h3>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between p-4 bg-dark-form rounded-xl border border-dark-border/40">
                  <div>
                    <div className="text-dark-text-muted text-xs mb-1 uppercase tracking-wider">{paymentInfo.label}</div>
                    <div className="text-white font-bold">{paymentInfo.contact}</div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      copied
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'bg-primary hover:bg-primary-hover text-white'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-dark-form rounded-xl border border-dark-border/40">
                  <div>
                    <div className="text-dark-text-muted text-xs mb-1 uppercase tracking-wider">Amount to Send</div>
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
                <p className="text-xs font-bold text-dark-text uppercase tracking-wider">Next Steps</p>
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
                      <span className="text-dark-text text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="bg-dark-bg-2 rounded-xl border border-dark-border/40 p-4">
              <p className="text-dark-text text-sm">
                A confirmation email will be sent to <span className="text-white font-semibold">{email}</span>
              </p>
            </div>

            {emailError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-semibold">{emailError}</p>
                  <p className="text-red-400/70 text-xs mt-1">Please try again or contact support.</p>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={sendingEmails}
              className="w-full py-4 bg-primary hover:bg-primary-hover active:bg-primary-active disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(74,144,226,0.3)] text-sm"
            >
              {sendingEmails ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  Sending Confirmation...
                </span>
              ) : (
                "I've Sent Payment"
              )}
            </button>

            <p className="text-center text-dark-text-muted text-xs">
              Our team will verify your payment and confirm your order shortly
            </p>
          </div>
        ) : (
          <div className="bg-dark-bg-2 rounded-2xl border border-dark-border/40 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-white font-meal mb-3">Thank You!</h2>
            <p className="text-dark-text mb-2">We've received your payment confirmation.</p>
            <p className="text-dark-text-muted text-sm mb-8">
              You'll receive an email once we verify your payment and confirm your order.
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-dark-border border-t-primary"></div>
              <p className="text-dark-text-muted text-sm">Redirecting to homepage...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
