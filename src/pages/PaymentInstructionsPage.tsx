import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, CheckCircle, Copy, Check } from 'lucide-react';
import Button from '../components/Button';
import { supabase, OrderItem } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';

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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
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
    setConfirmed(true);

    try {
      const orderItems = items.map((item: any) => ({
        meal_name: item.meal.name,
        price: item.meal.price,
        quantity: item.quantity,
      }));

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-emails`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          email,
          paymentMethod,
          totalPrice,
          items: orderItems,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to send emails:', errorText);
        throw new Error('Failed to send confirmation emails');
      }

      const result = await response.json();
      console.log('Emails sent successfully:', result);

      await clearCart();
    } catch (error) {
      console.error('Error sending emails:', error);
    }

    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-primary font-brand tracking-wide">bloo</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {!confirmed ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 font-meal mb-2">
                Order Confirmed!
              </h2>
              <p className="text-gray-600">
                Order #{orderId.slice(0, 8)}
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-8 mb-8 border border-blue-100">
              <h3 className="text-2xl font-bold text-gray-900 font-meal mb-6 text-center">
                Payment Instructions
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">{paymentInfo.label}</div>
                    <div className="text-lg font-bold text-gray-900">{paymentInfo.contact}</div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Amount to Send</div>
                    <div className="text-3xl font-bold text-primary">
                      ${totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-semibold">
                  Important: Please include your order number (#{orderId.slice(0, 8)}) in the payment note
                </p>
              </div>

              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-semibold">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Open {paymentMethod === 'zelle' ? 'Zelle' : 'Venmo'} app</li>
                  <li>Send ${totalPrice.toFixed(2)} to {paymentInfo.contact}</li>
                  <li>Add order #{orderId.slice(0, 8)} in the note</li>
                  <li>Click "I've Completed Payment" below</li>
                </ol>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Order Confirmation</h4>
              <p className="text-sm text-gray-600">
                A confirmation email has been sent to <strong>{email}</strong> with your order details and payment instructions.
              </p>
            </div>

            <Button
              onClick={handleConfirm}
              className="w-full py-4 text-lg"
            >
              I've Completed Payment
            </Button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Our team will verify your payment and confirm your order shortly
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="text-green-600" size={48} />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 font-meal mb-4">
              Thank You!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              We've received your payment confirmation.
            </p>
            <p className="text-gray-600 mb-8">
              You'll receive an email once we verify your payment and confirm your order.
            </p>
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Redirecting to homepage...</p>
            </div>
          </div>
        )}

        {!confirmed && (
          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
