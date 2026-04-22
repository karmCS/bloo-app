import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Meal } from '../lib/supabase';
import { DIETARY_TAGS } from '../constants/dietaryTags';
import { useMeals } from '../hooks/useMeals';
import { useActiveVendors } from '../hooks/useActiveVendors';
import { useReveal } from '../hooks/useReveal';
import MealCard from '../components/MealCard';
import MealDetailModal from '../components/MealDetailModal';
import Footer from '../components/Footer';

function DualSlider({
  bounds, range, setRange, step, inputClass, fillClass, unit,
}: {
  bounds: [number, number];
  range: [number, number];
  setRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  step: number;
  inputClass: string;
  fillClass: string;
  unit: string;
}) {
  const span = bounds[1] - bounds[0];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
          {unit === 'cal' ? 'Calories' : 'Protein'}
        </span>
        <span className="text-xs font-semibold text-ink tabular-nums">
          {range[0]} – {range[1]}{unit === 'cal' ? ' cal' : 'g'}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-line" />
        <div
          className={`absolute h-1.5 rounded-full ${fillClass}`}
          style={{
            left: `${((range[0] - bounds[0]) / span) * 100}%`,
            right: `${((bounds[1] - range[1]) / span) * 100}%`,
          }}
        />
        <input
          type="range"
          className={inputClass}
          min={bounds[0]} max={bounds[1]} step={step} value={range[0]}
          onChange={e => {
            const v = Number(e.target.value);
            setRange(([, max]) => [Math.min(v, max - step), max]);
          }}
        />
        <input
          type="range"
          className={inputClass}
          min={bounds[0]} max={bounds[1]} step={step} value={range[1]}
          onChange={e => {
            const v = Number(e.target.value);
            setRange(([min]) => [min, Math.max(v, min + step)]);
          }}
        />
      </div>
    </div>
  );
}

export default function Homepage() {
  const { meals, loading } = useMeals();
  const { vendors, loading: vendorsLoading } = useActiveVendors();

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [activeDietaryTags, setActiveDietaryTags] = useState<string[]>([]);
  const [calRange, setCalRange] = useState<[number, number]>([0, 1200]);
  const [proteinRange, setProteinRange] = useState<[number, number]>([0, 100]);

  const calBounds = useMemo<[number, number]>(() => {
    if (!meals.length) return [0, 1200];
    const cals = meals.map(m => m.calories);
    const lo = Math.floor(Math.min(...cals) / 50) * 50;
    const hi = Math.ceil(Math.max(...cals) / 50) * 50;
    return lo < hi ? [lo, hi] : [lo, lo + 50];
  }, [meals]);

  const proteinBounds = useMemo<[number, number]>(() => {
    if (!meals.length) return [0, 100];
    const proteins = meals.map(m => m.protein);
    const lo = Math.floor(Math.min(...proteins) / 5) * 5;
    const hi = Math.ceil(Math.max(...proteins) / 5) * 5;
    return lo < hi ? [lo, hi] : [lo, lo + 5];
  }, [meals]);

  const availableDietaryTags = useMemo(() => {
    const present = new Set(meals.flatMap(m => m.dietary_tags));
    return DIETARY_TAGS.filter(t => present.has(t));
  }, [meals]);

  const [calMin, calMax] = calBounds;
  useEffect(() => { setCalRange([calMin, calMax]); }, [calMin, calMax]);

  const [proteinMin, proteinMax] = proteinBounds;
  useEffect(() => { setProteinRange([proteinMin, proteinMax]); }, [proteinMin, proteinMax]);

  const activeFilterCount = useMemo(() => {
    let n = activeVendorId ? 1 : 0;
    n += activeDietaryTags.length;
    if (calRange[0] > calBounds[0] || calRange[1] < calBounds[1]) n++;
    if (proteinRange[0] > proteinBounds[0] || proteinRange[1] < proteinBounds[1]) n++;
    return n;
  }, [activeVendorId, activeDietaryTags, calRange, calBounds, proteinRange, proteinBounds]);

  const clearFilters = () => {
    setActiveVendorId(null);
    setActiveDietaryTags([]);
    setCalRange(calBounds);
    setProteinRange(proteinBounds);
  };

  const motw = useMemo(() => meals.find(m => m.is_meal_of_week) ?? meals[0] ?? null, [meals]);

  const filteredMeals = useMemo(() => meals.filter(m => {
    if (activeVendorId && m.vendor_id !== activeVendorId) return false;
    if (activeDietaryTags.length > 0 && !activeDietaryTags.every(t => m.dietary_tags.includes(t))) return false;
    if (m.calories < calRange[0] || m.calories > calRange[1]) return false;
    if (m.protein < proteinRange[0] || m.protein > proteinRange[1]) return false;
    return true;
  }), [meals, activeVendorId, activeDietaryTags, calRange, proteinRange]);

  // ── Modal ───────────────────────────────────────────────────────────────────
  const handleMealClick = (meal: Meal) => { setSelectedMeal(meal); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setTimeout(() => setSelectedMeal(null), 300); };

  // ── Reveal refs ─────────────────────────────────────────────────────────────
  const heroReveal = useReveal<HTMLDivElement>();
  const heroFloatReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>(0.05);

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Shared chip styles ──────────────────────────────────────────────────────
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
      active
        ? 'bg-primary text-white border-primary'
        : 'bg-surface border-line text-ink-muted hover:text-ink hover:border-primary/40'
    }`;

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

      {/* ===== 2 · Meal grid ===== */}
      <section id="menu" className="px-4 sm:px-6 mt-12 sm:mt-16">
        <div className="max-w-[1240px] mx-auto">

          {/* Section header */}
          <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">This week</div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold">Every meal, every macro</h2>
            </div>
            <div className="text-xs font-semibold text-ink-muted whitespace-nowrap">
              {loading ? '…' : `${filteredMeals.length} dish${filteredMeals.length === 1 ? '' : 'es'}`}
            </div>
          </div>

          {/* ── Filter bar ──────────────────────────────────────────────────── */}
          <div className="mb-6">

            {/* Trigger row */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(o => !o)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-line text-sm font-semibold text-ink hover:bg-surface transition-colors"
              >
                <SlidersHorizontal size={15} className="text-ink-muted" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  size={15}
                  className={`text-ink-muted transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-primary-active hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Expandable panel */}
            <div className={`panel-expand ${filtersOpen ? 'is-open' : ''}`}>
              <div className="panel-inner">
                <div className="mt-3 bg-card border border-line rounded-2xl p-5 space-y-6">

                  {/* Vendor filter */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted mb-3">Vendor</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setActiveVendorId(null)} className={chip(activeVendorId === null)}>
                        All
                      </button>
                      {vendorsLoading ? (
                        <>
                          <div className="h-8 w-20 rounded-lg skel" />
                          <div className="h-8 w-24 rounded-lg skel" />
                        </>
                      ) : vendors.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setActiveVendorId(activeVendorId === v.id ? null : v.id)}
                          className={chip(activeVendorId === v.id)}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dietary tag filter */}
                  {availableDietaryTags.length > 0 && (
                    <div className="border-t border-line pt-5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted mb-3">Dietary tags</p>
                      <div className="flex flex-wrap gap-2">
                        {availableDietaryTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setActiveDietaryTags(prev =>
                              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                            )}
                            className={chip(activeDietaryTags.includes(tag))}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Range sliders */}
                  {!loading && (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 ${availableDietaryTags.length > 0 ? 'border-t border-line pt-5' : ''}`}>
                      {calBounds[1] > calBounds[0] && (
                        <DualSlider
                          bounds={calBounds} range={calRange} setRange={setCalRange}
                          step={50} inputClass="cal-range-input" fillClass="bg-primary" unit="cal"
                        />
                      )}
                      {proteinBounds[1] > proteinBounds[0] && (
                        <DualSlider
                          bounds={proteinBounds} range={proteinRange} setRange={setProteinRange}
                          step={5} inputClass="protein-range-input" fillClass="bg-macro-green" unit="g"
                        />
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

          {/* ── Meal grid ───────────────────────────────────────────────────── */}
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
              <p className="font-display text-xl font-semibold text-ink">No meals match these filters</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm text-primary-active font-semibold hover:underline"
              >
                Clear all filters
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

      {/* ===== Vendor marquee ===== */}
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
