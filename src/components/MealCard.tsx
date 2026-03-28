import { Meal } from '../lib/supabase';

interface MealCardProps {
  meal: Meal;
  onClick: () => void;
}

export default function MealCard({ meal, onClick }: MealCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={meal.image_url}
          alt={meal.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-text mb-1">{meal.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{meal.vendor}</p>
        <div className="flex justify-between text-xs text-gray-600">
          <div>
            <span className="font-medium">{meal.calories}</span> cal
          </div>
          <div>
            <span className="font-medium">{meal.protein}g</span> protein
          </div>
          <div>
            <span className="font-medium">{meal.carbs}g</span> carbs
          </div>
          <div>
            <span className="font-medium">{meal.fats}g</span> fats
          </div>
        </div>
        {meal.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {meal.dietary_tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
