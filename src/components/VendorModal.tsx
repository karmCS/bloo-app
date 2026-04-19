import { X, UtensilsCrossed } from 'lucide-react';
import { Vendor } from '../lib/supabase';

interface VendorModalProps {
  vendor: Vendor | null;
  mealCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onBrowse: () => void;
}

export default function VendorModal({ vendor, mealCount, isOpen, onClose, onBrowse }: VendorModalProps) {
  if (!vendor || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fadeIn">
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden animate-slideUp"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-modal-title"
        >
          {/* Photo */}
          <div className="relative h-52 bg-surface overflow-hidden">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url}
                alt={vendor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-line">
                <span className="font-display text-8xl font-semibold text-ink-faint select-none">
                  {vendor.name[0]}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <h2
              id="vendor-modal-title"
              className="font-display text-2xl font-semibold text-ink leading-tight mb-1"
            >
              {vendor.name}
            </h2>

            {typeof mealCount === 'number' && (
              <div className="flex items-center gap-1.5 mb-4">
                <UtensilsCrossed size={13} className="text-ink-faint" />
                <span className="text-xs text-ink-muted font-medium">
                  {mealCount} {mealCount === 1 ? 'dish' : 'dishes'}
                </span>
              </div>
            )}

            {vendor.description ? (
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                {vendor.description}
              </p>
            ) : (
              <p className="text-sm text-ink-faint italic mb-6">No description yet.</p>
            )}

            <button
              type="button"
              onClick={onBrowse}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl transition-colors duration-200 text-sm"
            >
              Browse menu →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
