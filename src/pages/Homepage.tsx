import { useEffect, useMemo, useRef, useState } from 'react';
import { Meal } from '../lib/supabase';
import { useMeals } from '../hooks/useMeals';
import { useActiveVendors } from '../hooks/useActiveVendors';
import { useReveal } from '../hooks/useReveal';
import MealCard from '../components/MealCard';
import MealDetailModal from '../components/MealDetailModal';
import Footer from '../components/Footer';

export default function Homepage() {
  const { meals, loading } = useMeals();
  const { vendors, loading: vendorsLoading } = useActiveVendors();

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePill, setActivePill] = useState<string>('all');

  const motw = useMemo(() => meals.find((m) => m.is_meal_of_week) ?? meals[0] ?? null, [meals]);

  const filteredMeals = useMemo(() => {
    if (activePill === 'all') return meals;
    if (activePill === 'high-protein') return meals.filter((m) => m.protein >= 30);
    if (activePill === 'under-600') return meals.filter((m) => m.calories < 600);
    return meals.filter((m) => m.vendor_id === activePill);
  }, [meals, activePill]);

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMeal(null), 300);
  };

  // Pill sliding indicator
  const pillRowRef = useRef<HTMLDivElement | null>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillIndicator, setPillIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const row = pillRowRef.current;
    const el = pillRefs.current[activePill];
    if (!row || !el) return;
    const rowRect = row.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPillIndicator({ left: elRect.left - rowRect.left + row.scrollLeft, width: elRect.width });
  }, [activePill, vendors.length]);

  useEffect(() => {
    const onResize = () => {
      const row = pillRowRef.current;
      const el = pillRefs.current[activePill];
      if (!row || !el) return;
      const rowRect = row.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setPillIndicator({ left: elRect.left - rowRect.left + row.scrollLeft, width: elRect.width });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activePill]);

  const heroReveal = useReveal<HTMLDivElement>();
  const heroFloatReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>(0.05);

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          onClick={scrollToMenu}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-card text-sm font-semibold text-ink-muted hover:text-ink hover:bg-surface transition-colors"
        >
          See this week's menu
        </button>
      </header>

      {/* ===== 1 · Editorial hero ===== */}
      <section className="px-4 sm:px-6">
        <div className="max-w-[1240px] mx-auto relative overflow-hidden rounded-[28px] border border-line bg-card">
          <div className="oval" style={{ width: 360, height: 360, background: '#7CB9E8', top: -80, left: -60, animationDelay: '-2s' }} />
          <div className="oval" style={{ width: 260, height: 260, background: '#D4522A', top: 180, right: -60, animationDelay: '-5s' }} />
          <div className="oval" style={{ width: 200, height: 200, background: '#2D6A4F', bottom: -40, left: '40%', opacity: 0.32, animationDelay: '-3s' }} />

          <div className="relative px-6 sm:px-10 lg:px-12 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div ref={heroReveal} className="lg:col-span-7 reveal stagger">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur border border-line text-[11px] font-bold uppercase tracking-widest text-ink">
                <span className="live-dot" />
                Loma Linda 
              </span>
              <h1 className="font-display font-semibold tracking-tight text-ink mt-5 sm:mt-6" style={{ fontSize: 'clamp(36px, 6vw, 60px)', lineHeight: 1.02 }}>
                Rooted in one of the world's <span className="italic text-primary">Blue Zones</span>.
              </h1>
              <p className="text-ink-muted text-base sm:text-[17px] mt-5 sm:mt-6 max-w-xl leading-relaxed">
                Loma Linda is one of five globally recognized Blue Zones, regions where people consistently live longer, healthier lives. Its local food culture reflects that legacy.
              </p>
              <p className="text-ink-muted text-base sm:text-[17px] mt-4 max-w-xl leading-relaxed">
                <span className="italic text-primary font-medium">bloo</span> seeks to guide those in the Loma Linda area to discover the many different delicacies hidden within the community, offering a modern window into these traditions. We aim to display nutritional transparency paired with Blue Zone driven dining as a digital extension of the Loma Linda's lifestyle: intentional, informed, and rooted in community. 
              </p>
              <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToMenu}
                  className="glow-cta px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-primary text-white text-sm font-bold sheen"
                >
                  See this week's menu →
                </button>
              </div>
              <div className="mt-7 sm:mt-8 flex items-center gap-4 sm:gap-5">
                <div className="flex -space-x-2">
                  {(vendorsLoading ? [] : vendors.slice(0, 3)).map((v, i) => (
                    <div
                      key={v.id}
                      className={`w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? 'bg-macro-green/15 text-macro-green' : i === 1 ? 'bg-primary/15 text-primary-active' : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {v.name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {!vendorsLoading && vendors.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-surface border-2 border-card flex items-center justify-center text-[10px] font-bold text-ink-muted">
                      +{vendors.length - 3}
                    </div>
                  )}
                </div>
                <div className="text-xs text-ink-muted font-medium">
                  {vendorsLoading ? '…' : `${vendors.length} neighborhood ${vendors.length === 1 ? 'kitchen' : 'kitchens'} this week`}
                </div>
              </div>
            </div>

            {/* Floating right column */}
            <div ref={heroFloatReveal} className="lg:col-span-5 relative h-[380px] sm:h-[440px] reveal">
              <svg className="absolute -top-4 right-2 sm:right-6 anim-spin-slow" width="220" height="220" viewBox="0 0 120 120" aria-hidden>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E8E3DA" strokeWidth="2" strokeDasharray="4 6" />
              </svg>

              {motw && (
                <div
                  className="absolute right-0 top-0 w-[260px] sm:w-[300px] rounded-3xl overflow-hidden border border-line anim-float cursor-pointer"
                  style={{ animationDelay: '-1s', boxShadow: '0 18px 40px -16px rgba(26,26,26,.25)' }}
                  onClick={() => handleMealClick(motw)}
                >
                  <div className="h-40 sm:h-48 relative overflow-hidden">
                    <img className="w-full h-full object-cover" src={motw.image_url} alt={motw.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest">featured meal the week</span>
                  </div>
                  <div className="p-4 bg-card">
                    <div className="font-display text-lg font-semibold leading-tight">{motw.name}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{motw.vendor}</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-macro-green/10 text-macro-green">{motw.protein}g P</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary-active">{motw.carbs}g C</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent">{motw.fats}g F</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ===== 2 · Meal grid with pill filter ===== */}
      <section id="menu" className="px-4 sm:px-6 mt-12 sm:mt-16">
        <div className="max-w-[1240px] mx-auto">
          <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">This week</div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold">Every meal, every macro</h2>
            </div>
            <div className="text-xs font-semibold text-ink-muted whitespace-nowrap">
              {loading ? '…' : `${filteredMeals.length} dish${filteredMeals.length === 1 ? '' : 'es'}`}
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3 overflow-x-auto pill-row" ref={pillRowRef}>
            <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-surface border border-line relative">
              <div
                className="pill-indicator"
                style={{ transform: `translateX(${pillIndicator.left}px)`, width: pillIndicator.width }}
              />
              <button
                type="button"
                ref={(el) => (pillRefs.current['all'] = el)}
                onClick={() => setActivePill('all')}
                className={`pill ${activePill === 'all' ? 'active' : ''}`}
              >
                All
              </button>
              {vendorsLoading ? (
                <>
                  <div className="h-9 w-24 rounded-xl skel" />
                  <div className="h-9 w-24 rounded-xl skel" />
                </>
              ) : (
                vendors.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    ref={(el) => (pillRefs.current[v.id] = el)}
                    onClick={() => setActivePill(v.id)}
                    className={`pill ${activePill === v.id ? 'active' : ''}`}
                  >
                    {v.name}
                  </button>
                ))
              )}
              <button
                type="button"
                ref={(el) => (pillRefs.current['high-protein'] = el)}
                onClick={() => setActivePill('high-protein')}
                className={`pill ${activePill === 'high-protein' ? 'active' : ''}`}
              >
                High protein
              </button>
              <button
                type="button"
                ref={(el) => (pillRefs.current['under-600'] = el)}
                onClick={() => setActivePill('under-600')}
                className={`pill ${activePill === 'under-600' ? 'active' : ''}`}
              >
                Under 600 cal
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-line bg-card">
                  <div className="skel" style={{ aspectRatio: '4/3' }} />
                  <div className="p-4 space-y-2">
                    <div className="skel h-4 w-3/4" />
                    <div className="skel h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-line bg-card/50">
              <p className="font-display text-xl font-semibold text-ink">No meals match this filter</p>
              <button
                type="button"
                onClick={() => setActivePill('all')}
                className="mt-3 text-sm text-primary-active font-semibold hover:underline"
              >
                Show all meals
              </button>
            </div>
          ) : (
            <div ref={gridReveal} className="reveal stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMeals.map((meal, i) => (
                <MealCard key={meal.id} meal={meal} index={i} onClick={() => handleMealClick(meal)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 5 · Vendor marquee ===== */}
      {!vendorsLoading && vendors.length > 0 && (
        <section className="mt-16 sm:mt-20 py-6 border-y border-line bg-surface/40 overflow-hidden">
          <div className="marquee whitespace-nowrap">
            {[...vendors, ...vendors, ...vendors].map((v, i) => (
              <span key={`${v.id}-${i}`} className="inline-flex items-center gap-3 text-ink-muted font-display text-lg sm:text-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                <span>{v.name}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <Footer />

      <MealDetailModal meal={selectedMeal} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
