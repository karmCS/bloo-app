import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveVendors } from '../hooks/useActiveVendors';
import { useMeals } from '../hooks/useMeals';
import VendorCard from '../components/VendorCard';
import MealDetailModal from '../components/MealDetailModal';
import VendorModal from '../components/VendorModal';
import { Meal, Vendor } from '../lib/supabase';

export default function VendorGrid() {
  const { vendors, loading } = useActiveVendors();
  const { meals } = useMeals();
  const navigate = useNavigate();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  const featuredMeal = meals.find(m => m.is_meal_of_week) ?? null;

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMeal(null), 300);
  };

  const vendorMealCounts = vendors.reduce<Record<string, number>>((acc, v) => {
    acc[v.id] = meals.filter(m => m.vendor_id === v.id).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <header className="mb-10 animate-fadeIn">
          <div className="flex items-center gap-3">
            <img src="/favicon-minimal.svg" alt="bloo logo" className="w-12 h-12" />
            <h1 className="font-display text-5xl font-semibold italic text-primary leading-none tracking-tight">
              bloo
            </h1>
          </div>
          <p className="mt-3 text-ink-muted text-base">
            Track macros from your favourite local restaurants.
          </p>
        </header>

        {/* Meal of the Week hero */}
        {featuredMeal && (
          <div
            className="relative rounded-2xl overflow-hidden mb-12 cursor-pointer group shadow-md border border-line/60 animate-fadeIn"
            style={{ height: '300px' }}
            onClick={() => { setSelectedMeal(featuredMeal); setIsModalOpen(true); }}
          >
            <img
              src={featuredMeal.image_url}
              alt={featuredMeal.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-between p-7 sm:p-9">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-400/90 text-amber-950 backdrop-blur-sm shadow-md">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Meal of the week
                </span>
              </div>
              <div className="max-w-lg">
                {featuredMeal.dietary_tags.slice(0, 3).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {featuredMeal.dietary_tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-white/10 backdrop-blur-sm text-white/90 text-[10.5px] font-semibold rounded-full border border-white/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight mb-1">
                  {featuredMeal.name}
                </h2>
                <p className="text-white/70 text-sm mb-5">by {featuredMeal.vendor}</p>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-semibold">
                    🔥 {featuredMeal.calories} cal
                  </span>
                  <span className="text-white/70 text-xs">P {featuredMeal.protein}g · C {featuredMeal.carbs}g · F {featuredMeal.fats}g</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section heading */}
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-ink">Pick a restaurant</h2>
        </div>

        {/* Vendor grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-surface animate-pulse border border-line" style={{ aspectRatio: '4/3' }} />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-display text-2xl font-semibold text-ink mb-2">No restaurants yet</p>
            <p className="text-ink-muted text-sm">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {vendors.map((vendor, i) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                index={i}
                onClick={() => { setSelectedVendor(vendor); setIsVendorModalOpen(true); }}
              />
            ))}
          </div>
        )}

        {/* Vendor marquee */}
        {!loading && vendors.length > 0 && (
          <div className="mt-16 -mx-6 overflow-hidden border-y border-line bg-surface/40 py-4">
            <div className="marquee whitespace-nowrap">
              {[...vendors, ...vendors, ...vendors].map((v, i) => (
                <span key={`${v.id}-${i}`} className="inline-flex items-center gap-3 text-ink-muted font-display text-base">
                  <span className="w-1 h-1 rounded-full bg-ink-faint" />
                  <span>{v.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <MealDetailModal meal={selectedMeal} isOpen={isModalOpen} onClose={handleCloseModal} />


      <VendorModal
        vendor={selectedVendor}
        mealCount={selectedVendor ? (vendorMealCounts[selectedVendor.id] ?? 0) : undefined}
        isOpen={isVendorModalOpen}
        onClose={() => { setIsVendorModalOpen(false); setTimeout(() => setSelectedVendor(null), 300); }}
        onBrowse={() => { setIsVendorModalOpen(false); if (selectedVendor) navigate(`/restaurant/${selectedVendor.id}`); }}
      />
    </div>
  );
}
