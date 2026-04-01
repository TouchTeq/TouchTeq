import { createClient } from '@/lib/supabase/server';
import { format, startOfMonth, endOfMonth, parseISO, addDays } from 'date-fns';
import {
  Receipt,
  AlertCircle,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Plus,
  Users,
  Wallet,
  TrendingDown,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';
import WelcomeBanner from '@/components/office/WelcomeBanner';
import DashboardSummaryCards from '@/components/office/DashboardSummaryCards';
import RecentActivitySection from '@/components/office/RecentActivitySection';
import DashboardGreeting from '@/components/office/DashboardGreeting';
import { getTaskStats } from '@/lib/tasks/actions';

// Helper for Rand formatting
const formatRand = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R');
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const todayIso = format(now, 'yyyy-MM-dd');
  const nextWeekIso = format(addDays(now, 7), 'yyyy-MM-dd');
  const firstDayOfMonth = format(startOfMonth(now), 'yyyy-MM-dd');
  const lastDayOfMonth = format(endOfMonth(now), 'yyyy-MM-dd');

  // 1. Total outstanding (combines invoices + opening balances from Sage)
  const { data: outstandingSummary } = await supabase
    .from('client_outstanding_summary')
    .select('invoice_balance, opening_balance, total_outstanding, opening_balance_settled');

  const outstandingValue = outstandingSummary?.reduce((sum, c) => sum + (c.total_outstanding || 0), 0) || 0;
  const invoiceBalanceTotal = outstandingSummary?.reduce((sum, c) => sum + (c.invoice_balance || 0), 0) || 0;
  const openingBalanceTotal = outstandingSummary?.filter(c => !c.opening_balance_settled).reduce((sum, c) => sum + (c.opening_balance || 0), 0) || 0;
  const outstandingCount = outstandingSummary?.filter(c => c.total_outstanding > 0).length || 0;

  // 2. Total overdue invoices
  const { data: overdueData } = await supabase
    .from('invoices')
    .select('total, balance_due, due_date')
    .in('status', ['Sent', 'Overdue', 'Partially Paid'])
    .lt('due_date', format(now, 'yyyy-MM-dd'))
    .gt('balance_due', 0);

  const overdueCount = overdueData?.length || 0;
  const overdueValue = overdueData?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;

  // 3. Total invoiced this month
  const { data: monthInvoicedData } = await supabase
    .from('invoices')
    .select('total')
    .gte('issue_date', firstDayOfMonth)
    .lte('issue_date', lastDayOfMonth);

  const monthInvoicedValue = monthInvoicedData?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

  // 4. Total collected this month
  const { data: monthCollectedData } = await supabase
    .from('payments')
    .select('amount')
    .gte('payment_date', firstDayOfMonth)
    .lte('payment_date', lastDayOfMonth);

  const monthCollectedValue = monthCollectedData?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0;

  const { count: quotesExpiringSoon } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Draft', 'Sent'])
    .gte('expiry_date', todayIso)
    .lte('expiry_date', nextWeekIso);

  // 5. Next VAT period
  const { data: vatData } = await supabase
    .from('vat_periods')
    .select('*')
    .eq('status', 'Open')
    .gte('due_date', format(now, 'yyyy-MM-dd'))
    .order('due_date', { ascending: true })
    .limit(1)
    .single();

  const nextVatDue = vatData ? parseISO(vatData.due_date) : null;
  const daysToVat = nextVatDue ? Math.ceil((nextVatDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  // 6. P&L Snapshot (Current Month)
  const { data: monthInvoices } = await supabase
    .from('invoices')
    .select('total, subtotal, vat_amount, status')
    .gte('issue_date', firstDayOfMonth)
    .lte('issue_date', lastDayOfMonth)
    .not('status', 'eq', 'Draft');

  const { data: monthCreditNotes } = await supabase
    .from('credit_notes')
    .select('total, subtotal, vat_amount')
    .gte('issue_date', firstDayOfMonth)
    .lte('issue_date', lastDayOfMonth);

  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('amount_inclusive, input_vat_amount')
    .gte('expense_date', firstDayOfMonth)
    .lte('expense_date', lastDayOfMonth);

  const monthRevenue = monthInvoices?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;
  const monthCredits = monthCreditNotes?.reduce((sum, c) => sum + (c.total || 0), 0) || 0;
  const netRevenue = monthRevenue - monthCredits;
  const totalExpenses = monthExpenses?.reduce((sum, e) => sum + (e.amount_inclusive || 0), 0) || 0;
  const netProfit = netRevenue - totalExpenses;

  // 7. Recent Activity
  const [quotesRes, invoicesRes, paymentsRes, expensesRes, certificatesRes, posRes, creditNotesRes] = await Promise.all([
    supabase.from('quotes').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('payments').select('*, invoices(invoice_number, clients(company_name))').order('created_at', { ascending: false }).limit(5),
    supabase.from('expenses').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('certificates').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('purchase_orders').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('credit_notes').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(5),
  ]);

  const activities = [
    ...(quotesRes.data?.filter(q => q.clients !== null).map(q => ({
      id: q.id, type: 'Quote', ref: q.quote_number, client: q.clients?.company_name, amount: q.total, status: q.status, date: q.created_at
    })) || []),
    ...(invoicesRes.data?.filter(i => i.clients !== null).map(i => ({
      id: i.id, type: 'Invoice', ref: i.invoice_number, client: i.clients?.company_name, amount: i.total, status: i.status, date: i.created_at
    })) || []),
    ...(paymentsRes.data?.filter(p => p.invoices?.clients !== null).map(p => ({
      id: p.id, type: 'Payment', ref: p.invoices?.invoice_number, client: p.invoices?.clients?.company_name, amount: p.amount, status: 'Success', date: p.created_at
    })) || []),
    ...(expensesRes.data?.filter(e => e.clients !== null).map(e => ({
      id: e.id, type: 'Expense', ref: e.reference || `EXP-${e.id.slice(0, 8)}`, client: e.clients?.company_name, amount: e.amount_inclusive, status: e.status || 'Completed', date: e.created_at
    })) || []),
    ...(certificatesRes.data?.filter(c => c.clients !== null).map(c => ({
      id: c.id, type: 'Certificate', ref: c.certificate_number || `CERT-${c.id.slice(0, 8)}`, client: c.clients?.company_name, amount: c.amount || 0, status: c.status || 'Issued', date: c.created_at
    })) || []),
    ...(posRes.data?.filter(p => p.clients !== null).map(p => ({
      id: p.id, type: 'Purchase Order', ref: p.po_number || `PO-${p.id.slice(0, 8)}`, client: p.clients?.company_name, amount: p.total || 0, status: p.status || 'Draft', date: p.created_at
    })) || []),
    ...(creditNotesRes.data?.filter(cn => cn.clients !== null).map(cn => ({
      id: cn.id, type: 'Credit Note', ref: cn.credit_note_number || `CN-${cn.id.slice(0, 8)}`, client: cn.clients?.company_name, amount: cn.total || 0, status: cn.status || 'Draft', date: cn.created_at
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const { data: profile } = await supabase.from('business_profile').select('*').single();

  const { data: { user } } = await supabase.auth.getUser();
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    (user?.user_metadata?.name as string | undefined)?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  // Task stats
  const taskStats = await getTaskStats();

  return (
    <div className="space-y-10">
      <DashboardGreeting name={firstName} />
      <WelcomeBanner profile={profile} />
      <DashboardSummaryCards
        initialPreferences={profile?.document_settings?.notification_preferences || null}
        dailySummary={{
          outstandingInvoices: outstandingCount,
          quotesExpiringSoon: quotesExpiringSoon || 0,
          daysToVat,
        }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Outstanding Invoices */}
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Receipt size={80} className="text-orange-500" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Outstanding</p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-4xl font-black text-white">{formatRand(outstandingValue)}</h3>
                <span className="text-xs font-bold px-2 py-1 bg-orange-500/10 text-orange-500 rounded">{outstandingCount} Clients</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase">Invoices</span>
              <span className="text-[10px] font-black text-orange-500">{formatRand(invoiceBalanceTotal)}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase">Imported</span>
              <span className="text-[10px] font-black text-amber-500">{formatRand(openingBalanceTotal)}</span>
            </div>
          </div>
        </div>

        {/* P&L Snapshot */}
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group col-span-1 md:col-span-2 xl:col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={80} className="text-cyan-500" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Net Profit (This Month)</p>
              <h3 className={`text-4xl font-black ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatRand(netProfit)}
              </h3>
            </div>
            <Link href="/office/reports?report=7" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
              <ExternalLink size={16} />
            </Link>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase">Revenue</span>
              <span className="text-[10px] font-black text-green-500">{formatRand(netRevenue)}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase">Expenses</span>
              <span className="text-[10px] font-black text-red-400">-{formatRand(totalExpenses)}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase">Profit Margin</span>
              <span className={`text-[10px] font-black uppercase ${netRevenue > 0 ? (netProfit / netRevenue * 100 >= 0 ? 'text-green-500' : 'text-red-500') : 'text-slate-500'}`}>
                {netRevenue > 0 ? `${(netProfit / netRevenue * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* VAT Snapshot */}
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group col-span-1 md:col-span-2 xl:col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <PieChartIcon size={80} className="text-amber-500" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Current VAT Balance</p>
              <h3 className={`text-4xl font-black ${Number(vatData?.net_vat_payable || 0) > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                {formatRand(vatData?.net_vat_payable || 0)}
              </h3>
            </div>
            <Link href="/office/vat" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
              <ExternalLink size={16} />
            </Link>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase">Period Status</span>
              <span className={`text-[10px] font-black uppercase ${vatData?.status === 'Submitted' ? 'text-green-500' : 'text-orange-500'}`}>
                {vatData?.status || 'No Period'}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase">Submission Deadline</span>
              <span className={`text-[10px] font-black uppercase ${daysToVat !== null && daysToVat < 7 ? 'text-red-500' : 'text-white'}`}>
                {vatData ? format(parseISO(vatData.due_date), 'dd MMM yyyy') : 'N/A'}
              </span>
            </div>
            {vatData?.status !== 'Submitted' && daysToVat !== null && (
              <>
                <div className="w-px h-8 bg-slate-800" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Countdown</span>
                  <span className="text-[10px] font-black text-white uppercase">{daysToVat} Days Left</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Summary Card */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <CheckSquare size={80} className="text-orange-500" />
        </div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tasks Overview</p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-4xl font-black text-white">{taskStats.todo + taskStats.inProgress}</h3>
              <span className="text-xs font-bold px-2 py-1 bg-slate-700/50 text-slate-300 rounded">{taskStats.total} Total</span>
            </div>
          </div>
          <Link href="/office/tasks" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
            <ExternalLink size={16} />
          </Link>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase">Overdue</span>
            <span className="text-[10px] font-black text-red-500">{taskStats.overdue}</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase">Due Today</span>
            <span className="text-[10px] font-black text-blue-400">{taskStats.dueToday}</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase">Due This Week</span>
            <span className="text-[10px] font-black text-cyan-400">{taskStats.dueThisWeek}</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase">Completed</span>
            <span className="text-[10px] font-black text-green-500">{taskStats.done}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivitySection activities={activities} />

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 ml-1">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/office/quotes/new" className="flex items-center justify-between bg-white/5 border border-slate-800 hover:bg-orange-500 hover:border-orange-500 transition-all p-5 group rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 group-hover:bg-white/20 rounded-lg text-orange-500 group-hover:text-white transition-colors">
                <Plus size={20} />
              </div>
              <span className="font-black text-sm uppercase tracking-wider text-white">Create New Quote</span>
            </div>
            <ChevronRightIcon size={18} className="text-slate-600 group-hover:text-white" />
          </Link>

          <Link href="/office/invoices/new" className="flex items-center justify-between bg-white/5 border border-slate-800 hover:bg-orange-500 hover:border-orange-500 transition-all p-5 group rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 group-hover:bg-white/20 rounded-lg text-orange-500 group-hover:text-white transition-colors">
                <Receipt size={20} />
              </div>
              <span className="font-black text-sm uppercase tracking-wider text-white">Issue New Invoice</span>
            </div>
            <ChevronRightIcon size={18} className="text-slate-600 group-hover:text-white" />
          </Link>

          <Link href="/office/clients/new" className="flex items-center justify-between bg-white/5 border border-slate-800 hover:bg-orange-500 hover:border-orange-500 transition-all p-5 group rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 group-hover:bg-white/20 rounded-lg text-orange-500 group-hover:text-white transition-colors">
                <Users size={20} />
              </div>
              <span className="font-black text-sm uppercase tracking-wider text-white">Register New Client</span>
            </div>
            <ChevronRightIcon size={18} className="text-slate-600 group-hover:text-white" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Minimal icons to avoid missing imports in the server component if not using the main layout's ones
function PieChartIcon(props: any) {

  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function ChevronRightIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
