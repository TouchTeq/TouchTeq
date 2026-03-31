'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function DeliveryNotesControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    router.push(`/office/delivery-notes?${params.toString()}`);
  };

  const clearFilters = () => {
    setQ('');
    setStatus('all');
    router.push('/office/delivery-notes');
  };

  const hasFilters = q || status !== 'all';

  return (
    <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search delivery notes..."
          className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-orange-500 outline-none transition-all"
        />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-[#0B0F19] border border-slate-800 rounded-lg pl-10 pr-8 py-2.5 text-white text-sm focus:border-orange-500 outline-none appearance-none cursor-pointer min-w-[150px]"
        >
          <option value="all">All Status</option>
          <option value="Delivered">Delivered</option>
          <option value="Signed">Signed</option>
          <option value="Disputed">Disputed</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all"
      >
        Filter
      </button>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-2 text-slate-500 hover:text-white px-4 py-2.5 font-bold text-xs uppercase tracking-widest transition-all"
        >
          <X size={14} /> Clear
        </button>
      )}
    </form>
  );
}
