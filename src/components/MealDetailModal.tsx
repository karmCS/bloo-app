import { Meal } from '../lib/supabase';
import { X, Flame, Fish, Wheat, Droplet } from 'lucide-react';

interface MealDetailModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MealDetailModal({ meal, isOpen, onClose }: MealDetailModalProps) {
  if (!meal || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div className="min-h-screen relative">
        <div className="fixed inset-0">
          <img
            src={meal.image_url}
            alt={meal.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        </div>

        <button
          onClick={onClose}
          className="fixed top-6 right-6 z-20 p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20"
        >
          <X size={24} />
        </button>

        <div
          className="relative z-10 flex items-center justify-center min-h-screen p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-4xl w-full bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-8 md:p-12">
              <div className="mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 font-meal leading-tight">
                  {meal.name}
                </h2>
                <p className="text-xl text-gray-600 font-vendor tracking-wide">
                  by {meal.vendor}
                </p>
              </div>

              {meal.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-10">
                  {meal.dietary_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-4 py-2 bg-blue-50 text-primary text-sm font-semibold rounded-full uppercase tracking-wide border border-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-meal">
                  Nutrition Facts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 text-center border border-blue-100">
                    <Flame className="mx-auto mb-3 text-primary" size={28} />
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {meal.calories}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-gray-600 font-semibold">
                      Calories
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 text-center border border-blue-100">
                    <Fish className="mx-auto mb-3 text-primary" size={28} />
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {meal.protein}g
                    </div>
                    <div className="text-xs uppercase tracking-wider text-gray-600 font-semibold">
                      Protein
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 text-center border border-blue-100">
                    <Wheat className="mx-auto mb-3 text-primary" size={28} />
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {meal.carbs}g
                    </div>
                    <div className="text-xs uppercase tracking-wider text-gray-600 font-semibold">
                      Carbs
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 text-center border border-blue-100">
                    <Droplet className="mx-auto mb-3 text-primary" size={28} />
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {meal.fats}g
                    </div>
                    <div className="text-xs uppercase tracking-wider text-gray-600 font-semibold">
                      Fats
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-meal">
                  Ingredients
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {meal.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-base text-gray-700 leading-relaxed">
                        {ingredient}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
