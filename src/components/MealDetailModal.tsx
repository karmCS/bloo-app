import { Meal } from '../lib/supabase';
import { X, Flame, Fish, Wheat, Droplet, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useState } from 'react';

interface MealDetailModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MealDetailModal({ meal, isOpen, onClose }: MealDetailModalProps) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  if (!meal || !isOpen) return null;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(meal);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setTimeout(() => setAdding(false), 600);
    }
  };

  /** Dismiss modal only — do not use history.back() (avoids jumping to Clerk/auth routes → /unauthorized). */
  const handleBackdropClick = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
      <div
        className="fixed inset-0 bg-page/95 backdrop-blur-md z-0"
        onClick={handleBackdropClick}
        aria-hidden
      />

      <button
        type="button"
        onClick={onClose}
        className="fixed top-6 right-6 z-[60] p-2.5 bg-card text-ink hover:bg-surface rounded-xl border border-line shadow-sm hover:border-primary/40 transition-all duration-200"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      <div className="fixed inset-0 z-20 flex items-center justify-center p-6 pointer-events-none min-h-screen">
        <div
          className="relative w-full max-w-3xl pointer-events-auto bg-card rounded-2xl shadow-2xl border border-line overflow-hidden animate-slideUp"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="meal-detail-title"
        >
          <div className="relative h-56 overflow-hidden">
            <img
              src={meal.image_url}
              alt={meal.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-8 right-8">
              <h2
                id="meal-detail-title"
                className="text-3xl font-bold text-white mb-1 font-meal leading-tight drop-shadow-md"
              >
                {meal.name}
              </h2>
              <p className="text-white/90 text-sm font-sans font-normal">by {meal.vendor}</p>
            </div>
          </div>

          <div className="p-8">
            {meal.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {meal.dietary_tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20 uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">Nutrition Facts</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Flame, label: 'Calories', value: meal.calories, unit: '' },
                  { icon: Fish, label: 'Protein', value: meal.protein, unit: 'g' },
                  { icon: Wheat, label: 'Carbs', value: meal.carbs, unit: 'g' },
                  { icon: Droplet, label: 'Fats', value: meal.fats, unit: 'g' },
                ].map(({ icon: Icon, label, value, unit }) => (
                  <div key={label} className="bg-surface rounded-xl p-4 text-center border border-line/80">
                    <Icon className="mx-auto mb-2 text-primary" size={20} />
                    <div className="text-xl font-bold text-ink mb-0.5">
                      {value}{unit}
                    </div>
                    <div className="text-ink-muted text-[10px] uppercase tracking-wider font-semibold">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-3">Ingredients</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {meal.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-ink leading-relaxed">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            {meal.description && (
              <div className="mb-6 p-4 bg-surface rounded-xl border border-line/80">
                <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-2">About This Meal</h3>
                <p className="text-ink text-sm leading-relaxed">{meal.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-6 pt-4 border-t border-line/80">
              <div>
                <span className="text-3xl font-bold text-ink">${meal.price.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                  adding
                    ? 'bg-green-600/15 text-green-700 border border-green-600/25'
                    : 'bg-primary hover:bg-primary-hover active:bg-primary-active text-white shadow-[0px_4px_12px_rgba(74,144,226,0.35)]'
                }`}
              >
                <ShoppingCart size={20} />
                {adding ? 'Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
