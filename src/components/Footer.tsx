import { Instagram, UtensilsCrossed } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark-bg-2 border-t border-dark-border/40 py-8 px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="text-primary" size={18} />
          <span className="text-lg font-bold text-white font-brand">bloo</span>
        </div>
        <p className="text-dark-text-muted text-xs text-center">
          Thoughtfully curated, nutrition-focused meals
        </p>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-dark-text hover:text-primary transition-colors"
        >
          <Instagram size={16} />
          <span className="text-sm">Follow us</span>
        </a>
      </div>
    </footer>
  );
}
