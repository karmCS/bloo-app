import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMealsByVendor } from '../hooks/useMealsByVendor';
import { useActiveVendors } from '../hooks/useActiveVendors';
import MealCard from '../components/MealCard';
import MealDetailModal from '../components/MealDetailModal';
import { Meal } from '../lib/supabase';

export default function RestaurantPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { meals, loading: mealsLoading } = useMealsByVendor(vendorId ?? null);
  const { vendors } = useActiveVendors();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const vendor = vendors.find(v => v.id === vendorId);

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMeal(null), 300);
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back nav */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink text-sm font-medium transition-colors duration-150 mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
          All restaurants
        </button>

        {/* Vendor header */}
        <header className="mb-10 animate-fadeIn">
          {vendor?.logo_url && (
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-line mb-4 shadow-sm">
              <img src={vendor.logo_url} alt={vendor.name} className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="font-display text-3xl font-semibold text-ink leading-tight">
            {vendor?.name ?? 'Restaurant'}
          </h1>
          {!mealsLoading && (
            <p className="text-ink-muted text-sm mt-1">
              {meals.length} {meals.length === 1 ? 'dish' : 'dishes'}
            </p>
          )}
        </header>

        {/* Meal grid */}
        {mealsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-surface animate-pulse border border-line" style={{ aspectRatio: '4/3' }} />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-display text-xl font-semibold text-ink mb-2">No meals yet</p>
            <p className="text-ink-muted text-sm">This restaurant hasn't added any meals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {meals.map((meal, i) => (
              <MealCard
                key={meal.id}
                meal={meal}
                index={i}
                onClick={() => handleMealClick(meal)}
              />
            ))}
          </div>
        )}
      </div>

      <MealDetailModal
        meal={selectedMeal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
