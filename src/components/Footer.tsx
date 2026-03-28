import { Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-16">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-2xl font-bold text-primary">bloo</div>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
        >
          <Instagram size={20} />
          <span className="text-sm">Follow us</span>
        </a>
      </div>
    </footer>
  );
}
