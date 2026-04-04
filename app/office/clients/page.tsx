import { createClient } from '@/lib/supabase/server';
import {
  Users,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import ClientsControls from './ClientsControls';
import ClientsTableClient from './ClientsTableClient';
import ClientActions from './ClientActions';
import ImportBanner from './ImportBanner';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 })
    .format(amount)
    .replace('ZAR', 'R');

type CategoryFilter = '' | 'Service Support' | 'Projects' | 'Back up Power Supply' | 'Software Support';
type BalanceFilter = '' | 'has_balance';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const q = typeof params.q === 'string' ? params.q : '';
  const filter = typeof params.filter === 'string' ? params.filter : 'active';
  const category = typeof params.category === 'string' ? params.category : '';
  const balance = typeof params.balance === 'string' ? params.balance : '';

  // ── Fetch clients with outstanding summary ─────────────────────────────────
  let query = supabase
    .from('clients')
    .select(`*, invoices(balance_due, status, due_date)`);

  if (q) {
    query = query.or(`company_name.ilike.%${q}%,contact_person.ilike.%${q}%`);
  }

  if (filter === 'active') {
    query = query.eq('is_active', true);
  } else if (filter === 'inactive') {
    query = query.eq('is_active', false);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data: clientsData } = await query.order('company_name', { ascending: true });

  // Fetch outstanding summary for all clients
  const { data: outstandingSummary } = await supabase
    .from('client_outstanding_summary')
    .select('client_id, invoice_balance, opening_balance, opening_balance_settled, total_outstanding');

  const outstandingMap = new Map(
    outstandingSummary?.map(s => [s.client_id, s]) || []
  );

  // ── Process ────────────────────────────────────────────────────────────────
  let clients = clientsData?.map((client: any) => {
    const summary = outstandingMap.get(client.id);
    const invoiceBalance = summary?.invoice_balance || 0;
    const openingBalance = client.opening_balance || 0;
    const openingBalanceSettled = summary?.opening_balance_settled || false;
    const totalOutstanding = summary?.total_outstanding || 0;

    return {
      ...client,
      outstanding_balance: totalOutstanding,
      invoice_balance: invoiceBalance,
      opening_balance_settled: openingBalanceSettled
    };
  }) || [];

  // Client-side balance filter (has outstanding balance including opening balance)
  if (balance === 'has_balance') {
    clients = clients.filter(c => c.outstanding_balance > 0);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeCount = clientsData?.filter((c: any) => c.is_active).length || 0;

  // Get correct total outstanding from the same source as dashboard
  const totalOutstanding = outstandingSummary?.reduce((sum, c) => sum + (c.total_outstanding || 0), 0) || 0;

  // Get overdue amounts from invoices (overdue is only for actual invoices, not opening balances)
  const { data: allInvoices } = await supabase
    .from('invoices')
    .select('balance_due, due_date, status')
    .neq('status', 'Paid');

  const now = new Date();
  const totalOverdue = allInvoices
    ?.filter((i: any) => new Date(i.due_date) < now)
    .reduce((s: number, i: any) => s + (i.balance_due || 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Import banner — client component that reads sessionStorage */}
      <ImportBanner />

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Clients</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Manage your customer database and financial history
          </p>
        </div>
        <ClientActions />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={60} className="text-blue-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Active Clients</p>
          <h3 className="text-2xl font-black text-white">{activeCount}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={60} className="text-orange-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Outstanding</p>
          <h3 className="text-2xl font-black text-amber-500">{formatCurrency(totalOutstanding)}</h3>
        </div>

        <div className="bg-[#151B28] border border-red-500/20 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle size={60} className="text-red-500" />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Overdue</p>
          <h3 className="text-2xl font-black text-red-500">{formatCurrency(totalOverdue)}</h3>
        </div>
      </div>

      {/* Controls */}
      <ClientsControls
        initialQ={q}
        initialFilter={filter as any}
        initialCategory={category as CategoryFilter}
        initialBalance={balance as BalanceFilter}
      />

      {/* Clients Table */}
      {clients.length > 0 ? (
        <ClientsTableClient clients={clients} />
      ) : (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-24 text-center">
            <div className="max-w-xs mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 border border-slate-800/50">
                <UserPlus size={32} className="text-slate-700" />
              </div>
              <h3 className="text-white font-black uppercase tracking-tight mb-2">No Clients Found</h3>
              <p className="text-slate-500 text-xs font-medium mb-8">
                {q
                  ? `No clients match your search "${q}".`
                  : category
                    ? `No clients in the "${category}" category.`
                    : balance === 'has_balance'
                      ? 'No clients with outstanding balances.'
                      : 'Your client database is empty. Add your first client to start creating quotes and invoices.'}
              </p>
              {!q && !category && !balance && (
                <Link
                  href="/office/clients/new"
                  className="text-orange-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all"
                >
                  Add Your First Client <ChevronRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
