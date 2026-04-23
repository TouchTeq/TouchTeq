import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  Receipt,
  Plus,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileMinus,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { startOfMonth, endOfMonth } from 'date-fns';
import InvoicesControls from './InvoicesControls';
import InvoicesTableClient from './InvoicesTableClient';
import { syncInvoiceStatuses } from '@/lib/office/status-actions';
import InvoiceImportButton from '@/components/office/InvoiceImportButton';
import { CreditNotesTable } from '@/components/office/CreditNotesTable';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R');
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const status = typeof params.status === 'string' ? params.status : 'all';
  const range = typeof params.range === 'string' ? params.range : 'this-month';
  const tab = typeof params.tab === 'string' ? params.tab : 'invoices';

  // Fetch recurring invoices if on recurring tab
  let recurringInvoices: any[] = [];
  if (tab === 'recurring') {
    const { data: recurringData } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(company_name)
      `)
      .eq('is_recurring', true)
      .order('recurring_next_date', { ascending: true });
    recurringInvoices = recurringData || [];
  }

  // 1. Build Query - use LEFT JOIN to include quick client invoices (client_id IS NULL)
  let query = supabase
    .from('invoices')
    .select(`
      *,
      clients(company_name, contact_person)
    `);

  if (q) {
    query = query.or(`invoice_number.ilike.%${q}%,clients.company_name.ilike.%${q}%`);
  }

  if (status !== 'all') {
    query = query.eq('status', status.charAt(0).toUpperCase() + status.slice(1));
  }

  // Date Range Logic
  const now = new Date();
  if (range === 'this-month') {
    query = query.gte('issue_date', startOfMonth(now).toISOString().split('T')[0])
      .lte('issue_date', endOfMonth(now).toISOString().split('T')[0]);
  } else if (range === 'last-month') {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    query = query.gte('issue_date', startOfMonth(lastMonth).toISOString().split('T')[0])
      .lte('issue_date', endOfMonth(lastMonth).toISOString().split('T')[0]);
  } else if (range === 'this-quarter') {
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const startOfQuarter = new Date(now.getFullYear(), quarterMonth, 1);
    query = query.gte('issue_date', startOfQuarter.toISOString().split('T')[0]);
  }

  const { data: invoicesRaw } = await query.order('created_at', { ascending: false });

  // Include quick client invoices (client_id can be NULL with quick_client_name populated)
  const invoices = invoicesRaw || [];

  // Fetch credit notes if on credit-notes tab
  let creditNotes: any[] = [];
  if (tab === 'credit-notes') {
    const { data: cnData } = await supabase
      .from('credit_notes')
      .select(`
        *,
        clients(company_name, physical_address, vat_number),
        invoices(invoice_number),
        credit_note_items(*)
      `)
      .order('created_at', { ascending: false });
    creditNotes = cnData || [];
  }

  // 2. Stats Calculations
  const firstDayMonth = startOfMonth(now).toISOString().split('T')[0];
  const lastDayMonth = endOfMonth(now).toISOString().split('T')[0];

  const { data: monthData } = await supabase
    .from('invoices')
    .select('total, amount_paid, status, issue_date')
    .gte('issue_date', firstDayMonth)
    .lte('issue_date', lastDayMonth);

  const invoicedThisMonth = monthData?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

  // Real collected this month might need checking payments table, 
  // but for simple dash we'll use sum of amount_paid for invoices issued this month for now 
  // or better: all amount_paid across all invoices? 
  // Let's stick to simple "Collected this month" = sum(amount) from payments in this month.
  const { data: paymentsThisMonth } = await supabase
    .from('payments')
    .select('amount')
    .gte('payment_date', firstDayMonth)
    .lte('payment_date', lastDayMonth);
  const collectedThisMonth = paymentsThisMonth?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const { data: allUnpaid } = await supabase
    .from('invoices')
    .select('balance_due, status')
    .not('status', 'eq', 'Paid')
    .not('status', 'eq', 'Draft');

  const totalOutstanding = allUnpaid?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;
  const totalOverdue = allUnpaid?.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Invoice Manager</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Tracking financial growth and client settlements
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action={syncInvoiceStatuses}>
            <button
              type="submit"
              className="flex items-center gap-2 border border-slate-800/50 bg-[#151B28] hover:bg-slate-800/60 transition-all font-black text-xs uppercase tracking-widest text-slate-200 px-5 py-3 rounded-sm"
            >
              <Clock size={16} />
              Sync Due Statuses
            </button>
          </form>
          <InvoiceImportButton />
          <Link
            href="/office/invoices/new"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm shadow-xl shadow-orange-500/20 w-fit"
          >
            <Plus size={16} />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#151B28] p-1 rounded-lg border border-slate-800/50 w-fit">
        <Link
          href="/office/invoices"
          className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${tab === 'invoices'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
              : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <span className="flex items-center gap-2">
            <Receipt size={14} /> Invoices
          </span>
        </Link>
        <Link
          href="/office/invoices?tab=credit-notes"
          className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${tab === 'credit-notes'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
              : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <span className="flex items-center gap-2">
            <FileMinus size={14} /> Credit Notes
          </span>
        </Link>
        <Link
          href="/office/invoices?tab=recurring"
          className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${tab === 'recurring'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
              : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <span className="flex items-center gap-2">
            <RefreshCw size={14} /> Recurring
          </span>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-orange-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
            Invoiced (Month) <TrendingUp size={12} className="text-slate-700" />
          </p>
          <h3 className="text-2xl font-black text-white">{formatCurrency(invoicedThisMonth)}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-green-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
            Collected (Month) <ArrowUpRight size={12} className="text-green-900" />
          </p>
          <h3 className="text-2xl font-black text-green-500">{formatCurrency(collectedThisMonth)}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-amber-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
            Total Outstanding <Clock size={12} className="text-amber-900" />
          </p>
          <h3 className="text-2xl font-black text-amber-500">{formatCurrency(totalOutstanding)}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-red-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
            Total Overdue <AlertCircle size={12} className="text-red-900" />
          </p>
          <h3 className="text-2xl font-black text-red-500">{formatCurrency(totalOverdue)}</h3>
        </div>
      </div>

      {/* Content based on tab */}
      {tab === 'invoices' && (
        <>
          <Suspense fallback={<div>Loading...</div>}>
            <InvoicesControls initialQ={q} initialStatus={status as any} initialRange={range as any} />
          </Suspense>
          {invoices && invoices.length > 0 ? (
            <InvoicesTableClient invoices={invoices} />
          ) : (
            <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
              <div className="px-6 py-24 text-center">
                <div className="max-w-xs mx-auto flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 border border-slate-800/50">
                    <Receipt size={32} className="text-slate-700" />
                  </div>
                  <h3 className="text-white font-black uppercase tracking-tight mb-2">No Invoices Found</h3>
                  <p className="text-slate-500 text-xs font-medium mb-8">
                    {q
                      ? `No invoices match your search "${q}".`
                      : "You haven't issued any invoices yet. Start by creating a tax invoice for your services."}
                  </p>
                  <Link
                    href="/office/invoices/new"
                    className="text-orange-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    Create Your First Invoice <Plus size={16} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'credit-notes' && (
        <CreditNotesTable creditNotes={creditNotes} />
      )}

      {tab === 'recurring' && (
        <>
          {recurringInvoices.length > 0 ? (
            <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[10px] uppercase font-black bg-slate-900/50 border-b border-slate-800">
                      <th className="px-6 py-4">Invoice #</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Frequency</th>
                      <th className="px-6 py-4">Next Due</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Auto-send</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {recurringInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-black text-white text-sm">{inv.invoice_number}</span>
                          <span className="ml-2 text-[8px] font-black uppercase px-1.5 py-0.5 bg-cyan-500/10 text-cyan-500 rounded">⟳</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white text-sm font-bold">{inv.clients?.company_name || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-400 text-xs capitalize">{inv.recurring_frequency}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-400 text-xs">{inv.recurring_next_date}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-black text-white">{formatCurrency(inv.total)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${inv.recurring_auto_send ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                            {inv.recurring_auto_send ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/office/invoices/${inv.id}`}
                            className="text-orange-500 hover:text-orange-400 text-xs font-bold uppercase"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
              <div className="px-6 py-24 text-center">
                <div className="max-w-xs mx-auto flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 border border-slate-800/50">
                    <RefreshCw size={32} className="text-slate-700" />
                  </div>
                  <h3 className="text-white font-black uppercase tracking-tight mb-2">No Recurring Invoices</h3>
                  <p className="text-slate-500 text-xs font-medium">
                    Create a recurring invoice by checking "Make Recurring" when creating an invoice.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
