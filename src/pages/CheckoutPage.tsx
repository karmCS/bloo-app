import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft, CreditCard } from 'lucide-react';
import Button from '../components/Button';
import { supabase, OrderItem } from '../lib/supabase';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'zelle' | 'venmo'>('zelle');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderItems: OrderItem[] = items.map((item) => ({
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

      await clearCart();

      navigate('/payment-instructions', {
        state: {
          orderId: data.id,
          email,
          paymentMethod,
          totalPrice,
        },
      });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="text-primary" size={28} />
              <h1 className="text-3xl font-bold text-primary font-brand tracking-wide">bloo</h1>
            </div>
            <Link
              to="/cart"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Cart
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 font-meal mb-2">Checkout</h2>
          <p className="text-gray-600">Complete your order details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 font-meal mb-6">
                  Contact Information
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="your@email.com"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Order confirmation will be sent to this email
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 font-meal mb-6">
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="zelle"
                      checked={paymentMethod === 'zelle'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'zelle')}
                      className="w-5 h-5 text-primary"
                    />
                    <div className="ml-4 flex items-center gap-3">
                      <CreditCard className="text-primary" size={24} />
                      <div>
                        <div className="font-semibold text-gray-900">Zelle</div>
                        <div className="text-sm text-gray-500">Pay with Zelle</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="venmo"
                      checked={paymentMethod === 'venmo'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'venmo')}
                      className="w-5 h-5 text-primary"
                    />
                    <div className="ml-4 flex items-center gap-3">
                      <CreditCard className="text-primary" size={24} />
                      <div>
                        <div className="font-semibold text-gray-900">Venmo</div>
                        <div className="text-sm text-gray-500">Pay with Venmo</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-lg"
              >
                {loading ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 font-meal mb-6">
                Order Summary
              </h3>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.meal.name}</div>
                      <div className="text-gray-500">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold text-gray-900">
                      ${(item.meal.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
