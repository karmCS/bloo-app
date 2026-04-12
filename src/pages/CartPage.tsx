import { useCart } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { items, totalPrice, removeFromCart, updateQuantity, loading } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-dark-border border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-1 font-sans">
      <header className="bg-dark-bg-2 border-b border-dark-border/40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="text-primary" size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white font-brand leading-none">bloo</h1>
              <p className="text-dark-text-muted text-[10px]">Order Summary</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-dark-text hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Menu
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white font-meal mb-1">Your Cart</h2>
          <p className="text-dark-text text-sm">Review your items and proceed to checkout</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-dark-bg-2 rounded-2xl border border-dark-border/40 p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-dark-form flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="text-dark-text-muted" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-meal">Your cart is empty</h3>
            <p className="text-dark-text text-sm mb-6">Add some delicious meals to get started</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(74,144,226,0.3)]"
            >
              Browse Meals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-dark-bg-2 rounded-xl border border-dark-border/40 p-4 hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.meal.image_url}
                      alt={item.meal.name}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-sm font-bold text-white font-meal mb-0.5">
                            {item.meal.name}
                          </h3>
                          <p className="text-dark-text-muted text-xs font-vendor">
                            by {item.meal.vendor}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-dark-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-dark-form hover:bg-dark-border/60 rounded-lg border border-dark-border/60 text-white transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold text-white w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-primary hover:bg-primary-hover rounded-lg text-white transition-colors shadow-[0px_2px_8px_rgba(74,144,226,0.3)]"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            ${((item.meal.price ?? 0) * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-dark-text-muted text-xs">
                            ${(item.meal.price ?? 0).toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-dark-bg-2 rounded-xl border border-dark-border/40 p-6 sticky top-6">
                <h3 className="text-base font-bold text-white font-meal mb-5">Order Summary</h3>

                <div className="space-y-3 mb-5 pb-5 border-b border-dark-border/40">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-text">Subtotal</span>
                    <span className="font-semibold text-white">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-text">Items</span>
                    <span className="font-semibold text-white">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-text">Discount</span>
                    <span className="font-semibold text-white">$0</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-sm font-bold text-dark-text uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-bold text-white">${totalPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(74,144,226,0.3)] text-sm"
                >
                  Continue to Payment
                </button>

                <Link to="/">
                  <button className="w-full mt-2.5 py-3 text-dark-text hover:text-white text-sm font-semibold rounded-xl transition-colors hover:bg-dark-form">
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
