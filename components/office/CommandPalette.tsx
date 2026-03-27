'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X } from 'lucide-react';

export type CommandPaletteItem = {
  id: string;
  label: string;
  keywords?: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  onSelect: () => void;
};

export default function CommandPalette({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandPaletteItem[];
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.keywords || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        const item = filtered[activeIndex];
        if (!item) return;
        e.preventDefault();
        onOpenChange(false);
        item.onSelect();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, filtered, onOpenChange, open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[250] flex items-start justify-center p-6 pt-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-2xl bg-[#151B28] border border-slate-800/60 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800/60 flex items-center gap-3">
              <Search size={18} className="text-slate-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages and actions…"
                className="flex-1 bg-transparent outline-none text-white font-bold placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-auto">
              {filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-slate-500 text-xs font-black uppercase tracking-[0.25em]">
                    No Results
                  </p>
                </div>
              ) : (
                <ul className="p-2">
                  {filtered.map((it, idx) => (
                    <li key={it.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => {
                          onOpenChange(false);
                          it.onSelect();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                          idx === activeIndex
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <it.Icon size={18} className="text-orange-500" />
                        <span className="font-black text-xs uppercase tracking-widest">
                          {it.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
              <span>Enter to open</span>
              <span>Esc to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

