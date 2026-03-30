import { Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-2xl font-bold text-primary font-brand">bloo</div>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
        >
          <Instagram size={20} />
          <span className="text-sm leading-relaxed">Follow us</span>
        </a>
      </div>
    </footer>
  );
}
