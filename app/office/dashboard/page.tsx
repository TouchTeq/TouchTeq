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
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import WelcomeBanner from '@/components/office/WelcomeBanner';
import DashboardSummaryCards from '@/components/office/DashboardSummaryCards';

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

  // 1. Total outstanding invoices
  const { data: outstandingData } = await supabase
    .from('invoices')
    .select('total, balance_due')
    .in('status', ['Sent', 'Partially Paid']);
  
  const outstandingCount = outstandingData?.length || 0;
  const outstandingValue = outstandingData?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;

  // 2. Total overdue invoices
  const { data: overdueData } = await supabase
    .from('invoices')
    .select('total, balance_due, due_date')
    .neq('status', 'Paid')
    .lt('due_date', format(now, 'yyyy-MM-dd'));

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
  const [quotesRes, invoicesRes, paymentsRes] = await Promise.all([
    supabase.from('quotes').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('payments').select('*, invoices(invoice_number, clients(company_name))').order('created_at', { ascending: false }).limit(5),
  ]);

  const activities = [
    ...(quotesRes.data?.map(q => ({ 
      id: q.id, type: 'Quote', ref: q.quote_number, client: q.clients?.company_name, amount: q.total, status: q.status, date: q.created_at 
    })) || []),
    ...(invoicesRes.data?.map(i => ({ 
      id: i.id, type: 'Invoice', ref: i.invoice_number, client: i.clients?.company_name, amount: i.total, status: i.status, date: i.created_at 
    })) || []),
    ...(paymentsRes.data?.map(p => ({ 
      id: p.id, type: 'Payment', ref: p.invoices?.invoice_number, client: p.invoices?.clients?.company_name, amount: p.amount, status: 'Success', date: p.created_at 
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const { data: profile } = await supabase.from('business_profile').select('*').single();

  return (
    <div className="space-y-10">
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
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Outstanding Invoices</p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-3xl font-black text-white">{formatRand(outstandingValue)}</h3>
            <span className="text-xs font-bold px-2 py-1 bg-orange-500/10 text-orange-500 rounded">{outstandingCount} Active</span>
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
               <span className="text-[9px] font-black text-slate-500 uppercase">Revenue</span>
               <span className="text-[10px] font-black text-green-500">{formatRand(netRevenue)}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase">Expenses</span>
               <span className="text-[10px] font-black text-red-400">-{formatRand(totalExpenses)}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase">Profit Margin</span>
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
               <span className="text-[9px] font-black text-slate-500 uppercase">Period Status</span>
               <span className={`text-[10px] font-black uppercase ${vatData?.status === 'Submitted' ? 'text-green-500' : 'text-orange-500'}`}>
                 {vatData?.status || 'No Period'}
               </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase">Submission Deadline</span>
               <span className={`text-[10px] font-black uppercase ${daysToVat !== null && daysToVat < 7 ? 'text-red-500' : 'text-white'}`}>
                  {vatData ? format(parseISO(vatData.due_date), 'dd MMM yyyy') : 'N/A'}
               </span>
            </div>
            {vatData?.status !== 'Submitted' && daysToVat !== null && (
               <>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-500 uppercase">Countdown</span>
                     <span className="text-[10px] font-black text-white uppercase">{daysToVat} Days Left</span>
                  </div>
               </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-orange-500" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Recent Activity</h2>
          </div>
          <Link href="/office/reports" className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-orange-500 transition-colors flex items-center gap-2">
            View All Activity <ExternalLink size={14} />
          </Link>
        </div>
        
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
              {activities.length > 0 ? (
                activities.map((act, i) => (
                  <tr key={i} className="group hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${
                        act.type === 'Quote' ? 'bg-blue-500/10 text-blue-500' :
                        act.type === 'Invoice' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {act.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-white text-sm">{act.ref}</td>
                    <td className="px-6 py-5 text-slate-400 text-sm font-medium">{act.client || 'Internal'}</td>
                    <td className="px-6 py-5 font-black text-white text-sm">{formatRand(act.amount)}</td>
                    <td className="px-6 py-5">
                      <span className={`text-xs font-bold ${
                        act.status === 'Draft' ? 'text-slate-500' :
                        ['Sent', 'Partially Paid'].includes(act.status) ? 'text-amber-500' :
                        ['Accepted', 'Paid', 'Success'].includes(act.status) ? 'text-green-500' :
                        'text-red-500'
                      }`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-slate-500 text-xs font-medium">
                      {format(new Date(act.date), 'dd MMM, HH:mm')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                    No recent activity found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
