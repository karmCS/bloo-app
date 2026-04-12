import { Meal } from '../lib/supabase';
import { ShoppingCart } from 'lucide-react';
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
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group border border-gray-100 flex flex-col"
    >
      <div onClick={onClick} className="cursor-pointer">
        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={meal.image_url}
            alt={meal.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col" onClick={onClick}>
        <h3 className="text-2xl font-bold text-gray-900 mb-1 font-meal group-hover:text-primary transition-colors duration-300">
          {meal.name}
        </h3>
        <p className="text-sm text-gray-600 font-vendor tracking-wide">
          {meal.vendor}
        </p>

        {meal.description && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-2">
            {meal.description}
          </p>
        )}

        <div className="flex justify-between items-center mt-6 mb-5 pb-5 border-b border-gray-100">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{meal.calories}</span>
            <span className="text-sm text-gray-500 uppercase tracking-wider">cal</span>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{meal.protein}g</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">protein</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{meal.carbs}g</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">carbs</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{meal.fats}g</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">fat</div>
            </div>
          </div>
        </div>

        {meal.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {meal.dietary_tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-3 py-1 bg-blue-50 text-primary text-xs font-semibold rounded-full uppercase tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">${meal.price.toFixed(2)}</span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                adding
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-white hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              <ShoppingCart size={18} />
              {adding ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
