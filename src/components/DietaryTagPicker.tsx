import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { DIETARY_TAGS } from '../constants/dietaryTags';

interface DietaryTagPickerProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function DietaryTagPicker({ selected, onChange }: DietaryTagPickerProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = (tag: string) => {
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);
  };

  const handleToggle = () => {
    if (!open) updateCoords();
    setOpen(o => !o);
  };

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-left flex items-center justify-between focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
      >
        <span className={selected.length === 0 ? 'text-ink-faint' : 'text-ink'}>
          {selected.length === 0
            ? 'Select dietary tags…'
            : `${selected.length} tag${selected.length > 1 ? 's' : ''} selected`}
        </span>
        <ChevronDown size={15} className={`text-ink-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
              {tag}
              <button type="button" onClick={() => toggle(tag)} className="hover:opacity-70 transition-opacity">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
          className="z-[9999] bg-card border border-line rounded-xl shadow-lg py-1.5 max-h-56 overflow-y-auto"
        >
          {DIETARY_TAGS.map(tag => {
            const isSelected = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-ink hover:bg-surface'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
