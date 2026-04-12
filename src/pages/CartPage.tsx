import { useCart } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { items, totalPrice, removeFromCart, updateQuantity, loading } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-line border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page font-sans">
      <header className="bg-card border-b border-line px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="text-primary" size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-ink font-brand leading-none">bloo</h1>
              <p className="text-ink-muted text-[10px] font-medium">Order Summary</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-ink-muted hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft size={16} />
            Back to Menu
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-ink font-sans font-semibold mb-1">Your Cart</h2>
          <p className="text-ink-muted text-sm font-normal">Review your items and proceed to checkout</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-card rounded-2xl border border-line p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-5 border border-line">
              <ShoppingBag className="text-ink-faint" size={28} />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2 font-sans font-semibold">Your cart is empty</h3>
            <p className="text-ink-muted text-sm mb-6 font-normal">Add some delicious meals to get started</p>
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
                  className="bg-card rounded-xl border border-line p-4 hover:border-primary/30 transition-all duration-200 shadow-sm"
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
                          <h3 className="text-sm font-bold text-ink font-meal mb-0.5">
                            {item.meal.name}
                          </h3>
                          <p className="text-ink-muted text-xs font-sans font-normal">
                            by {item.meal.vendor}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-surface hover:bg-line/80 rounded-lg border border-line text-ink transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold text-ink w-6 text-center">
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
                          <div className="text-lg font-bold text-ink">
                            ${((item.meal.price ?? 0) * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-ink-muted text-xs">
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
              <div className="bg-card rounded-xl border border-line p-6 sticky top-6 shadow-sm">
                <h3 className="text-base font-bold text-ink font-sans font-semibold mb-5">Order Summary</h3>

                <div className="space-y-3 mb-5 pb-5 border-b border-line/80">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted">Subtotal</span>
                    <span className="font-semibold text-ink">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted">Items</span>
                    <span className="font-semibold text-ink">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted">Discount</span>
                    <span className="font-semibold text-ink">$0</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-sm font-bold text-ink uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-bold text-ink">${totalPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(74,144,226,0.3)] text-sm"
                >
                  Continue to Payment
                </button>

                <Link to="/">
                  <button type="button" className="w-full mt-2.5 py-3 text-ink-muted hover:text-ink text-sm font-semibold rounded-xl transition-colors hover:bg-surface border border-transparent hover:border-line">
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
