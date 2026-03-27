'use client';

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  FileText, 
  Plus, 
  FileInput, 
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import QuotesControls from './QuotesControls';
import QuotesTableClient from './QuotesTableClient';
import { syncQuoteStatuses } from '@/lib/office/status-actions';
import { useState, useEffect } from 'react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R');
};

export default function QuotesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    }>
      <QuotesPageContent />
    </Suspense>
  );
}

function QuotesPageContent() {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    acceptedValue: 0,
    pendingValue: 0
  });
  const [loading, setLoading] = useState(true);

  // We could use useSearchParams here if we wanted to replicate the server-side logic exactly,
  // but QuotesControls already handles syncing with searchParams.
  // For the initial load, let's just fetch everything or use a simple effect.
  
  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Quotes
      const { data: quotesData } = await supabase
        .from('quotes')
        .select(`
          *,
          clients(company_name, contact_person)
        `)
        .order('created_at', { ascending: false });

      setQuotes(quotesData || []);

      // 2. Stats for the month
      const firstDay = startOfMonth(new Date()).toISOString();
      const lastDay = endOfMonth(new Date()).toISOString();

      const { data: monthQuotes } = await supabase
        .from('quotes')
        .select('total, status, created_at')
        .gte('created_at', firstDay)
        .lte('created_at', lastDay);

      const totalThisMonth = monthQuotes?.length || 0;
      const acceptedValue = monthQuotes?.filter(q => q.status === 'Accepted').reduce((sum, q) => sum + (q.total || 0), 0) || 0;
      
      const { data: pendingQuotes } = await supabase
        .from('quotes')
        .select('total')
        .eq('status', 'Sent');
      
      const pendingValue = pendingQuotes?.reduce((sum, q) => sum + (q.total || 0), 0) || 0;

      setStats({ totalThisMonth, acceptedValue, pendingValue });
      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Quotations</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Create and track professional branded quotes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action={syncQuoteStatuses}>
            <button
              type="submit"
              className="flex items-center gap-2 border border-slate-800/50 bg-[#151B28] hover:bg-slate-800/60 transition-all font-black text-xs uppercase tracking-widest text-slate-200 px-5 py-3 rounded-sm"
            >
              <Clock size={16} />
              Sync Expired Quotes
            </button>
          </form>
          <Link 
            href="/office/quotes/new"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm shadow-xl shadow-orange-500/20 w-fit"
          >
            <Plus size={16} />
            New Quote
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-1 group-hover:opacity-10 transition-opacity">
            <FileInput size={60} className="text-white" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total This Month</p>
          <h3 className="text-2xl font-black text-white">{stats.totalThisMonth} Quotes</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-1 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 size={60} className="text-green-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Accepted (Month)</p>
          <h3 className="text-2xl font-black text-green-500">{formatCurrency(stats.acceptedValue)}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-1 group-hover:opacity-10 transition-opacity">
            <Clock size={60} className="text-blue-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Pending (Sent)</p>
          <h3 className="text-2xl font-black text-blue-500">{formatCurrency(stats.pendingValue)}</h3>
        </div>
      </div>

      {/* Controls */}
      <QuotesControls initialQ={""} initialStatus={"all"} />

      {/* Quotes Table */}
      {quotes && quotes.length > 0 ? (
        <QuotesTableClient quotes={quotes} />
      ) : (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-24 text-center">
            <div className="max-w-xs mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 border border-slate-800/50">
                <FileText size={32} className="text-slate-700" />
              </div>
              <h3 className="text-white font-black uppercase tracking-tight mb-2">No Quotes Found</h3>
              <p className="text-slate-500 text-xs font-medium mb-8">
                You haven't created any quotes yet. Start by generating a professional proposal.
              </p>
              <Link
                href="/office/quotes/new"
                className="text-orange-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all"
              >
                Create Your First Quote <Plus size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

