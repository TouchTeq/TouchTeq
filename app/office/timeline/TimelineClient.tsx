'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  CreditCard,
  FileText,
  Receipt,
  Search,
  Users,
  Wallet,
} from 'lucide-react';

export type TimelineKind = 'client' | 'quote' | 'invoice' | 'payment' | 'reminder' | 'expense';

export type TimelineEvent = {
  id: string;
  kind: TimelineKind;
  ts: string; // ISO
  title: string;
  subtitle?: string;
  amount?: number;
  status?: string;
  href?: string;
};

const kindMeta: Record<TimelineKind, { label: string; Icon: any; chip: string }> = {
  client: { label: 'Clients', Icon: Users, chip: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  quote: { label: 'Quotes', Icon: FileText, chip: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  invoice: { label: 'Invoices', Icon: Receipt, chip: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  payment: { label: 'Payments', Icon: Wallet, chip: 'bg-green-500/10 text-green-400 border-green-500/20' },
  reminder: { label: 'Reminders', Icon: BellRing, chip: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  expense: { label: 'Expenses', Icon: CreditCard, chip: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace('ZAR', 'R');
}

function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' });
}

export default function TimelineClient({ events }: { events: TimelineEvent[] }) {
  const [query, setQuery] = useState('');
  const [enabledKinds, setEnabledKinds] = useState<Record<TimelineKind, boolean>>({
    client: true,
    quote: true,
    invoice: true,
    payment: true,
    reminder: true,
    expense: true,
  });

  const counts = useMemo(() => {
    const c: Record<TimelineKind, number> = {
      client: 0,
      quote: 0,
      invoice: 0,
      payment: 0,
      reminder: 0,
      expense: 0,
    };
    for (const e of events) c[e.kind] += 1;
    return c;
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (!enabledKinds[e.kind]) return false;
      if (!q) return true;
      const hay = `${e.title} ${e.subtitle || ''} ${e.status || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [events, enabledKinds, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const e of filtered) {
      const k = dayKey(e.ts);
      const arr = map.get(k) || [];
      arr.push(e);
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const toggleKind = (kind: TimelineKind) => {
    setEnabledKinds((prev) => ({ ...prev, [kind]: !prev[kind] }));
  };

  const setAll = (next: boolean) => {
    setEnabledKinds({
      client: next,
      quote: next,
      invoice: next,
      payment: next,
      reminder: next,
      expense: next,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search timeline…"
              className="w-full bg-[#0B0F19]/60 border border-slate-800/60 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="px-3 py-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            Reset
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="px-3 py-2 rounded-lg bg-[#0B0F19] border border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="px-3 py-2 rounded-lg bg-[#0B0F19] border border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            None
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(kindMeta) as TimelineKind[]).map((kind) => {
          const meta = kindMeta[kind];
          const on = enabledKinds[kind];
          return (
            <button
              key={kind}
              type="button"
              onClick={() => toggleKind(kind)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                on ? meta.chip : 'bg-[#151B28] text-slate-500 border-slate-800/60 hover:text-slate-300'
              }`}
              title={meta.label}
            >
              <meta.Icon size={14} />
              {meta.label}
              <span className="px-2 py-0.5 rounded-full bg-black/20 border border-white/10 text-[10px] font-black">
                {counts[kind]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
        {filtered.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-slate-600 text-xs font-black uppercase tracking-[0.3em]">No matching activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <div className="px-6 py-3 bg-[#0B0F19]/50 border-b border-slate-800/40">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">{day}</p>
                </div>
                <div className="divide-y divide-slate-800/30">
                  {items.map((e) => {
                    const meta = kindMeta[e.kind];
                    const Icon = meta.Icon;
                    const time = new Date(e.ts).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                    const Row = (
                      <div className="px-6 py-4 flex items-start gap-4 hover:bg-slate-800/20 transition-colors">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${meta.chip}`}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-white font-black text-sm truncate">{e.title}</p>
                              {e.subtitle && <p className="text-slate-500 text-xs font-bold truncate">{e.subtitle}</p>}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {typeof e.amount === 'number' && (
                                <span className="text-slate-200 text-xs font-black">{formatCurrency(e.amount)}</span>
                              )}
                              {e.status && (
                                <span className="px-2 py-1 rounded bg-slate-800/70 text-slate-300 text-[10px] font-black uppercase tracking-widest">
                                  {e.status}
                                </span>
                              )}
                              <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    return e.href ? (
                      <Link key={e.id} href={e.href} className="block">
                        {Row}
                      </Link>
                    ) : (
                      <div key={e.id}>{Row}</div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

