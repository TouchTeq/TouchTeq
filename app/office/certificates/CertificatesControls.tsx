'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

const CERTIFICATE_TYPES = [
  { label: 'Commissioning', value: 'commissioning' },
  { label: 'HAC', value: 'hac' },
  { label: 'SAT Report', value: 'sat' },
  { label: 'As-Built', value: 'as_built' },
  { label: 'Installation', value: 'installation' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'SIL Report', value: 'sil' },
];

export default function CertificatesControls({
  initialQ,
  initialType,
  initialStatus,
}: {
  initialQ: string;
  initialType: string;
  initialStatus: string;
}) {
  const [q, setQ] = useState(initialQ);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set('q', q);
      else params.delete('q');
      router.push(`${pathname}?${params.toString()}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [q, pathname, router, searchParams]);

  const setParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'all') params.delete(key);
    else params.set(key, val);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-[#151B28]/50 p-4 border border-slate-800/50 rounded-xl">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Search by certificate number, client or project reference..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 text-sm focus:border-orange-500 outline-none transition-all font-medium"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter by</span>
        </div>

        <select
          value={initialType}
          onChange={(e) => setParam('type', e.target.value)}
          className="bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs font-black uppercase tracking-widest focus:border-orange-500 outline-none cursor-pointer"
        >
          <option value="all">All Types</option>
          {CERTIFICATE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={initialStatus}
          onChange={(e) => setParam('status', e.target.value)}
          className="bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs font-black uppercase tracking-widest focus:border-orange-500 outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Issued">Issued</option>
          <option value="Superseded">Superseded</option>
        </select>
      </div>
    </div>
  );
}
