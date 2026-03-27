import { createClient } from '@/lib/supabase/server';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import ExpensesClient from './ExpensesClient';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const supabase = await createClient();
  const now = new Date();
  const firstDay = format(startOfMonth(now), 'yyyy-MM-dd');
  const lastDay = format(endOfMonth(now), 'yyyy-MM-dd');

  // Fetch all data
  const [expensesRes, vatPeriodsRes] = await Promise.all([
    supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
    supabase.from('vat_periods').select('*').order('period_start', { ascending: false })
  ]);

  const expenses = expensesRes.data || [];
  const vatPeriods = vatPeriodsRes.data || [];

  // Calculate Stats
  const currentMonthExpenses = expenses.filter(ex => 
    ex.expense_date >= firstDay && ex.expense_date <= lastDay
  );

  const activeVatPeriod = vatPeriods.find(p => p.status === 'Open');
  const vatPeriodExpenses = activeVatPeriod ? expenses.filter(ex => 
    ex.expense_date >= activeVatPeriod.period_start && ex.expense_date <= activeVatPeriod.period_end
  ) : [];

  const stats = {
    monthTotal: currentMonthExpenses.reduce((sum, ex) => sum + Number(ex.amount_inclusive || 0), 0),
    monthVat: currentMonthExpenses.reduce((sum, ex) => sum + Number(ex.vat_claimable ? ex.input_vat_amount : 0), 0),
    vatPeriodTotal: vatPeriodExpenses.reduce((sum, ex) => sum + Number(ex.amount_inclusive || 0), 0),
    vatPeriodVat: vatPeriodExpenses.reduce((sum, ex) => sum + Number(ex.vat_claimable ? ex.input_vat_amount : 0), 0),
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Expense Tracker</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
             Manage business spend and claimable VAT inputs
          </p>
        </div>
        <Link 
          href="/office/expenses/new"
          className="bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-xs tracking-[0.2em] px-8 py-4 rounded-sm transition-all flex items-center gap-3 shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus size={18} /> Add New Expense
        </Link>
      </div>

      <ExpensesClient 
        initialExpenses={expenses} 
        vatPeriods={vatPeriods} 
        stats={stats} 
      />
    </div>
  );
}
