'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  AlertTriangle,
  Download,
  Loader2,
  Save,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { format, addDays, differenceInDays, parseISO, startOfDay } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';

export default function CashFlowPage() {
  const supabase = createClient();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState(true);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showBalanceInput, setShowBalanceInput] = useState(false);
  const [newBalance, setNewBalance] = useState('');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const today = startOfDay(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch business profile for opening balance
      const { data: profileData } = await supabase
        .from('business_profile')
        .select('opening_balance')
        .single();
      
      if (profileData) {
        setOpeningBalance(profileData.opening_balance || 0);
        setNewBalance(String(profileData.opening_balance || 0));
      }

      // Fetch unpaid/partial invoices with due dates
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*, clients(company_name)')
        .in('status', ['Sent', 'Partially Paid'])
        .not('balance_due', 'eq', 0)
        .order('due_date', { ascending: true });

      // Fetch upcoming expenses (next 90 days)
      const ninetyDaysFromNow = format(addDays(new Date(), 90), 'yyyy-MM-dd');
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*, clients(company_name)')
        .gte('expense_date', format(new Date(), 'yyyy-MM-dd'))
        .lte('expense_date', ninetyDaysFromNow)
        .order('expense_date', { ascending: true });

      setInvoices(invoiceData || []);
      setExpenses(expenseData || []);
    } catch (err: any) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const saveOpeningBalance = async () => {
    setSaving(true);
    try {
      const balance = parseFloat(newBalance) || 0;
      await supabase
        .from('business_profile')
        .update({ opening_balance: balance })
        .eq('id', profile?.id);
      
      setOpeningBalance(balance);
      setShowBalanceInput(false);
      toast.success({ title: 'Saved', message: 'Opening balance updated' });
    } catch (err: any) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount).replace('ZAR', 'R');

  // Calculate projections
  const projections = useMemo(() => {
    const days = [30, 60, 90];
    const result: Record<number, { date: Date; balance: number; isGap: boolean }[]> = {};
    
    days.forEach(day => {
      result[day] = [];
      let runningBalance = openingBalance;
      const targetDate = addDays(today, day);
      
      // Process each day
      for (let d = 0; d <= day; d++) {
        const currentDate = addDays(today, d);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        // Money in on this day (invoices due or paid)
        const dayInvoices = invoices.filter(inv => {
          const dueDate = format(parseISO(inv.due_date), 'yyyy-MM-dd');
          const isPaid = inv.status === 'Paid';
          return (dueDate === dateStr && !isPaid) || (isPaid && format(parseISO(inv.paid_date || inv.updated_at), 'yyyy-MM-dd') === dateStr);
        });
        
        // Money out on this day (expenses)
        const dayExpenses = expenses.filter(exp => 
          format(parseISO(exp.expense_date), 'yyyy-MM-dd') === dateStr
        );
        
        const dayIn = dayInvoices.reduce((sum, inv) => sum + (inv.balance_due || inv.total || 0), 0);
        const dayOut = dayExpenses.reduce((sum, exp) => sum + (exp.amount_inclusive || 0), 0);
        
        runningBalance += dayIn - dayOut;
        
        result[day].push({
          date: currentDate,
          balance: runningBalance,
          isGap: runningBalance < 0
        });
      }
    });
    
    return result;
  }, [invoices, expenses, openingBalance, today]);

  const getInvoiceStatus = (dueDate: string, status: string) => {
    if (status === 'Paid') return 'paid';
    const due = parseISO(dueDate);
    const daysUntilDue = differenceInDays(due, today);
    
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 7) return 'due-soon';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'due-soon': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-800/50 text-slate-400 border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={14} />;
      case 'overdue': return <XCircle size={14} />;
      case 'due-soon': return <Clock size={14} />;
      default: return <Calendar size={14} />;
    }
  };

  const totalExpectedIn = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + (i.balance_due || 0), 0);
  const totalExpectedOut = expenses.reduce((sum, e) => sum + (e.amount_inclusive || 0), 0);
  const projected30Day = projections[30][projections[30].length - 1]?.balance || openingBalance;
  const projected60Day = projections[60][projections[60].length - 1]?.balance || openingBalance;
  const projected90Day = projections[90][projections[90].length - 1]?.balance || openingBalance;

  const hasGaps = projections[30].some(d => d.isGap);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase">Cash Flow Tracker</h1>
          <p className="text-slate-500 text-sm">Monitor money coming in vs going out</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-black uppercase">
          <Download size={14} />
          Export PDF
        </button>
      </div>

      {/* Opening Balance */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
              <Wallet size={24} className="text-cyan-500" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-black uppercase">Opening Balance</p>
              <p className="text-white font-black text-2xl">{formatCurrency(openingBalance)}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowBalanceInput(!showBalanceInput)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-black uppercase hover:bg-slate-700"
          >
            Update Balance
          </button>
        </div>
        
        {showBalanceInput && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-4">
            <input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              placeholder="Enter current bank balance"
              className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white"
            />
            <button
              onClick={saveOpeningBalance}
              disabled={saving}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg text-xs font-black uppercase flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={16} className="text-green-500" />
            <span className="text-slate-500 text-[10px] font-black uppercase">Expected In</span>
          </div>
          <p className="text-2xl font-black text-green-500">{formatCurrency(totalExpectedIn)}</p>
          <p className="text-slate-500 text-xs mt-1">{invoices.filter(i => i.status !== 'Paid').length} invoices</p>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight size={16} className="text-red-500" />
            <span className="text-slate-500 text-[10px] font-black uppercase">Expected Out</span>
          </div>
          <p className="text-2xl font-black text-red-500">{formatCurrency(totalExpectedOut)}</p>
          <p className="text-slate-500 text-xs mt-1">{expenses.length} expenses</p>
        </div>

        <div className={`bg-[#151B28] border p-6 rounded-xl ${hasGaps ? 'border-red-500/50' : 'border-slate-800/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {hasGaps ? <AlertTriangle size={16} className="text-red-500" /> : <TrendingUp size={16} className="text-green-500" />}
            <span className="text-slate-500 text-[10px] font-black uppercase">30-Day Projection</span>
          </div>
          <p className={`text-2xl font-black ${projected30Day >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(projected30Day)}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {hasGaps ? 'Cash gap detected!' : 'Healthy cash flow'}
          </p>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-cyan-500" />
            <span className="text-slate-500 text-[10px] font-black uppercase">90-Day Projection</span>
          </div>
          <p className={`text-2xl font-black ${projected90Day >= 0 ? 'text-cyan-500' : 'text-red-500'}`}>
            {formatCurrency(projected90Day)}
          </p>
          <p className="text-slate-500 text-xs mt-1">End of period</p>
        </div>
      </div>

      {/* Cash Flow Gap Warning */}
      {hasGaps && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-red-500 font-black text-sm uppercase">Cash Flow Gap Detected</p>
            <p className="text-red-400 text-xs">Your projected expenses exceed income within the next 30 days. Review upcoming payments.</p>
          </div>
        </div>
      )}

      {/* Money In & Money Out */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Money In */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-green-500/5">
            <h3 className="text-green-500 font-black uppercase text-sm flex items-center gap-2">
              <ArrowUpRight size={16} /> Money In (Expected)
            </h3>
          </div>
          <div className="divide-y divide-slate-800/30 max-h-[400px] overflow-y-auto">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No pending invoices</div>
            ) : (
              invoices.map((inv) => {
                const status = getInvoiceStatus(inv.due_date, inv.status);
                return (
                  <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{inv.invoice_number}</p>
                        <p className="text-slate-500 text-xs">{inv.clients?.company_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black">{formatCurrency(inv.balance_due || inv.total)}</p>
                      <p className="text-slate-500 text-xs">
                        {status === 'paid' ? 'Paid' : `Due ${format(parseISO(inv.due_date), 'dd MMM')}`}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Money Out */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-red-500/5">
            <h3 className="text-red-500 font-black uppercase text-sm flex items-center gap-2">
              <ArrowDownRight size={16} /> Money Out (Upcoming)
            </h3>
          </div>
          <div className="divide-y divide-slate-800/30 max-h-[400px] overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No upcoming expenses</div>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{exp.supplier_name}</p>
                      <p className="text-slate-500 text-xs">{exp.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black">{formatCurrency(exp.amount_inclusive)}</p>
                    <p className="text-slate-500 text-xs">{format(parseISO(exp.expense_date), 'dd MMM')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 90-Day Projection Chart (Simplified) */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
        <h3 className="text-white font-black uppercase text-sm mb-6">90-Day Cash Flow Projection</h3>
        
        <div className="relative h-32 bg-[#0B0F19] rounded-lg overflow-hidden">
          {/* Baseline */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700" />
          
          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between px-2 gap-1">
            {projections[90].filter((_, i) => i % 3 === 0).slice(0, 30).map((day, i) => {
              const maxAbs = Math.max(openingBalance, Math.abs(projected90Day), 100000);
              const height = Math.min(Math.abs(day.balance) / maxAbs * 80, 80);
              const isNegative = day.balance < 0;
              
              return (
                <div 
                  key={i}
                  className={`flex-1 rounded-t ${isNegative ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ height: `${height}%` }}
                  title={`${format(day.date, 'dd MMM')}: ${formatCurrency(day.balance)}`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-between mt-4 text-xs text-slate-500">
          <span>Today</span>
          <span>30 Days</span>
          <span>60 Days</span>
          <span>90 Days</span>
        </div>

        {/* Timeline markers */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
          <div className="text-center">
            <p className="text-slate-500 text-[9px] font-black uppercase">Today</p>
            <p className={`font-black ${openingBalance >= 0 ? 'text-white' : 'text-red-500'}`}>{formatCurrency(openingBalance)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-[9px] font-black uppercase">30 Days</p>
            <p className={`font-black ${projected30Day >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(projected30Day)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-[9px] font-black uppercase">60 Days</p>
            <p className={`font-black ${projected60Day >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(projected60Day)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-[9px] font-black uppercase">90 Days</p>
            <p className={`font-black ${projected90Day >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(projected90Day)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
