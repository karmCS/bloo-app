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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-dark-bg-1/95 backdrop-blur-md"></div>

        <button
          onClick={onClose}
          className="fixed top-6 right-6 z-20 p-2.5 bg-dark-form text-dark-text hover:text-white rounded-xl border border-dark-border/60 hover:bg-dark-border/60 transition-all duration-200"
        >
          <X size={20} />
        </button>

        <div
          className="relative z-10 flex items-center justify-center min-h-screen p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-3xl w-full bg-dark-bg-2 rounded-2xl shadow-2xl border border-dark-border/60 overflow-hidden animate-slideUp">
            <div className="relative h-56 overflow-hidden">
              <img
                src={meal.image_url}
                alt={meal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-bg-2 via-dark-bg-2/40 to-transparent"></div>
              <div className="absolute bottom-6 left-8 right-8">
                <h2 className="text-3xl font-bold text-white mb-1 font-meal leading-tight">
                  {meal.name}
                </h2>
                <p className="text-dark-text text-sm font-vendor">by {meal.vendor}</p>
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
                <h3 className="text-sm font-semibold text-dark-text uppercase tracking-wider mb-4">Nutrition Facts</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: Flame, label: 'Calories', value: meal.calories, unit: '' },
                    { icon: Fish, label: 'Protein', value: meal.protein, unit: 'g' },
                    { icon: Wheat, label: 'Carbs', value: meal.carbs, unit: 'g' },
                    { icon: Droplet, label: 'Fats', value: meal.fats, unit: 'g' },
                  ].map(({ icon: Icon, label, value, unit }) => (
                    <div key={label} className="bg-dark-form rounded-xl p-4 text-center border border-dark-border/40">
                      <Icon className="mx-auto mb-2 text-primary" size={20} />
                      <div className="text-xl font-bold text-white mb-0.5">
                        {value}{unit}
                      </div>
                      <div className="text-dark-text-muted text-[10px] uppercase tracking-wider font-semibold">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-dark-text uppercase tracking-wider mb-3">Ingredients</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {meal.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                      <span className="text-sm text-dark-text leading-relaxed">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>

              {meal.description && (
                <div className="mb-6 p-4 bg-dark-form rounded-xl border border-dark-border/40">
                  <h3 className="text-sm font-semibold text-dark-text uppercase tracking-wider mb-2">About This Meal</h3>
                  <p className="text-dark-text text-sm leading-relaxed">{meal.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-6 pt-4 border-t border-dark-border/40">
                <div>
                  <span className="text-3xl font-bold text-white">${meal.price.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                    adding
                      ? 'bg-green-600/20 text-green-400 border border-green-600/30'
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
    </div>
  );
}
