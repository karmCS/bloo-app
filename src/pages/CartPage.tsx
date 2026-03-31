import { useCart } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

export default function CartPage() {
  const { items, totalPrice, removeFromCart, updateQuantity, loading } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
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
              to="/"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Menu
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 font-meal mb-2">Your Cart</h2>
          <p className="text-gray-600">Review your items and proceed to checkout</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
            <ShoppingBag className="mx-auto text-gray-300 mb-6" size={80} />
            <h3 className="text-2xl font-bold text-gray-800 mb-3 font-meal">
              Your cart is empty
            </h3>
            <p className="text-gray-500 mb-8">
              Add some delicious meals to get started
            </p>
            <Link to="/">
              <Button>Browse Meals</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-6">
                    <img
                      src={item.meal.image_url}
                      alt={item.meal.name}
                      className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 font-meal mb-1">
                            {item.meal.name}
                          </h3>
                          <p className="text-sm text-gray-600 font-vendor">
                            by {item.meal.vendor}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ${(item.meal.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${item.meal.price.toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 sticky top-6">
                <h3 className="text-2xl font-bold text-gray-900 font-meal mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Items</span>
                    <span className="font-semibold">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline mb-8">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 text-lg"
                >
                  Proceed to Checkout
                </Button>

                <Link to="/">
                  <button className="w-full mt-3 py-3 text-primary hover:bg-blue-50 rounded-lg transition-colors font-semibold">
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
