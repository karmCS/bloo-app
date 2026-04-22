import { Meal } from '../lib/supabase';

interface MealCardProps {
  meal: Meal;
  onClick: () => void;
  index?: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isNewThisWeek(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS_MS;
}

export default function MealCard({ meal, onClick, index = 0 }: MealCardProps) {
  const showNewBadge = isNewThisWeek(meal.created_at);

  return (
    <div
      onClick={onClick}
      className="meal-card group cursor-pointer bg-card rounded-2xl overflow-hidden border border-line animate-staggerIn"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={meal.image_url}
          alt={meal.name}
          className="meal-img w-full h-full object-cover"
        />

        {showNewBadge && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-full tracking-wide uppercase shadow-sm">
            New this week
          </span>
        )}

        {/* Slide-up macro strip on hover */}
        <div className="macro-strip">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300">Macros</div>
          <div className="flex flex-wrap gap-x-2 text-xs font-bold">
            <span>{meal.calories} kcal</span>
            <span className="opacity-60">·</span>
            <span>{meal.protein}g P</span>
            <span className="opacity-60">·</span>
            <span>{meal.carbs}g C</span>
            <span className="opacity-60">·</span>
            <span>{meal.fats}g F</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display text-[15px] font-semibold text-ink leading-snug line-clamp-2 mb-3">
          {meal.name}
        </h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-macro-green/10 text-macro-green">
            {meal.protein}g P
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary-active">
            {meal.carbs}g C
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent">
            {meal.fats}g F
          </span>
          <span className="ml-auto text-[10px] font-semibold text-ink-muted">{meal.calories} cal</span>
        </div>
      </div>
    </div>
  );
}
