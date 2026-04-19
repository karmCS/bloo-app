import { Meal } from '../lib/supabase';

interface MealCardProps {
  meal: Meal;
  onClick: () => void;
  index?: number;
}

export default function MealCard({ meal, onClick, index = 0 }: MealCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-card rounded-2xl overflow-hidden border border-line hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-staggerIn"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={meal.image_url}
          alt={meal.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4">
        <h3 className="font-display text-[15px] font-semibold text-ink leading-snug line-clamp-2 mb-3">
          {meal.name}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full border border-accent/20">
            🔥 {meal.calories} cal
          </span>
          <span className="text-ink-muted text-xs font-medium">P {meal.protein}g</span>
          <span className="text-ink-faint text-xs">·</span>
          <span className="text-ink-muted text-xs font-medium">C {meal.carbs}g</span>
          <span className="text-ink-faint text-xs">·</span>
          <span className="text-ink-muted text-xs font-medium">F {meal.fats}g</span>
        </div>
      </div>
    </div>
  );
}
