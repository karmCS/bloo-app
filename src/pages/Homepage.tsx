import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Instagram, ArrowRight } from 'lucide-react';
import { useActiveVendors } from '../hooks/useActiveVendors';
import { useMeals } from '../hooks/useMeals';
import { useReveal } from '../hooks/useReveal';
import Footer from '../components/Footer';
import MealDetailModal from '../components/MealDetailModal';
import { Meal } from '../lib/supabase';

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-1.02-.09z" />
    </svg>
  );
}

export default function Homepage() {
  const { vendors, loading: vendorsLoading } = useActiveVendors();
  const { meals } = useMeals();
  const [search, setSearch] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const motw = useMemo(() => meals.find(m => m.is_meal_of_week) ?? null, [meals]);

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMeal(null), 300);
  };

  const filteredVendors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      v =>
        v.name.toLowerCase().includes(q) ||
        (v.description ?? '').toLowerCase().includes(q) ||
        (v.editorial_body ?? '').toLowerCase().includes(q)
    );
  }, [vendors, search]);

  const mealsByVendor = useMemo(() => {
    const m = new Map<string, number>();
    for (const meal of meals) {
      if (!meal.vendor_id) continue;
      m.set(meal.vendor_id, (m.get(meal.vendor_id) ?? 0) + 1);
    }
    return m;
  }, [meals]);

  const heroReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>(0.05);

  const scrollToDirectory = () => {
    document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-page font-sans text-ink">
      {/* Top nav */}
      <header className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-4 flex items-center justify-between gap-4 animate-fadeIn">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white flex items-center justify-center shadow-[0_4px_16px_rgba(124,185,232,.25)] anim-float shrink-0">
            <img src="/favicon-minimal.svg" alt="" className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-none">
              <span className="italic text-primary">bloo</span>
            </div>
            <div className="text-xs text-ink-muted mt-1 truncate">A community driven wellness project</div>
          </div>
        </div>
        <button
          type="button"
          onClick={scrollToDirectory}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-card text-sm font-semibold text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
        >
          Meet the kitchens
        </button>
      </header>

      {/* ===== Hero ===== */}
      <section className="px-4 sm:px-6">
        <div className="max-w-[1240px] mx-auto relative overflow-hidden rounded-[28px] border border-line bg-card">
          <div className="oval" style={{ width: 360, height: 360, background: '#7CB9E8', top: -80, left: -60, animationDelay: '-2s' }} />
          <div className="oval" style={{ width: 260, height: 260, background: '#D4522A', top: 180, right: -60, animationDelay: '-5s' }} />
          <div className="oval" style={{ width: 200, height: 200, background: '#2D6A4F', bottom: -40, left: '40%', opacity: 0.32, animationDelay: '-3s' }} />

          <div ref={heroReveal} className="reveal relative px-6 sm:px-10 lg:px-12 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur border border-line text-[11px] font-bold uppercase tracking-widest text-ink">
                <span className="live-dot" />
                Loma Linda
              </span>
              <h1
                className="font-display font-semibold tracking-tight text-ink mt-5 sm:mt-6"
                style={{ fontSize: 'clamp(36px, 6vw, 60px)', lineHeight: 1.02 }}
              >
                Rooted in one of the world's <span className="italic text-primary">Blue Zones</span>.
              </h1>
              <p className="text-ink-muted text-base sm:text-[17px] mt-5 sm:mt-6 max-w-xl leading-relaxed">
                Every kitchen here is a neighbor, a story, and a menu measured to the gram.{' '}
                <span className="italic text-primary font-medium">bloo</span> is the front door to the cooks feeding the Loma Linda Blue Zone — browse the kitchens, read who's behind them, and see what they're cooking this week.
              </p>
              <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToDirectory}
                  className="glow-cta px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-primary text-white text-sm font-bold sheen cursor-pointer"
                >
                  Meet the kitchens →
                </button>
              </div>
              <div className="mt-7 sm:mt-8 flex items-center gap-4 sm:gap-5">
                <div className="flex -space-x-2">
                  {(vendorsLoading ? [] : vendors.slice(0, 3)).map((v, i) => (
                    <div
                      key={v.id}
                      className={`w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold overflow-hidden ${
                        i === 0 ? 'bg-macro-green/15 text-macro-green' : i === 1 ? 'bg-primary/15 text-primary-active' : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {v.logo_url ? (
                        <img src={v.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        v.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  ))}
                  {!vendorsLoading && vendors.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-surface border-2 border-card flex items-center justify-center text-[10px] font-bold text-ink-muted">
                      +{vendors.length - 3}
                    </div>
                  )}
                </div>
                <div className="text-xs text-ink-muted font-medium">
                  {vendorsLoading
                    ? '…'
                    : `${vendors.length} neighborhood ${vendors.length === 1 ? 'kitchen' : 'kitchens'}`}
                </div>
              </div>
            </div>

            {/* Meal of the Week card */}
            {motw && (
              <div className="lg:col-span-5 flex lg:justify-end">
                <button
                  type="button"
                  onClick={() => handleMealClick(motw)}
                  className="group relative block w-full max-w-[320px] rounded-3xl overflow-hidden border border-line bg-card text-left cursor-pointer anim-float"
                  style={{ boxShadow: '0 18px 40px -16px rgba(26,26,26,.25)', animationDelay: '-1s' }}
                  aria-label={`Meal of the week — ${motw.name}`}
                >
                  <div className="relative h-44 sm:h-48 overflow-hidden">
                    <img
                      src={motw.image_url}
                      alt={motw.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest">
                      Meal of the week
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="font-display text-lg font-semibold leading-tight text-ink group-hover:text-primary-active transition-colors">
                      {motw.name}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5 truncate">{motw.vendor}</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-macro-green/10 text-macro-green">
                        {motw.protein}g P
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary-active">
                        {motw.carbs}g C
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                        {motw.fats}g F
                      </span>
                      <span className="ml-auto text-[10px] font-semibold text-ink-muted">{motw.calories} cal</span>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== Directory ===== */}
      <section id="directory" className="px-4 sm:px-6 mt-12 sm:mt-16 pb-20 sm:pb-28">
        <div className="max-w-[1240px] mx-auto">
          <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">The Kitchens</div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold">Every kitchen bloo knows</h2>
            </div>
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-line bg-card focus-within:border-primary/40 transition-colors">
              <Search size={14} className="text-ink-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search kitchens…"
                className="bg-transparent outline-none text-sm text-ink placeholder:text-ink-muted w-36 sm:w-48"
                aria-label="Search kitchens"
              />
            </label>
          </div>

          {vendorsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-line bg-card">
                  <div className="skel" style={{ aspectRatio: '4/3' }} />
                  <div className="p-5 space-y-2">
                    <div className="skel h-5 w-1/2" />
                    <div className="skel h-3 w-full" />
                    <div className="skel h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-line bg-card/50">
              <p className="font-display text-xl font-semibold text-ink">
                {vendors.length === 0 ? 'No kitchens yet' : 'No kitchens match that search'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-3 text-sm text-primary-active font-semibold hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div
              ref={gridReveal}
              className="reveal stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filteredVendors.map((v, i) => {
                const count = mealsByVendor.get(v.id) ?? 0;
                return (
                  <Link
                    key={v.id}
                    to={`/restaurant/${v.id}`}
                    className="meal-card group block bg-card rounded-2xl overflow-hidden border border-line cursor-pointer animate-staggerIn"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      {v.logo_url ? (
                        <img
                          src={v.logo_url}
                          alt={v.name}
                          className="meal-img w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-accent/10">
                          <span className="font-display italic text-5xl text-primary/60">
                            {v.name.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {count > 0 && (
                        <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 bg-ink/80 text-white text-[10px] font-bold rounded-full tracking-wide uppercase backdrop-blur">
                          {count} {count === 1 ? 'dish' : 'dishes'}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-xl font-semibold text-ink leading-tight mb-1.5 group-hover:text-primary-active transition-colors">
                        {v.name}
                      </h3>
                      {v.description && (
                        <p className="text-sm text-ink-muted leading-relaxed line-clamp-2 mb-4">
                          {v.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
                        <div className="flex gap-2 text-ink-muted">
                          {v.instagram_handle && (
                            <span className="inline-flex items-center" aria-hidden>
                              <Instagram size={14} />
                            </span>
                          )}
                          {v.tiktok_handle && (
                            <span className="inline-flex items-center" aria-hidden>
                              <TikTokIcon size={13} />
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-active group-hover:gap-1.5 transition-all">
                          View profile <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />

      <MealDetailModal meal={selectedMeal} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
