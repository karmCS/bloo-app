import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Instagram, Mail, Globe, ChevronDown } from 'lucide-react';
import { useMealsAvailableThisWeek } from '../hooks/useMealsAvailableThisWeek';
import { useMealsByVendor } from '../hooks/useMealsByVendor';
import { useActiveVendors } from '../hooks/useActiveVendors';
import { useVendorPhotos } from '../hooks/useVendorPhotos';
import { useReveal } from '../hooks/useReveal';
import MealCard from '../components/MealCard';
import MealDetailModal from '../components/MealDetailModal';
import VendorGallery from '../components/VendorGallery';
import Footer from '../components/Footer';
import { Meal } from '../lib/supabase';

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.54V6.78a4.85 4.85 0 0 1-1.02-.09z" />
    </svg>
  );
}

export default function RestaurantPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { vendors, loading: vendorsLoading } = useActiveVendors();
  const { photos, loading: photosLoading } = useVendorPhotos(vendorId ?? null);
  const { meals: thisWeekMeals, loading: weekLoading } = useMealsAvailableThisWeek(vendorId ?? null);
  const { meals: allMeals } = useMealsByVendor(vendorId ?? null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tab, setTab] = useState<'week' | 'all'>('week');

  const vendor = useMemo(() => vendors.find(v => v.id === vendorId), [vendors, vendorId]);
  const displayMeals = tab === 'week' ? thisWeekMeals : allMeals;

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMeal(null), 300);
  };

  const introReveal = useReveal<HTMLDivElement>();
  const menuReveal = useReveal<HTMLDivElement>(0.05);

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!vendorsLoading && !vendor) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-3xl font-semibold italic text-primary mb-2">bloo</h1>
          <p className="text-ink-muted text-sm mb-6">This kitchen isn't on bloo right now.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Back to kitchens
          </button>
        </div>
      </div>
    );
  }

  const hasSocials = !!(vendor?.instagram_handle || vendor?.tiktok_handle || vendor?.website_url || vendor?.contact_email);

  return (
    <div className="min-h-screen bg-page font-sans text-ink">
      {/* Top nav */}
      <header className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between gap-4 animate-fadeIn">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink text-sm font-medium transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          All kitchens
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-[0_4px_16px_rgba(124,185,232,.25)] shrink-0">
            <img src="/favicon-minimal.svg" alt="" className="w-5 h-5" />
          </div>
          <span className="font-display text-xl font-semibold italic text-primary">bloo</span>
        </div>
      </header>

      {/* ===== Editorial intro + gallery ===== */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-4 pb-12 sm:pb-16">
        <div ref={introReveal} className="reveal grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 items-start">
          {/* Left: editorial copy */}
          <div className="lg:pt-6">
            <div className="flex items-center gap-3 mb-5">
              {vendor?.logo_url && (
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-line shadow-sm shrink-0">
                  <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-widest text-accent">Kitchen profile</div>
                {vendor?.name ? (
                  <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink leading-tight">
                    {vendor.name}
                  </h1>
                ) : (
                  <div className="skel h-10 w-48 mt-1" />
                )}
              </div>
            </div>

            {vendor?.description && (
              <p className="font-display italic text-xl sm:text-2xl text-ink-muted leading-snug mb-5">
                {vendor.description}
              </p>
            )}

            {vendor?.editorial_body ? (
              <div className="text-[15px] text-ink leading-relaxed whitespace-pre-line">
                {vendor.editorial_body}
              </div>
            ) : vendor?.description ? null : vendor ? (
              <p className="text-[15px] text-ink-muted italic leading-relaxed">
                This kitchen hasn't added an introduction yet — but the menu speaks for itself.
              </p>
            ) : null}

            {/* Socials */}
            {hasSocials && (
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {vendor?.instagram_handle && (
                  <a
                    href={`https://instagram.com/${vendor.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-card text-ink-muted hover:text-ink hover:border-ink/30 text-sm font-medium transition-colors cursor-pointer"
                    aria-label={`Instagram — @${vendor.instagram_handle}`}
                  >
                    <Instagram size={15} />
                    <span>@{vendor.instagram_handle}</span>
                  </a>
                )}
                {vendor?.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${vendor.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-card text-ink-muted hover:text-ink hover:border-ink/30 text-sm font-medium transition-colors cursor-pointer"
                    aria-label={`TikTok — @${vendor.tiktok_handle}`}
                  >
                    <TikTokIcon size={14} />
                    <span>@{vendor.tiktok_handle}</span>
                  </a>
                )}
                {vendor?.website_url && (
                  <a
                    href={vendor.website_url.startsWith('http') ? vendor.website_url : `https://${vendor.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-card text-ink-muted hover:text-ink hover:border-ink/30 text-sm font-medium transition-colors cursor-pointer"
                    aria-label="Website"
                  >
                    <Globe size={15} />
                    <span className="truncate max-w-[160px]">
                      {vendor.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  </a>
                )}
                {vendor?.contact_email && (
                  <a
                    href={`mailto:${vendor.contact_email}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                  >
                    <Mail size={14} />
                    Contact
                  </a>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={scrollToMenu}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary-active hover:gap-3 transition-all cursor-pointer"
            >
              See the menu <ChevronDown size={15} />
            </button>
          </div>

          {/* Right: slideshow */}
          <div>
            {photosLoading ? (
              <div className="skel rounded-3xl w-full aspect-[16/9]" />
            ) : (
              <VendorGallery
                photos={photos}
                fallbackImage={vendor?.logo_url ?? null}
                vendorName={vendor?.name ?? 'Kitchen'}
              />
            )}
          </div>
        </div>
      </section>

      {/* ===== Menu ===== */}
      <section id="menu" className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-16">
        <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">The menu</div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold relative overflow-hidden">
              <span key={tab} className="inline-block animate-menuTabSwap">
                {tab === 'week' ? "What's cooking this week" : 'Full catalog'}
              </span>
            </h2>
            {!weekLoading && (
              <p className="text-ink-muted text-sm mt-1">
                {displayMeals.length} {displayMeals.length === 1 ? 'dish' : 'dishes'}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 p-1 bg-surface rounded-xl border border-line">
            {([
              { k: 'week' as const, l: 'This week' },
              { k: 'all' as const, l: 'Full catalog' },
            ]).map(t => {
              const on = tab === t.k;
              return (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setTab(t.k)}
                  className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                    on ? 'bg-card text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {t.l}
                </button>
              );
            })}
          </div>
        </div>

        {weekLoading && tab === 'week' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-surface animate-pulse border border-line" style={{ aspectRatio: '4/3' }} />
            ))}
          </div>
        ) : displayMeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-line bg-card/50 text-center">
            <p className="font-display text-xl font-semibold text-ink mb-2">
              {tab === 'week' ? 'Nothing on the menu this week' : "No dishes in the catalog yet"}
            </p>
            <p className="text-ink-muted text-sm max-w-xs">
              {tab === 'week'
                ? 'Check back Monday — this kitchen publishes weekly.'
                : 'Once meals are added, they show up here.'}
            </p>
          </div>
        ) : (
          <div
            ref={menuReveal}
            className="reveal stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {displayMeals.map((meal, i) => (
              <MealCard
                key={meal.id}
                meal={meal}
                index={i}
                onClick={() => handleMealClick(meal)}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />

      <MealDetailModal
        meal={selectedMeal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
