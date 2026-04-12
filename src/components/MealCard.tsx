import { Meal } from '../lib/supabase';
import { ShoppingCart, Flame } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useState } from 'react';

interface MealCardProps {
  meal: Meal;
  onClick: () => void;
}

export default function MealCard({ meal, onClick }: MealCardProps) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className="bg-card rounded-2xl overflow-hidden cursor-pointer group border border-line/80 hover:border-primary/35 transition-all duration-300 hover:shadow-[0px_8px_24px_rgba(74,144,226,0.12)] flex flex-col shadow-sm"
      onClick={onClick}
    >
      <div className="relative overflow-hidden" style={{ height: '160px' }}>
        <img
          src={meal.image_url}
          alt={meal.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-card/95 backdrop-blur-sm rounded-full border border-line shadow-sm">
          <Flame size={11} className="text-primary" />
          <span className="text-ink text-xs font-semibold">{meal.calories}</span>
          <span className="text-ink-muted text-[10px]">cal</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-ink mb-0.5 font-meal group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-snug">
          {meal.name}
        </h3>
        <p className="text-ink-muted text-xs font-sans font-normal mb-3">
          by {meal.vendor}
        </p>

        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-line/70">
          <div className="flex-1 text-center">
            <div className="text-ink text-xs font-semibold">{meal.protein}g</div>
            <div className="text-ink-muted text-[10px] uppercase tracking-wider">protein</div>
          </div>
          <div className="w-px h-6 bg-line/80" />
          <div className="flex-1 text-center">
            <div className="text-ink text-xs font-semibold">{meal.carbs}g</div>
            <div className="text-ink-muted text-[10px] uppercase tracking-wider">carbs</div>
          </div>
          <div className="w-px h-6 bg-line/80" />
          <div className="flex-1 text-center">
            <div className="text-ink text-xs font-semibold">{meal.fats}g</div>
            <div className="text-ink-muted text-[10px] uppercase tracking-wider">fat</div>
          </div>
        </div>

        {meal.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {meal.dietary_tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full uppercase tracking-wide border border-primary/20"
              >
                {tag}
              </span>
            ))}
            {meal.dietary_tags.length > 2 && (
              <span className="px-2 py-0.5 bg-surface text-ink text-[10px] rounded-full border border-line/80">
                +{meal.dietary_tags.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xl font-bold text-ink">${meal.price.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
              adding
                ? 'bg-green-600/15 text-green-700 border border-green-600/25'
                : 'bg-primary hover:bg-primary-hover active:bg-primary-active text-white shadow-[0px_4px_12px_rgba(74,144,226,0.3)]'
            }`}
          >
            <ShoppingCart size={14} />
            {adding ? 'Added!' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
