'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw, Search, X, Tag, Wallet } from 'lucide-react';
import { useSavedFilters } from '@/components/office/useSavedFilters';

type ClientFilter   = 'all' | 'active' | 'inactive';
type CategoryFilter = '' | 'Service Support' | 'Projects' | 'Back up Power Supply' | 'Software Support';
type BalanceFilter  = '' | 'has_balance';

const STORAGE_KEY = 'office:clients:filters:v2';

function buildUrl(
  pathname: string,
  next: { q: string; filter: ClientFilter; category: CategoryFilter; balance: BalanceFilter }
) {
  const sp = new URLSearchParams();
  if (next.q)        sp.set('q',        next.q);
  if (next.filter)   sp.set('filter',   next.filter);
  if (next.category) sp.set('category', next.category);
  if (next.balance)  sp.set('balance',  next.balance);
  return `${pathname}?${sp.toString()}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Service Support':      'border-blue-500/40   text-blue-400   data-[active=true]:bg-blue-500   data-[active=true]:text-white',
  'Projects':             'border-orange-500/40  text-orange-400 data-[active=true]:bg-orange-500 data-[active=true]:text-white',
  'Back up Power Supply': 'border-green-500/40   text-green-400  data-[active=true]:bg-green-500  data-[active=true]:text-white',
  'Software Support':     'border-purple-500/40  text-purple-400 data-[active=true]:bg-purple-500 data-[active=true]:text-white',
};

export default function ClientsControls({
  initialQ,
  initialFilter,
  initialCategory,
  initialBalance,
}: {
  initialQ:        string;
  initialFilter:   ClientFilter;
  initialCategory: CategoryFilter;
  initialBalance:  BalanceFilter;
}) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const { load, save } = useSavedFilters<{
    q: string; filter: ClientFilter; category: CategoryFilter; balance: BalanceFilter;
  }>(STORAGE_KEY);

  const qParam        = searchParams.get('q')        ?? initialQ        ?? '';
  const filterParam   = (searchParams.get('filter')   as ClientFilter)   ?? initialFilter   ?? 'active';
  const categoryParam = (searchParams.get('category') as CategoryFilter) ?? initialCategory ?? '';
  const balanceParam  = (searchParams.get('balance')  as BalanceFilter)  ?? initialBalance  ?? '';

  const defaults = useMemo(
    () => ({ q: '', filter: 'active' as ClientFilter, category: '' as CategoryFilter, balance: '' as BalanceFilter }),
    []
  );

  const [q,        setQ]        = useState(qParam);
  const [filter,   setFilter]   = useState<ClientFilter>(filterParam);
  const [category, setCategory] = useState<CategoryFilter>(categoryParam);
  const [balance,  setBalance]  = useState<BalanceFilter>(balanceParam);

  const didRestore = useRef(false);

  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const saved = load();
    const current = { q: qParam, filter: filterParam, category: categoryParam, balance: balanceParam };
    const isDefault =
      current.q === defaults.q &&
      current.filter === defaults.filter &&
      current.category === defaults.category &&
      current.balance === defaults.balance;
    if (isDefault && saved && (saved.q !== defaults.q || saved.filter !== defaults.filter || saved.category !== defaults.category || saved.balance !== defaults.balance)) {
      router.replace(buildUrl(pathname, saved));
    }
  }, [defaults, filterParam, categoryParam, balanceParam, load, pathname, qParam, router]);

  useEffect(() => setQ(qParam),               [qParam]);
  useEffect(() => setFilter(filterParam),     [filterParam]);
  useEffect(() => setCategory(categoryParam), [categoryParam]);
  useEffect(() => setBalance(balanceParam),   [balanceParam]);

  const apply = (next: { q: string; filter: ClientFilter; category: CategoryFilter; balance: BalanceFilter }) => {
    save(next);
    router.replace(buildUrl(pathname, next));
  };

  // Debounced search
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (q === qParam && filter === filterParam && category === categoryParam && balance === balanceParam) return;
      apply({ q, filter, category, balance });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [filter, q, category, balance]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetAll = () => {
    setQ(''); setFilter('active'); setCategory(''); setBalance('');
    apply(defaults);
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Active filter + Reset */}
      <div className="bg-[#151B28] border border-slate-800/50 p-4 rounded-xl flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply({ q, filter, category, balance }); } }}
            placeholder="Search by company or contact person..."
            className="w-full bg-[#0B0F19] border border-slate-800/50 focus:border-orange-500/50 outline-none pl-12 pr-10 py-3 text-sm text-slate-200 font-medium rounded-lg transition-all"
          />
          {q && (
            <button
              type="button"
              onClick={() => { setQ(''); apply({ q: '', filter, category, balance }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Active/Inactive filter */}
        <div className="flex bg-[#0B0F19] p-1 rounded-lg border border-slate-800/50">
          {(
            [
              { id: 'all'      as const, label: 'All'         },
              { id: 'active'   as const, label: 'Active Only' },
              { id: 'inactive' as const, label: 'Inactive'    },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => apply({ q, filter: opt.id, category, balance })}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                filter === opt.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="hidden lg:flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-800/50 bg-[#0B0F19] text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all text-[10px] font-black uppercase tracking-widest"
          title="Reset all filters"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Row 2: Category + Balance filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Category pills */}
        <div className="flex items-center gap-1.5">
          <Tag size={12} className="text-slate-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 mr-1">Category:</span>
          {(['Service Support', 'Projects', 'Back up Power Supply', 'Software Support'] as CategoryFilter[]).map(cat => (
            <button
              key={cat}
              type="button"
              data-active={category === cat}
              onClick={() => apply({ q, filter, category: category === cat ? '' : cat, balance })}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded border transition-all ${
                CATEGORY_COLORS[cat!] || 'border-slate-700 text-slate-400'
              } ${category === cat ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              style={{
                backgroundColor: category === cat
                  ? cat === 'Service Support'      ? 'rgb(59 130 246 / 0.2)'
                  : cat === 'Projects'             ? 'rgb(249 115 22 / 0.2)'
                  : cat === 'Back up Power Supply' ? 'rgb(34 197 94 / 0.2)'
                  : cat === 'Software Support'     ? 'rgb(168 85 247 / 0.2)'
                  : ''
                  : undefined,
              }}
            >
              {cat}
            </button>
          ))}
          {category && (
            <button
              type="button"
              onClick={() => apply({ q, filter, category: '', balance })}
              className="p-1 text-slate-600 hover:text-slate-400 transition-colors"
              title="Clear category filter"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Balance filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Wallet size={12} className="text-slate-500" />
          <button
            type="button"
            onClick={() => apply({ q, filter, category, balance: balance === 'has_balance' ? '' : 'has_balance' })}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded border transition-all ${
              balance === 'has_balance'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            Has Balance
          </button>
        </div>
      </div>
    </div>
  );
}
