'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight, FileText, Wrench, Lightbulb, Download, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchSite, type SearchResult, type SearchCategory } from '@/lib/search-index';

const CATEGORY_ICON: Record<SearchCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  Page: Globe,
  Service: Wrench,
  Insight: Lightbulb,
  Resource: Download,
};

const CATEGORY_STYLE: Record<SearchCategory, string> = {
  Page: 'bg-blue-50 text-blue-700',
  Service: 'bg-orange-50 text-orange-600',
  Insight: 'bg-purple-50 text-purple-700',
  Resource: 'bg-green-50 text-green-700',
};

const SUGGESTIONS = ['Fire & Gas', 'Hazardous Areas', 'Maintenance', 'Industries', 'Downloads', 'Contact'];

export default function SiteSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  // Reset and focus when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Re-run search on query change
  useEffect(() => {
    setResults(searchSite(query));
    setActiveIndex(0);
  }, [query]);

  // Scroll active result into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const navigate = useCallback(
    (url: string) => {
      router.push(url);
      onClose();
    },
    [router, onClose],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[activeIndex]) { navigate(results[activeIndex].url); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, activeIndex, navigate, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[151] px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <Search size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search services, industries, insights…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 text-[#1A2B4C] text-sm font-medium placeholder:text-slate-400 outline-none bg-transparent"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="hidden sm:block text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded px-2 py-1 transition-colors"
                >
                  Esc
                </button>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <ul ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
                  {results.map((result, i) => {
                    const Icon = CATEGORY_ICON[result.category] ?? FileText;
                    const isActive = i === activeIndex;
                    return (
                      <li key={result.id}>
                        <button
                          onClick={() => navigate(result.url)}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors ${isActive ? 'bg-slate-50' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${CATEGORY_STYLE[result.category]}`}>
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[#1A2B4C] font-black text-sm truncate">{result.title}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_STYLE[result.category]}`}>
                                {result.category}
                              </span>
                            </div>
                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-1">{result.description}</p>
                          </div>
                          <ArrowRight
                            size={14}
                            className={`flex-shrink-0 transition-colors ${isActive ? 'text-orange-500' : 'text-slate-200'}`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* No results */}
              {query && results.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <p className="text-slate-400 text-sm font-medium">
                    No results for <span className="text-[#1A2B4C] font-black">&ldquo;{query}&rdquo;</span>
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Try searching for a service, industry, or technical topic
                  </p>
                </div>
              )}

              {/* Default / quick links */}
              {!query && (
                <div className="px-5 py-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Quick Search</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 text-xs font-bold rounded-full transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer hints */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-4 flex-wrap">
                {[
                  { key: '↑↓', label: 'navigate' },
                  { key: '↵', label: 'open' },
                  { key: 'Esc', label: 'close' },
                ].map(({ key, label }) => (
                  <span key={key} className="text-[10px] text-slate-400 font-medium">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black mr-1">{key}</kbd>
                    {label}
                  </span>
                ))}
                <span className="ml-auto text-[10px] text-slate-400 font-medium hidden sm:block">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black mr-1">⌘K</kbd>
                  open anywhere
                </span>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
