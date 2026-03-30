import { useState } from 'react';
import { Meal } from '../lib/supabase';
import { useMeals } from '../hooks/useMeals';
import MealCard from '../components/MealCard';
import MealDetailModal from '../components/MealDetailModal';
import Footer from '../components/Footer';
import { UtensilsCrossed, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Homepage() {
  const { meals, loading } = useMeals();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMeal(null), 300);
  };

  const featuredMeal = meals.length > 0 ? meals[0] : null;

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="text-primary" size={28} />
              <h1 className="text-3xl font-bold text-primary font-brand tracking-wide">bloo</h1>
            </div>
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              Admin
            </Link>
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

          <section className="max-w-7xl mx-auto px-6 pt-20 pb-20">
            <div className="mb-12">
              <h3 className="text-4xl font-bold text-gray-900 mb-4 font-meal">
                This Week's Menu
              </h3>
              <p className="text-gray-600 text-lg">
                Thoughtfully curated, nutrition-focused meals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} onClick={() => handleMealClick(meal)} />
              ))}
            </div>
          </section>
        </>
      )}

      <MealDetailModal meal={selectedMeal} isOpen={isModalOpen} onClose={handleCloseModal} />

      <Footer />
    </div>
  );
}
