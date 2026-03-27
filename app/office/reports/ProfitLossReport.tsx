'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ArrowLeft, 
  Download, 
  Calendar,
  ChevronDown,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { pdf } from '@react-pdf/renderer';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';

type PeriodOption = 'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'custom';

const EXPENSE_CATEGORIES = {
  'Fuel & Travel': ['Travel', 'Fuel'],
  'Equipment & Materials': ['Materials', 'Equipment'],
  'Subcontractors': ['Professional Fees'],
  'Office & Admin': ['Software', 'Office'],
  'Other Expenses': ['Other']
};

export default function ProfitLossReport() {
  const supabase = createClient();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodOption>('this-month');
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'this-quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        return { start: new Date(now.getFullYear(), quarterMonth, 1), end: endOfMonth(subMonths(new Date(now.getFullYear(), quarterMonth + 3, 0), 1)) };
      case 'this-year':
        return { start: new Date(now.getFullYear(), 2, 1), end: endOfMonth(subMonths(new Date(now.getFullYear() + 1, 2, 1), 1)) };
      case 'custom':
        return { start: new Date(customStart), end: new Date(customEnd) };
    }
  }, [period, customStart, customEnd]);

  const previousRange = useMemo(() => {
    const diff = dateRange.end.getTime() - dateRange.start.getTime() + 86400000;
    return { start: subDays(dateRange.start, 1), end: subDays(dateRange.end, diff) };
  }, [dateRange]);

  const [data, setData] = useState<any>(null);
  const [previousData, setPreviousData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const startStr = format(dateRange.start, 'yyyy-MM-dd');
      const endStr = format(dateRange.end, 'yyyy-MM-dd');
      const prevStartStr = format(previousRange.start, 'yyyy-MM-dd');
      const prevEndStr = format(previousRange.end, 'yyyy-MM-dd');

      // Get invoices (Revenue)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total, subtotal, vat_amount, status, issue_date')
        .gte('issue_date', startStr)
        .lte('issue_date', endStr)
        .not('status', 'eq', 'Draft');

      const { data: prevInvoices } = await supabase
        .from('invoices')
        .select('total, subtotal, vat_amount, status, issue_date')
        .gte('issue_date', prevStartStr)
        .lte('issue_date', prevEndStr)
        .not('status', 'eq', 'Draft');

      // Get credit notes
      const { data: creditNotes } = await supabase
        .from('credit_notes')
        .select('total, subtotal, vat_amount, status, issue_date')
        .gte('issue_date', startStr)
        .lte('issue_date', endStr);

      const { data: prevCreditNotes } = await supabase
        .from('credit_notes')
        .select('total, subtotal, vat_amount, status, issue_date')
        .gte('issue_date', prevStartStr)
        .lte('issue_date', prevEndStr);

      // Get expenses by category
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount_inclusive, amount_exclusive, input_vat_amount, category, expense_date')
        .gte('expense_date', startStr)
        .lte('expense_date', endStr);

      const { data: prevExpenses } = await supabase
        .from('expenses')
        .select('amount_inclusive, amount_exclusive, input_vat_amount, category, expense_date')
        .gte('expense_date', prevStartStr)
        .lte('expense_date', prevEndStr);

      // Calculate totals
      const totalInvoiced = invoices?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;
      const prevTotalInvoiced = prevInvoices?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;

      const totalCreditNotes = creditNotes?.reduce((sum, c) => sum + (c.total || 0), 0) || 0;
      const prevTotalCreditNotes = prevCreditNotes?.reduce((sum, c) => sum + (c.total || 0), 0) || 0;

      const netRevenue = totalInvoiced - totalCreditNotes;
      const prevNetRevenue = prevTotalInvoiced - prevTotalCreditNotes;

      // Calculate expenses by category group
      const expenseBreakdown: Record<string, number> = {};
      const prevExpenseBreakdown: Record<string, number> = {};

      Object.keys(EXPENSE_CATEGORIES).forEach(group => {
        expenseBreakdown[group] = 0;
        prevExpenseBreakdown[group] = 0;
      });

      expenses?.forEach((ex: any) => {
        for (const [group, cats] of Object.entries(EXPENSE_CATEGORIES)) {
          if (cats.includes(ex.category)) {
            expenseBreakdown[group] += ex.amount_inclusive || 0;
            break;
          }
        }
      });

      prevExpenses?.forEach((ex: any) => {
        for (const [group, cats] of Object.entries(EXPENSE_CATEGORIES)) {
          if (cats.includes(ex.category)) {
            prevExpenseBreakdown[group] += ex.amount_inclusive || 0;
            break;
          }
        }
      });

      const totalExpenses = Object.values(expenseBreakdown).reduce((a, b) => a + b, 0);
      const prevTotalExpenses = Object.values(prevExpenseBreakdown).reduce((a, b) => a + b, 0);

      // Calculate VAT (Output VAT from invoices - Input VAT from expenses + VAT from credit notes)
      const outputVat = invoices?.reduce((sum, i) => sum + (i.vat_amount || 0), 0) || 0;
      const prevOutputVat = prevInvoices?.reduce((sum, i) => sum + (i.vat_amount || 0), 0) || 0;

      const inputVat = expenses?.reduce((sum, i) => sum + (i.input_vat_amount || 0), 0) || 0;
      const prevInputVat = prevExpenses?.reduce((sum, i) => sum + (i.input_vat_amount || 0), 0) || 0;

      const creditNoteVat = creditNotes?.reduce((sum, c) => sum + (c.vat_amount || 0), 0) || 0;
      const prevCreditNoteVat = prevCreditNotes?.reduce((sum, c) => sum + (c.vat_amount || 0), 0) || 0;

      const vatPayable = outputVat - inputVat - creditNoteVat;
      const prevVatPayable = prevOutputVat - prevInputVat - prevCreditNoteVat;

      const netProfitBeforeTax = netRevenue - totalExpenses;
      const prevNetProfitBeforeTax = prevNetRevenue - prevTotalExpenses;

      const netProfitAfterVat = netProfitBeforeTax - vatPayable;
      const prevNetProfitAfterVat = prevNetProfitBeforeTax - prevVatPayable;

      setData({
        totalInvoiced,
        totalCreditNotes,
        netRevenue,
        expenseBreakdown,
        totalExpenses,
        outputVat,
        inputVat,
        creditNoteVat,
        vatPayable,
        netProfitBeforeTax,
        netProfitAfterVat
      });

      setPreviousData({
        totalInvoiced: prevTotalInvoiced,
        totalCreditNotes: prevTotalCreditNotes,
        netRevenue: prevNetRevenue,
        expenseBreakdown: prevExpenseBreakdown,
        totalExpenses: prevTotalExpenses,
        outputVat: prevOutputVat,
        inputVat: prevInputVat,
        creditNoteVat: prevCreditNoteVat,
        vatPayable: prevVatPayable,
        netProfitBeforeTax: prevNetProfitBeforeTax,
        netProfitAfterVat: prevNetProfitAfterVat
      });

    } catch (err: any) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount).replace('ZAR', 'R');

  const formatChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, pct: 0, direction: 'none' };
    const change = current - previous;
    const pct = (change / Math.abs(previous)) * 100;
    return { value: change, pct, direction: change > 0 ? 'up' : change < 0 ? 'down' : 'none' };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 text-slate-500 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white uppercase">Profit & Loss Statement</h2>
            <p className="text-slate-500 text-sm">Income statement showing revenue, expenses, and net profit</p>
          </div>
        </div>
        <button 
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase rounded-lg"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
          Generate Report
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            <span className="text-slate-500 text-xs font-black uppercase">Period:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'this-month', label: 'This Month' },
              { id: 'last-month', label: 'Last Month' },
              { id: 'this-quarter', label: 'This Quarter' },
              { id: 'this-year', label: 'Tax Year (Mar-Feb)' },
              { id: 'custom', label: 'Custom' }
            ] as { id: PeriodOption; label: string }[]).map(opt => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                  period === opt.id 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <DatePicker 
                value={customStart}
                onChange={setCustomStart}
              />
              <span className="text-slate-500">to</span>
              <DatePicker 
                value={customEnd}
                onChange={setCustomEnd}
              />
            </div>
          )}
        </div>
        {dateRange && (
          <p className="text-slate-500 text-xs mt-4">
            Showing: {format(dateRange.start, 'dd MMM yyyy')} - {format(dateRange.end, 'dd MMM yyyy')}
          </p>
        )}
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Net Revenue</p>
              <p className="text-2xl font-black text-white">{formatCurrency(data.netRevenue)}</p>
              {previousData && (() => {
                const change = formatChange(data.netRevenue, previousData.netRevenue);
                return (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${
                    change.direction === 'up' ? 'text-green-500' : change.direction === 'down' ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {change.direction === 'up' ? <TrendingUp size={14} /> : change.direction === 'down' ? <TrendingDown size={14} /> : null}
                    {change.direction !== 'none' && `${change.pct.toFixed(1)}% vs prev`}
                  </div>
                );
              })()}
            </div>
            <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Net Profit (Before Tax)</p>
              <p className={`text-2xl font-black ${data.netProfitBeforeTax >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(data.netProfitBeforeTax)}
              </p>
              {previousData && (() => {
                const change = formatChange(data.netProfitBeforeTax, previousData.netProfitBeforeTax);
                return (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${
                    change.direction === 'up' ? 'text-green-500' : change.direction === 'down' ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {change.direction === 'up' ? <TrendingUp size={14} /> : change.direction === 'down' ? <TrendingDown size={14} /> : null}
                    {change.direction !== 'none' && `${change.pct.toFixed(1)}% vs prev`}
                  </div>
                );
              })()}
            </div>
            <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Net Profit (After VAT)</p>
              <p className={`text-2xl font-black ${data.netProfitAfterVat >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {formatCurrency(data.netProfitAfterVat)}
              </p>
              {previousData && (() => {
                const change = formatChange(data.netProfitAfterVat, previousData.netProfitAfterVat);
                return (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${
                    change.direction === 'up' ? 'text-green-500' : change.direction === 'down' ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {change.direction === 'up' ? <TrendingUp size={14} /> : change.direction === 'down' ? <TrendingDown size={14} /> : null}
                    {change.direction !== 'none' && `${change.pct.toFixed(1)}% vs prev`}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* P&L Statement Table */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-white font-black uppercase">Profit & Loss Statement</h3>
              <p className="text-slate-500 text-xs">{format(dateRange.start, 'dd MMM yyyy')} - {format(dateRange.end, 'dd MMM yyyy')}</p>
            </div>
            
            <div className="p-6">
              {/* INCOME */}
              <div className="mb-8">
                <h4 className="text-green-500 text-xs font-black uppercase mb-4">INCOME</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Invoiced Revenue</span>
                    <span className="text-white font-bold">{formatCurrency(data.totalInvoiced)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Less: Credit Notes Issued</span>
                    <span className="text-red-400 font-bold">-{formatCurrency(data.totalCreditNotes)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-800 pt-2 mt-2">
                    <span className="text-white font-black uppercase">Net Revenue</span>
                    <span className="text-white font-black">{formatCurrency(data.netRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* EXPENSES */}
              <div className="mb-8">
                <h4 className="text-red-500 text-xs font-black uppercase mb-4">EXPENSES</h4>
                <div className="space-y-2">
                  {Object.entries(data.expenseBreakdown).map(([category, amount]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="text-slate-300">{category}</span>
                      <span className="text-white font-bold">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-slate-800 pt-2 mt-2">
                    <span className="text-white font-black uppercase">Total Expenses</span>
                    <span className="text-red-400 font-black">-{formatCurrency(data.totalExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* NET PROFIT */}
              <div className="border-t-2 border-slate-800 pt-4">
                <div className="flex justify-between text-lg mb-4">
                  <span className="text-white font-black uppercase">Net Profit (Before Tax)</span>
                  <span className={`font-black ${data.netProfitBeforeTax >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(data.netProfitBeforeTax)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-slate-300">VAT Payable (Output - Input - CN VAT)</span>
                  <span className="text-red-400 font-bold">-{formatCurrency(data.vatPayable)}</span>
                </div>
                <div className="flex justify-between text-xl border-t border-slate-800 pt-4">
                  <span className="text-white font-black uppercase">Net Profit (After VAT)</span>
                  <span className={`font-black ${data.netProfitAfterVat >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                    {formatCurrency(data.netProfitAfterVat)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VAT Breakdown */}
          <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl">
            <h4 className="text-slate-500 text-xs font-black uppercase mb-4">VAT Breakdown</h4>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-slate-400 text-xs">Output VAT (Invoices)</p>
                <p className="text-white font-black text-lg">{formatCurrency(data.outputVat)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Input VAT (Expenses)</p>
                <p className="text-white font-black text-lg">{formatCurrency(data.inputVat)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">VAT from Credit Notes</p>
                <p className="text-white font-black text-lg">-{formatCurrency(data.creditNoteVat)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between">
              <span className="text-white font-black uppercase">Net VAT Payable</span>
              <span className={`font-black ${data.vatPayable >= 0 ? 'text-amber-500' : 'text-green-500'}`}>
                {formatCurrency(data.vatPayable)}
              </span>
            </div>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="text-center py-20">
          <DollarSign size={48} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-500">Select a period and click Generate Report to view P&L</p>
        </div>
      )}
    </div>
  );
}
