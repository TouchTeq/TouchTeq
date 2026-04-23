import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { 
  FileText,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import DeliveryNotesControls from './DeliveryNotesControls';
import DeliveryNotesTableClient from './DeliveryNotesTableClient';

export default async function DeliveryNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const status = typeof params.status === 'string' ? params.status : 'all';

  // 1. Build Query
  let query = supabase
    .from('delivery_notes')
    .select(`
      *,
      clients(company_name, contact_person),
      invoices(invoice_number)
    `);

  if (q) {
    query = query.or(`delivery_note_number.ilike.%${q}%,clients.company_name.ilike.%${q}%`);
  }

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: deliveryNotes } = await query.order('created_at', { ascending: false });

  // 2. Stats Summary
  const { data: statsData } = await supabase
    .from('delivery_notes')
    .select('status');

  const totalDelivered = statsData?.filter(d => d.status === 'Delivered').length || 0;
  const totalSigned = statsData?.filter(d => d.status === 'Signed').length || 0;
  const totalDisputed = statsData?.filter(d => d.status === 'Disputed').length || 0;
  const totalCount = statsData?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Delivery Notes</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Track deliveries and client sign-offs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            href="/office/delivery-notes/new"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm shadow-xl shadow-orange-500/20 w-fit"
          >
            <Plus size={16} />
            New Delivery Note
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total</p>
              <p className="text-2xl font-black text-white">{totalCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Delivered</p>
              <p className="text-2xl font-black text-white">{totalDelivered}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Signed</p>
              <p className="text-2xl font-black text-white">{totalSigned}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Disputed</p>
              <p className="text-2xl font-black text-white">{totalDisputed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div>Loading...</div>}>
        <DeliveryNotesControls />
      </Suspense>

      {/* Table */}
      {deliveryNotes && deliveryNotes.length > 0 ? (
        <DeliveryNotesTableClient deliveryNotes={deliveryNotes} />
      ) : (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-12 text-center">
          <FileText size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-black uppercase mb-2">No Delivery Notes</h3>
          <p className="text-slate-500 text-sm mb-6">Create your first delivery note to track deliveries.</p>
          <Link 
            href="/office/delivery-notes/new"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-bold text-sm uppercase tracking-widest"
          >
            Create Delivery Note <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
