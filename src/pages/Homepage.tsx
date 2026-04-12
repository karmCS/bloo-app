import { useMemo, useState } from 'react';
import { Meal } from '../lib/supabase';
import { useMeals } from '../hooks/useMeals';
import { useActiveVendors } from '../hooks/useActiveVendors';
import MealCard from '../components/MealCard';
import MealDetailModal from '../components/MealDetailModal';
import Footer from '../components/Footer';
import { UtensilsCrossed, ChevronDown, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export default function Homepage() {
  const { meals, loading } = useMeals();
  const { vendors: activeVendors, loading: vendorsLoading } = useActiveVendors();
  const { totalItems } = useCart();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const filteredMeals = useMemo(() => {
    if (!selectedVendorId) return meals;
    return meals.filter((m) => m.vendor_id === selectedVendorId);
  }, [meals, selectedVendorId]);

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMeal(null), 300);
  };

  const featuredMeal =
    filteredMeals.length > 0 ? filteredMeals[0] : null;

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="text-primary" size={28} />
              <h1 className="text-3xl font-bold text-primary font-brand tracking-wide">bloo</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/cart"
                className="relative group"
              >
                <ShoppingCart
                  className="text-gray-600 group-hover:text-primary transition-colors"
                  size={24}
                />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-primary transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      ) : meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-screen px-4">
          <UtensilsCrossed className="text-gray-300 mb-6" size={80} />
          <h2 className="text-3xl font-bold text-gray-800 mb-3 font-meal">
            No meals available yet
          </h2>
          <p className="text-gray-500 text-center max-w-md">
            Check back soon for this week's curated meals
          </p>
        </div>
      ) : (
        <>
          {featuredMeal && (
            <div className="relative h-screen w-full">
              <div className="absolute inset-0">
                <img
                  src={featuredMeal.image_url}
                  alt={featuredMeal.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60"></div>
              </div>

              <div className="relative h-full flex flex-col justify-end pb-12 px-6">
                <div className="max-w-7xl mx-auto w-full">
                  <div className="max-w-2xl">
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-4 font-meal leading-tight">
                      {featuredMeal.name}
                    </h2>
                    <p className="text-xl md:text-2xl text-white/90 mb-6 font-vendor">
                      by {featuredMeal.vendor}
                    </p>
                    <div className="flex flex-wrap gap-3 mb-8">
                      {featuredMeal.dietary_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleMealClick(featuredMeal)}
                      className="px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <ChevronDown className="text-white/70" size={32} />
              </div>
            </div>
          )}

          <section className="bg-[#FDF8F3] pt-20 pb-24">
            <div className="max-w-7xl mx-auto px-6">
            <div className="mb-8">
              <h3 className="text-4xl font-bold text-gray-900 mb-4 font-meal">
                This Week's Menu
              </h3>
              <p className="text-gray-600 text-lg">
                Thoughtfully curated, nutrition-focused meals
              </p>
            </div>

            <div className="mb-10 -mx-1 px-1">
              <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth touch-pan-x [scrollbar-width:thin]">
                <button
                  type="button"
                  onClick={() => setSelectedVendorId(null)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-vendor font-medium transition-colors ${
                    selectedVendorId === null
                      ? 'bg-primary text-white shadow-sm'
                      : 'border-2 border-primary bg-white text-primary hover:bg-blue-50/80'
                  }`}
                >
                  All
                </button>
                {vendorsLoading ? (
                  <div className="flex gap-2 shrink-0 items-center">
                    <span className="h-9 w-20 animate-pulse rounded-full bg-stone-200/90" />
                    <span className="h-9 w-24 animate-pulse rounded-full bg-stone-200/90" />
                    <span className="h-9 w-28 animate-pulse rounded-full bg-stone-200/90" />
                  </div>
                ) : (
                  activeVendors.map((v) => {
                    const active = selectedVendorId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVendorId(v.id)}
                        className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-vendor font-medium transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-primary text-white shadow-sm'
                            : 'border-2 border-primary bg-white text-primary hover:bg-blue-50/80'
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {filteredMeals.length === 0 ? (
              <p className="text-center text-gray-500 font-vendor py-16">
                No meals for this vendor yet. Try another filter.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMeals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onClick={() => handleMealClick(meal)} />
                ))}
              </div>
            )}
            </div>
          </section>
        </>
      )}

      <MealDetailModal meal={selectedMeal} isOpen={isModalOpen} onClose={handleCloseModal} />

      <Footer />
    </div>
  );
}
