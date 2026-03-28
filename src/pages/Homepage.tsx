import { useState, useEffect } from 'react';
import { supabase, Meal } from '../lib/supabase';
import MealCard from '../components/MealCard';
import MealDetailModal from '../components/MealDetailModal';
import Footer from '../components/Footer';
import { UtensilsCrossed } from 'lucide-react';

export default function Homepage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeals(data || []);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMeal(null), 300);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="text-primary" size={32} />
              <h1 className="text-3xl font-bold text-primary font-brand">bloo</h1>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 hidden sm:block">
              This week's curated meals
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="mx-auto text-gray-400 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              No meals available yet
            </h2>
            <p className="text-sm leading-relaxed text-slate-500">Check back soon for this week's curated meals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onClick={() => handleMealClick(meal)} />
            ))}
          </div>
        )}
      </main>

      <MealDetailModal meal={selectedMeal} isOpen={isModalOpen} onClose={handleCloseModal} />

      <Footer />
    </div>
  );
}
