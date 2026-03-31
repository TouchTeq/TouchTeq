'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Clock, Search, Filter, ChevronDown, Activity as ActivityIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const formatRand = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R');
};

const TYPE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Invoices', value: 'Invoice' },
  { label: 'Quotes', value: 'Quote' },
  { label: 'Expenses', value: 'Expense' },
  { label: 'Certificates', value: 'Certificate' },
  { label: 'POs', value: 'Purchase Order' },
  { label: 'Credit Notes', value: 'Credit Note' },
  { label: 'Payments', value: 'Payment' },
];

function getActivityHref(act: { type: string; id: string }) {
  switch (act.type) {
    case 'Invoice':
      return `/office/invoices/${act.id}`;
    case 'Quote':
      return `/office/quotes/${act.id}`;
    case 'Expense':
      return `/office/expenses/${act.id}`;
    case 'Certificate':
      return `/office/certificates/${act.id}`;
    case 'Purchase Order':
      return `/office/purchase-orders`;
    case 'Credit Note':
      return `/office/invoices/${act.id}`;
    case 'Payment':
      return `/office/invoices`;
    default:
      return '/office/dashboard';
  }
}

function getTypePillClasses(type: string) {
  switch (type) {
    case 'Quote': return 'bg-blue-500/10 text-blue-500';
    case 'Invoice': return 'bg-orange-500/10 text-orange-500';
    case 'Payment': return 'bg-green-500/10 text-green-500';
    case 'Expense': return 'bg-red-500/10 text-red-500';
    case 'Certificate': return 'bg-purple-500/10 text-purple-500';
    case 'Purchase Order': return 'bg-cyan-500/10 text-cyan-500';
    case 'Credit Note': return 'bg-amber-500/10 text-amber-500';
    default: return 'bg-slate-500/10 text-slate-500';
  }
}

function getStatusClasses(status: string) {
  if (status === 'Draft') return 'text-slate-500';
  if (['Sent', 'Partially Paid'].includes(status)) return 'text-amber-500';
  if (['Accepted', 'Paid', 'Success', 'Completed', 'Issued'].includes(status)) return 'text-green-500';
  return 'text-red-500';
}

export default function ActivityClient({ activities }: { activities: any[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredActivities = useMemo(() => {
    let result = activities;

    if (activeFilter !== 'all') {
      result = result.filter(a => a.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        (a.ref && a.ref.toLowerCase().includes(q)) ||
        (a.client && a.client.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activities, activeFilter, searchQuery]);

  const activeFilterLabel = TYPE_FILTERS.find(f => f.value === activeFilter)?.label || 'All';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
          <ActivityIcon size={24} className="text-orange-500" />
          Activity Log
        </h1>
        <p className="text-slate-500 text-sm mt-1">Complete history of all documents and transactions</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by reference or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#151B28] border border-slate-800/50 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-3 bg-[#151B28] border border-slate-800/50 rounded-xl text-sm text-slate-400 hover:text-white transition-colors min-w-[160px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} />
              <span>{activeFilterLabel}</span>
            </div>
            <ChevronDown size={14} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showFilterDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute right-0 mt-2 w-48 bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                {TYPE_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setActiveFilter(filter.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      activeFilter === filter.value
                        ? 'bg-orange-500/10 text-orange-500 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-[#0B0F19]/50">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act, i) => {
                  const href = getActivityHref(act);
                  return (
                    <tr
                      key={`${act.type}-${act.id}-${i}`}
                      onClick={() => router.push(href)}
                      className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${getTypePillClasses(act.type)}`}>
                          {act.type}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold text-white text-sm">{act.ref}</td>
                      <td className="px-6 py-5 text-slate-400 text-sm font-medium">{act.client || 'Internal'}</td>
                      <td className="px-6 py-5 font-black text-white text-sm">{formatRand(act.amount)}</td>
                      <td className="px-6 py-5">
                        <span className={`text-xs font-bold ${getStatusClasses(act.status)}`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right text-slate-500 text-xs font-medium">
                        {format(new Date(act.date), 'dd MMM yyyy, HH:mm')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                    {searchQuery || activeFilter !== 'all' ? 'No matching activity found' : 'No activity recorded yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-slate-600 font-bold uppercase tracking-widest">
        Showing {filteredActivities.length} of {activities.length} activities
      </div>
    </div>
  );
}
