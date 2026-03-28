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
        <h3 className="text-lg font-semibold text-text mb-1 font-meal">{meal.name}</h3>
        <p className="text-sm text-slate-500 mb-3 font-vendor">{meal.vendor}</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-0.5">Cal</div>
            <div className="font-bold text-base text-text">{meal.calories}</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-0.5">Protein</div>
            <div className="font-bold text-base text-text">{meal.protein}g</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-0.5">Carbs</div>
            <div className="font-bold text-base text-text">{meal.carbs}g</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-0.5">Fats</div>
            <div className="font-bold text-base text-text">{meal.fats}g</div>
          </div>
        </div>
        {meal.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {meal.dietary_tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full"
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
