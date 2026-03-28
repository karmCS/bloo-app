import Modal from './Modal';
import { Meal } from '../lib/supabase';

interface MealDetailModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MealDetailModal({ meal, isOpen, onClose }: MealDetailModalProps) {
  if (!meal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative">
        <div className="aspect-[16/9] overflow-hidden rounded-t-xl">
          <img
            src={meal.image_url}
            alt={meal.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-text mb-2">{meal.name}</h2>
            <p className="text-sm text-slate-500">{meal.vendor}</p>
          </div>

          {meal.dietary_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {meal.dietary_tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-text mb-4">Nutrition Facts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-background rounded-lg p-4 text-center">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Calories</div>
                <div className="font-bold text-base text-primary">{meal.calories}</div>
              </div>
              <div className="bg-background rounded-lg p-4 text-center">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Protein</div>
                <div className="font-bold text-base text-primary">{meal.protein}g</div>
              </div>
              <div className="bg-background rounded-lg p-4 text-center">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Carbs</div>
                <div className="font-bold text-base text-primary">{meal.carbs}g</div>
              </div>
              <div className="bg-background rounded-lg p-4 text-center">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Fats</div>
                <div className="font-bold text-base text-primary">{meal.fats}g</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-text mb-4">Ingredients</h3>
            <ul className="space-y-2">
              {meal.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mt-2 mr-3"></span>
                  <span className="text-sm leading-relaxed text-gray-700">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
