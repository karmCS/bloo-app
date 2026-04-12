import { useMemo, useState } from 'react';
import { Meal } from '../lib/supabase';
import { useMeals } from '../hooks/useMeals';
import { useActiveVendors } from '../hooks/useActiveVendors';
import MealCard from '../components/MealCard';
import MealDetailModal from '../components/MealDetailModal';
import Footer from '../components/Footer';
import { UtensilsCrossed, ShoppingCart, Search, Home, Bell, Settings, BarChart2, Tag, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const NAV_ICONS = [
  { icon: Home, label: 'Home', active: true },
  { icon: Tag, label: 'Promos', active: false },
  { icon: BarChart2, label: 'Dashboard', active: false },
  { icon: Bell, label: 'Notifications', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

export default function Homepage() {
  const { meals, loading } = useMeals();
  const { vendors: activeVendors, loading: vendorsLoading } = useActiveVendors();
  const { totalItems } = useCart();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeals = useMemo(() => {
    let result = meals;
    if (selectedVendorId) result = result.filter((m) => m.vendor_id === selectedVendorId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.vendor.toLowerCase().includes(q) ||
          (m.description ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [meals, selectedVendorId, searchQuery]);

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMeal(null), 300);
  };

  return (
    <div className="flex min-h-screen bg-dark-bg-1 font-sans">
      <aside className="fixed top-0 left-0 h-full w-16 bg-dark-bg-2 flex flex-col items-center py-4 z-30 border-r border-dark-border/40">
        <div className="mb-6 flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <UtensilsCrossed className="text-primary" size={20} />
        </div>

        <nav className="flex flex-col items-center gap-1 flex-1">
          {NAV_ICONS.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 group ${
                active
                  ? 'bg-primary shadow-[0px_4px_12px_rgba(74,144,226,0.35)]'
                  : 'hover:bg-dark-form'
              }`}
            >
              <Icon
                size={18}
                className={active ? 'text-white' : 'text-dark-text group-hover:text-white transition-colors'}
              />
              <div className="absolute left-14 bg-dark-bg-2 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-dark-border/60 shadow-lg z-50">
                {label}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          <Link to="/cart" className="relative group">
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-dark-form ${totalItems > 0 ? 'bg-primary/10' : ''}`}>
              <ShoppingCart size={18} className={totalItems > 0 ? 'text-primary' : 'text-dark-text group-hover:text-white transition-colors'} />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          <Link to="/login">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-form transition-all duration-200 group">
              <LogIn size={18} className="text-dark-text group-hover:text-white transition-colors" />
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex-1 ml-16 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-dark-bg-2/95 backdrop-blur-sm border-b border-dark-border/40 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white font-brand tracking-wide leading-none">bloo</h1>
              <p className="text-dark-text-muted text-xs mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-form rounded-xl border border-dark-border/60 focus-within:border-primary/60 transition-colors">
                <Search size={14} className="text-dark-text-muted flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for food, vendors..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-dark-text-muted"
                />
              </div>
            </div>

            <Link
              to="/cart"
              className="relative flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover active:bg-primary-active text-white rounded-xl transition-all duration-200 text-sm font-semibold shadow-[0px_4px_12px_rgba(74,144,226,0.3)]"
            >
              <ShoppingCart size={16} />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-dark-border border-t-primary"></div>
            </div>
          ) : meals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 px-4">
              <div className="w-20 h-20 rounded-full bg-dark-form flex items-center justify-center mb-6">
                <UtensilsCrossed className="text-dark-text-muted" size={36} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-meal">No meals available yet</h2>
              <p className="text-dark-text text-center max-w-sm">Check back soon for this week's curated meals</p>
            </div>
          ) : (
            <>
              {filteredMeals.length > 0 && !searchQuery && (
                <div
                  className="relative rounded-2xl overflow-hidden mb-8 cursor-pointer group"
                  style={{ height: '280px' }}
                  onClick={() => handleMealClick(filteredMeals[0])}
                >
                  <img
                    src={filteredMeals[0].image_url}
                    alt={filteredMeals[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <div className="max-w-xl">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {filteredMeals[0].dietary_tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-primary/20 backdrop-blur-sm text-primary text-xs font-semibold rounded-full border border-primary/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-1 font-meal leading-tight">
                        {filteredMeals[0].name}
                      </h2>
                      <p className="text-dark-text text-sm mb-4 font-vendor">by {filteredMeals[0].vendor}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-white">${filteredMeals[0].price.toFixed(2)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMealClick(filteredMeals[0]); }}
                          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(74,144,226,0.35)]"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white font-meal">This Week's Menu</h3>
                  <span className="text-dark-text-muted text-sm">{filteredMeals.length} dishes</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    onClick={() => setSelectedVendorId(null)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedVendorId === null
                        ? 'bg-primary text-white shadow-[0px_4px_12px_rgba(74,144,226,0.3)]'
                        : 'bg-dark-form text-dark-text hover:text-white border border-dark-border/60'
                    }`}
                  >
                    All
                  </button>
                  {vendorsLoading ? (
                    <>
                      <div className="shrink-0 h-9 w-20 animate-pulse rounded-xl bg-dark-form" />
                      <div className="shrink-0 h-9 w-24 animate-pulse rounded-xl bg-dark-form" />
                      <div className="shrink-0 h-9 w-28 animate-pulse rounded-xl bg-dark-form" />
                    </>
                  ) : (
                    activeVendors.map((v) => {
                      const active = selectedVendorId === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVendorId(v.id)}
                          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                            active
                              ? 'bg-primary text-white shadow-[0px_4px_12px_rgba(74,144,226,0.3)]'
                              : 'bg-dark-form text-dark-text hover:text-white border border-dark-border/60'
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
                <div className="flex flex-col items-center justify-center py-24">
                  <p className="text-dark-text text-center font-vendor">No meals match your search. Try a different keyword.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMeals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} onClick={() => handleMealClick(meal)} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>

      <MealDetailModal meal={selectedMeal} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
