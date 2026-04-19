import { Meal } from '../lib/supabase';
import { X } from 'lucide-react';

interface MealDetailModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
}

const macros = (meal: Meal) => [
  { label: 'Calories', value: meal.calories, unit: '', color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
  { label: 'Protein',  value: meal.protein,  unit: 'g', color: 'text-macro-green', bg: 'bg-macro-green/10 border-macro-green/20' },
  { label: 'Carbs',    value: meal.carbs,    unit: 'g', color: 'text-ink',         bg: 'bg-surface border-line' },
  { label: 'Fats',     value: meal.fats,     unit: 'g', color: 'text-ink',         bg: 'bg-surface border-line' },
];

export default function MealDetailModal({ meal, isOpen, onClose }: MealDetailModalProps) {
  if (!meal || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fadeIn">
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-0 z-10 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-2xl bg-card rounded-3xl shadow-2xl overflow-hidden animate-slideUp my-4"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="meal-modal-title"
        >
          {/* Hero image */}
          <div className="relative h-64 overflow-hidden">
            <img
              src={meal.image_url}
              alt={meal.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white transition-colors duration-150"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-5 left-6 right-6">
              <h2
                id="meal-modal-title"
                className="font-display text-2xl font-semibold text-white leading-tight"
              >
                {meal.name}
              </h2>
              <p className="text-white/70 text-sm mt-0.5 font-sans">{meal.vendor}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Dietary tags */}
            {meal.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {meal.dietary_tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/25 uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Macro grid */}
            <div>
              <h3 className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">
                Nutrition
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {macros(meal).map(({ label, value, unit, color, bg }) => (
                  <div key={label} className={`rounded-2xl border p-3 text-center ${bg}`}>
                    <div className={`font-display text-2xl font-semibold ${color}`}>
                      {value}{unit}
                    </div>
                    <div className="text-ink-muted text-[10px] uppercase tracking-wider mt-0.5 font-sans">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {meal.description && (
              <div>
                <h3 className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">
                  About
                </h3>
                <p className="text-ink text-sm leading-relaxed">{meal.description}</p>
              </div>
            )}

            {/* Ingredients */}
            {meal.ingredients.length > 0 && (
              <div>
                <h3 className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">
                  Ingredients
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {meal.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm text-ink leading-relaxed">{ing}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase CTA — reserved for when ordering is re-enabled */}
            {/* <div className="pt-2 border-t border-line">
              <button className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl transition-colors duration-200">
                Add to cart
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
