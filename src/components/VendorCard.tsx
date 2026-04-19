import { Vendor } from '../lib/supabase';

interface VendorCardProps {
  vendor: Vendor;
  onClick: () => void;
  index?: number;
}

export default function VendorCard({ vendor, onClick, index = 0 }: VendorCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer relative overflow-hidden rounded-2xl bg-surface border border-line hover:shadow-xl transition-shadow duration-300 animate-staggerIn"
      style={{ aspectRatio: '4/3', animationDelay: `${index * 60}ms` }}
    >
      {vendor.logo_url ? (
        <img
          src={vendor.logo_url}
          alt={vendor.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-line">
          <span className="font-display text-6xl font-semibold text-ink-faint select-none">
            {vendor.name[0]}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-display text-xl font-semibold text-white leading-tight">
          {vendor.name}
        </h3>
        <p className="text-white/0 group-hover:text-white/70 text-sm mt-1 font-sans transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          Browse menu →
        </p>
      </div>
    </div>
  );
}
