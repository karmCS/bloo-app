import { Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-line py-8 px-6 shadow-[0_-1px_0_rgba(0,0,0,0.03)]">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-[0_4px_16px_rgba(124,185,232,.25)]">
            <img src="/favicon-minimal.svg" alt="" className="w-5 h-5" />
          </div>
          <span className="font-display text-xl font-semibold italic text-primary">bloo</span>
        </div>
        <p className="text-ink-muted text-xs text-center font-medium">
          Thoughtfully curated, nutrition-focused meals
        </p>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-ink-muted hover:text-primary transition-colors font-medium"
        >
          <Instagram size={16} />
          <span className="text-sm">Follow us</span>
        </a>
      </div>
    </footer>
  );
}
