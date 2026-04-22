import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VendorPhoto } from '../lib/supabase';

interface VendorGalleryProps {
  photos: VendorPhoto[];
  fallbackImage?: string | null;
  vendorName: string;
  intervalMs?: number;
}

const DEFAULT_INTERVAL = 5000;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export default function VendorGallery({
  photos,
  fallbackImage,
  vendorName,
  intervalMs = DEFAULT_INTERVAL,
}: VendorGalleryProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Collapse photo list to a slides array. Fallback to logo if no photos.
  const slides =
    photos.length > 0
      ? photos
      : fallbackImage
        ? [
            {
              id: 'fallback',
              vendor_id: '',
              image_url: fallbackImage,
              caption: null,
              sort_order: 0,
              created_at: '',
              updated_at: '',
            } satisfies VendorPhoto,
          ]
        : [];

  const slideCount = slides.length;
  const clampedIndex = Math.min(index, Math.max(0, slideCount - 1));

  // Auto-advance
  useEffect(() => {
    if (slideCount <= 1 || isPaused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slideCount);
    }, intervalMs);
    intervalRef.current = id;
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [slideCount, isPaused, intervalMs]);

  // Keyboard arrows
  useEffect(() => {
    if (slideCount <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % slideCount);
      else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + slideCount) % slideCount);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slideCount]);

  if (slideCount === 0) {
    return (
      <div
        className="relative w-full aspect-[16/9] rounded-3xl bg-surface border border-line flex items-center justify-center text-ink-muted text-sm"
        aria-label={`${vendorName} — no photos yet`}
      >
        No photos yet.
      </div>
    );
  }

  const go = (next: number) => setIndex(((next % slideCount) + slideCount) % slideCount);

  return (
    <div
      className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-surface border border-line group"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${vendorName} gallery`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {slides.map((slide, i) => {
        const active = i === clampedIndex;
        const kenBurnsClass = !reducedMotion && active ? 'gallery-ken-burns' : '';
        return (
          <div
            key={slide.id || slide.image_url}
            className="absolute inset-0 transition-opacity duration-[900ms] ease-out"
            style={{ opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
            aria-hidden={!active}
          >
            <img
              src={slide.image_url}
              alt={slide.caption ?? `${vendorName} photo ${i + 1}`}
              className={`w-full h-full object-cover ${kenBurnsClass}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
            {slide.caption && (
              <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <p className="text-white text-sm font-medium drop-shadow">
                  {slide.caption}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {slideCount > 1 && (
        <>
          {/* Prev/Next */}
          <button
            type="button"
            onClick={() => go(clampedIndex - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-ink flex items-center justify-center shadow-md backdrop-blur opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer"
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(clampedIndex + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-ink flex items-center justify-center shadow-md backdrop-blur opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer"
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10">
            {slides.map((_, i) => {
              const active = i === clampedIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    active ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'
                  }`}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={active ? 'true' : 'false'}
                />
              );
            })}
          </div>

          {/* Counter */}
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/40 text-white text-[11px] font-semibold tracking-wide backdrop-blur z-10">
            {clampedIndex + 1} / {slideCount}
          </div>
        </>
      )}
    </div>
  );
}
