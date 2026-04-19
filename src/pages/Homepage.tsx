import { useMemo, useState } from 'react';
import { Meal } from '../lib/supabase';
import { useMeals } from '../hooks/useMeals';
import { useActiveVendors } from '../hooks/useActiveVendors';
import MealCard from '../components/MealCard';
import MealDetailModal from '../components/MealDetailModal';
import Footer from '../components/Footer';
import { UtensilsCrossed, ShoppingCart, Home, LogIn, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export default function Homepage() {
  const { meals, loading } = useMeals();
  const { vendors: activeVendors, loading: vendorsLoading } = useActiveVendors();
  const { totalItems } = useCart();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const mealOfTheWeek = useMemo(() => meals.find((m) => m.is_meal_of_week) ?? null, [meals]);

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

  return (
    <div className="flex min-h-screen bg-page font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex fixed top-0 left-0 h-full w-16 bg-card flex-col items-center py-4 z-30 border-r border-line shadow-sm">
        <nav className="flex flex-col items-center gap-1 flex-1">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 group bg-primary shadow-[0px_4px_12px_rgba(37,99,235,0.35)]">
            <Home size={18} className="text-white" />
            <div className="absolute left-14 bg-ink text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-line shadow-lg z-50">
              Home
            </div>
          </div>

          {/* Archived navigation - restore when needed */}
          {/*
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 group hover:bg-surface">
            <Tag size={18} className="text-ink-muted group-hover:text-ink transition-colors" />
            <div className="absolute left-14 bg-ink text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-line shadow-lg z-50">
              Promos
            </div>
          </div>
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 group hover:bg-surface">
            <BarChart2 size={18} className="text-ink-muted group-hover:text-ink transition-colors" />
            <div className="absolute left-14 bg-ink text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-line shadow-lg z-50">
              Dashboard
            </div>
          </div>
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 group hover:bg-surface">
            <Bell size={18} className="text-ink-muted group-hover:text-ink transition-colors" />
            <div className="absolute left-14 bg-ink text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-line shadow-lg z-50">
              Notifications
            </div>
          </div>
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 group hover:bg-surface">
            <Settings size={18} className="text-ink-muted group-hover:text-ink transition-colors" />
            <div className="absolute left-14 bg-ink text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-line shadow-lg z-50">
              Settings
            </div>
          </div>
          */}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          <Link to="/login">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface transition-all duration-200 group">
              <LogIn size={18} className="text-ink-muted group-hover:text-ink transition-colors" />
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div className="sm:hidden fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute top-0 left-0 h-full w-72 bg-card border-r border-line shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UtensilsCrossed className="text-primary" size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold text-ink font-brand leading-none">bloo</div>
                  <div className="text-[11px] text-ink-muted font-medium mt-0.5">Menu</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-xl border border-line bg-card hover:bg-surface transition-colors"
                aria-label="Close"
              >
                <X size={18} className="text-ink" />
              </button>
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-primary text-white shadow-[0px_4px_12px_rgba(37,99,235,0.3)]"
              >
                <Home size={18} />
                <span className="text-sm font-semibold">Home</span>
              </button>

              <Link
                to="/cart"
                onClick={() => setMobileNavOpen(false)}
                className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-line bg-card hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart size={18} className="text-ink-muted" />
                  <span className="text-sm font-semibold text-ink">Cart</span>
                </div>
                {totalItems > 0 && (
                  <span className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              <Link
                to="/login"
                onClick={() => setMobileNavOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-line bg-card hover:bg-surface transition-colors"
              >
                <LogIn size={18} className="text-ink-muted" />
                <span className="text-sm font-semibold text-ink">Admin login</span>
              </Link>
            </div>

            <div className="mt-auto pt-4 border-t border-line">
              <p className="text-xs text-ink-muted font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 ml-0 sm:ml-16 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-line px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="sm:hidden w-10 h-10 shrink-0 rounded-xl border border-line bg-card hover:bg-surface transition-colors flex items-center justify-center"
                aria-label="Open menu"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu size={18} className="text-ink" />
              </button>
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-card"
                  aria-hidden
                >
                  <UtensilsCrossed className="text-primary" size={20} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-ink font-brand tracking-wide leading-none">bloo</h1>
                  <p className="text-ink-muted text-xs mt-0.5 font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/cart"
              className="relative flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover active:bg-primary-active text-white rounded-xl transition-all duration-200 text-sm font-semibold shadow-[0px_4px_12px_rgba(37,99,235,0.3)] shrink-0"
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
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-line border-t-primary" />
            </div>
          ) : meals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 px-4">
              <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-6 border border-line">
                <UtensilsCrossed className="text-ink-faint" size={36} />
              </div>
              <h2 className="text-2xl font-bold text-ink mb-2 font-sans font-semibold">No meals available yet</h2>
              <p className="text-ink-muted text-center max-w-sm font-normal">Check back soon for this week&apos;s curated meals</p>
            </div>
          ) : (
            <>
              {/* Meal of the week hero */}
              {mealOfTheWeek && (
                <div
                  className="relative rounded-2xl overflow-hidden mb-8 cursor-pointer group shadow-lg border border-line/60"
                  style={{ height: '320px' }}
                  onClick={() => handleMealClick(mealOfTheWeek)}
                >
                  <img
                    src={mealOfTheWeek.image_url}
                    alt={mealOfTheWeek.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Deep dual-tone gradient: rich left, transparent right */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10" />
                  {/* Subtle warm vignette at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  <div className="absolute inset-0 flex flex-col justify-between p-7 sm:p-9">
                    {/* Top label */}
                    <div className="flex items-center gap-2 w-fit">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-400/90 text-amber-950 backdrop-blur-sm shadow-md">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        Meal of the week
                      </span>
                    </div>

                    {/* Bottom content */}
                    <div className="max-w-lg">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {mealOfTheWeek.dietary_tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2.5 py-0.5 bg-white/10 backdrop-blur-sm text-white/90 text-[10.5px] font-semibold rounded-full border border-white/20 tracking-wide">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1.5 font-brand leading-tight drop-shadow-md tracking-tight">
                        {mealOfTheWeek.name}
                      </h2>
                      <p className="text-white/70 text-sm mb-5 font-medium">by {mealOfTheWeek.vendor}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-white font-brand">${mealOfTheWeek.price.toFixed(2)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMealClick(mealOfTheWeek); }}
                          className="px-5 py-2.5 bg-white text-ink text-sm font-bold rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg"
                        >
                          Order now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback hero when no meal of the week is set */}
              {!mealOfTheWeek && filteredMeals.length > 0 && (
                <div
                  className="relative rounded-2xl overflow-hidden mb-8 cursor-pointer group shadow-md border border-line/80"
                  style={{ height: '280px' }}
                  onClick={() => handleMealClick(filteredMeals[0])}
                >
                  <img
                    src={filteredMeals[0].image_url}
                    alt={filteredMeals[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <div className="max-w-xl">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {filteredMeals[0].dietary_tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-primary/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-primary/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-1 font-brand leading-tight drop-shadow-md">
                        {filteredMeals[0].name}
                      </h2>
                      <p className="text-white/90 text-sm mb-4 font-medium">by {filteredMeals[0].vendor}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-white">${filteredMeals[0].price.toFixed(2)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMealClick(filteredMeals[0]); }}
                          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-[0px_4px_12px_rgba(37,99,235,0.35)]"
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
                  <h3 className="text-lg font-bold text-ink font-sans font-semibold">This Week&apos;s Menu</h3>
                  <span className="text-ink-muted text-sm font-medium">{filteredMeals.length} dishes</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedVendorId(null)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedVendorId === null
                        ? 'bg-primary text-white shadow-[0px_4px_12px_rgba(37,99,235,0.3)]'
                        : 'bg-card text-ink-muted hover:text-ink border border-line shadow-sm'
                    }`}
                  >
                    All
                  </button>
                  {vendorsLoading ? (
                    <>
                      <div className="shrink-0 h-9 w-20 animate-pulse rounded-xl bg-surface border border-line/60" />
                      <div className="shrink-0 h-9 w-24 animate-pulse rounded-xl bg-surface border border-line/60" />
                      <div className="shrink-0 h-9 w-28 animate-pulse rounded-xl bg-surface border border-line/60" />
                    </>
                  ) : (
                    activeVendors.map((v) => {
                      const active = selectedVendorId === v.id;
                      return (
                        <button
                          type="button"
                          key={v.id}
                          onClick={() => setSelectedVendorId(v.id)}
                          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                            active
                              ? 'bg-primary text-white shadow-[0px_4px_12px_rgba(37,99,235,0.3)]'
                              : 'bg-card text-ink-muted hover:text-ink border border-line shadow-sm'
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
                  <p className="text-ink-muted text-center font-sans font-medium">No meals for this vendor. Try another filter.</p>
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
