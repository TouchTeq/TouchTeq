'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw, Search, X } from 'lucide-react';
import { useSavedFilters } from '@/components/office/useSavedFilters';

type QuoteStatus = 'all' | 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';

const STORAGE_KEY = 'office:quotes:filters:v1';

function buildUrl(pathname: string, next: { q: string; status: QuoteStatus }) {
  const sp = new URLSearchParams();
  if (next.q) sp.set('q', next.q);
  if (next.status) sp.set('status', next.status);
  return `${pathname}?${sp.toString()}`;
}

export default function QuotesControls({
  initialQ,
  initialStatus,
}: {
  initialQ: string;
  initialStatus: QuoteStatus;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { load, save } = useSavedFilters<{ q: string; status: QuoteStatus }>(STORAGE_KEY);

  const qParam = searchParams.get('q') ?? initialQ ?? '';
  const statusParam = (searchParams.get('status') as QuoteStatus) ?? initialStatus ?? 'all';

  const defaults = useMemo(() => ({ q: '', status: 'all' as QuoteStatus }), []);
  const [q, setQ] = useState(qParam);
  const [status, setStatus] = useState<QuoteStatus>(statusParam);

  const didRestore = useRef(false);

  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;

    const saved = load();
    const current = { q: qParam, status: statusParam };
    const isDefault = current.q === defaults.q && current.status === defaults.status;

    if (isDefault && saved && (saved.q !== defaults.q || saved.status !== defaults.status)) {
      router.replace(buildUrl(pathname, saved));
    }
  }, [defaults.q, defaults.status, load, pathname, qParam, router, statusParam]);

  useEffect(() => setQ(qParam), [qParam]);
  useEffect(() => setStatus(statusParam), [statusParam]);

  const apply = (next: { q: string; status: QuoteStatus }) => {
    save(next);
    router.replace(buildUrl(pathname, next));
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (q === qParam && status === statusParam) return;
      apply({ q, status });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [q, qParam, status, statusParam]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-[#151B28] border border-slate-800/50 p-4 rounded-xl space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply({ q, status });
              }
            }}
            placeholder="Search by quote # or client name..."
            className="w-full bg-[#0B0F19] border border-slate-800/50 focus:border-orange-500/50 outline-none pl-12 pr-10 py-3 text-sm text-slate-200 font-medium rounded-lg transition-all"
          />
          {q && (
            <button
              type="button"
              onClick={() => apply({ q: '', status })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex bg-[#0B0F19] p-1 rounded-lg border border-slate-800/50 overflow-x-auto">
          {(
            ['all', 'draft', 'sent', 'accepted', 'declined', 'expired', 'converted'] as QuoteStatus[]
          ).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => apply({ q, status: opt })}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap ${
                status === opt
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => apply(defaults)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-800/50 bg-[#0B0F19] text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all text-[10px] font-black uppercase tracking-widest"
          title="Reset filters"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
}
