'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Calendar, 
  Receipt, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  FileText,
  PieChart as PieChartIcon
} from 'lucide-react';
import Link from 'next/link';
import { format, isWithinInterval, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { CategorySpendChart, CategoryDistributionPie } from '@/components/office/ExpensesCharts';
import CSVImportModal from '@/components/office/CSVImportModal';
import { DeleteConfirmationModal, type DeletableItem } from '@/components/office/DeleteConfirmationModal';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';

export default function ExpensesClient({ initialExpenses, vatPeriods, stats }: any) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [dateRange, setDateRange] = useState('this-month');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expensesToDelete, setExpensesToDelete] = useState<DeletableItem[]>([]);
  
  const supabase = createClient();
  const toast = useOfficeToast();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const categories = ['All', 'Materials', 'Travel', 'Equipment', 'Software', 'Professional Fees', 'Other'];

  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter((ex: any) => {
      const matchesSearch = ex.supplier_name.toLowerCase().includes(q.toLowerCase()) || 
                           ex.description.toLowerCase().includes(q.toLowerCase());
      const matchesCategory = category === 'All' || ex.category === category;
      
      let matchesDate = true;
      const exDate = parseISO(ex.expense_date);
      const now = new Date();

      if (dateRange === 'this-month') {
        matchesDate = isWithinInterval(exDate, { start: startOfMonth(now), end: endOfMonth(now) });
      } else if (dateRange === 'last-month') {
        const lastMonth = subMonths(now, 1);
        matchesDate = isWithinInterval(exDate, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
      } else if (dateRange === 'this-quarter') {
        matchesDate = isWithinInterval(exDate, { start: startOfQuarter(now), end: endOfQuarter(now) });
      } else if (dateRange === 'this-vat') {
        const activeVat = vatPeriods.find((p: any) => p.status === 'Open');
        if (activeVat) {
          matchesDate = isWithinInterval(exDate, { start: parseISO(activeVat.period_start), end: parseISO(activeVat.period_end) });
        }
      }

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [initialExpenses, q, category, dateRange, vatPeriods]);

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const allSelected = filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length;

  const toggleAll = (next: boolean) => {
    if (!next) {
      setSelected({});
      return;
    }
    const map: Record<string, boolean> = {};
    filteredExpenses.forEach((ex: any) => {
      map[String(ex.id)] = true;
    });
    setSelected(map);
  };

  const toggleOne = (id: string, next: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: next }));
  };

  const openDeleteModal = () => {
    if (selectedIds.length === 0) {
      toast.info({ title: 'No Selection', message: 'Select at least one expense.' });
      return;
    }

    const expensesToCheck = filteredExpenses.filter((ex: any) => selectedIds.includes(String(ex.id)));
    const expensesWithLinks: DeletableItem[] = expensesToCheck.map((ex: any) => ({
      id: String(ex.id),
      name: `${ex.supplier_name} - ${formatCurrency(ex.amount_inclusive)}`,
      hasLinkedRecords: false
    }));

    setExpensesToDelete(expensesWithLinks);
    setDeleteModalOpen(true);
  };

  const handleDeleteExpenses = async () => {
    const idsToDelete = expensesToDelete.map(e => e.id);
    
    const { error } = await supabase.from('expenses').delete().in('id', idsToDelete);
    
    if (error) throw error;
    
    toast.success({
      title: 'Deleted',
      message: `${idsToDelete.length} expense(s) deleted successfully.`,
    });
    setSelected({});
    window.location.reload();
  };

  const categorySummary = useMemo(() => {
    const summary: any = {};
    filteredExpenses.forEach((ex: any) => {
      summary[ex.category] = (summary[ex.category] || 0) + Number(ex.amount_inclusive);
    });
    return Object.keys(summary).map(cat => ({ category: cat, total: summary[cat] }));
  }, [filteredExpenses]);

  return (
    <div className="space-y-10">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl hover:border-orange-500/20 transition-all shadow-xl">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Total Spent (Month)</p>
          <h3 className="text-2xl font-black text-white">{formatCurrency(stats.monthTotal)}</h3>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl hover:border-blue-500/20 transition-all shadow-xl">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Input VAT (Month)</p>
          <h3 className="text-2xl font-black text-blue-500">{formatCurrency(stats.monthVat)}</h3>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl border-orange-500/10 shadow-xl overflow-hidden relative">
           <div className="absolute -right-4 -top-4 opacity-[0.02]">
              <TrendingUp size={120} />
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">VAT Period Total</p>
           <h3 className="text-2xl font-black text-white">{formatCurrency(stats.vatPeriodTotal)}</h3>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl border-green-500/10 shadow-xl overflow-hidden relative">
           <div className="absolute -right-4 -top-4 opacity-[0.02]">
              <PieChartIcon size={120} />
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">VAT Period Claimable</p>
           <h3 className="text-2xl font-black text-green-500">{formatCurrency(stats.vatPeriodVat)}</h3>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#151B28] border border-slate-800/50 p-4 rounded-xl space-y-4 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input 
              type="text" 
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by supplier or description..."
              className="w-full bg-[#0B0F19] border border-slate-800/50 focus:border-orange-500/50 outline-none pl-12 pr-4 py-3 text-sm text-slate-200 font-medium rounded-lg transition-all"
            />
          </div>
          
          <div className="flex gap-4">
             <div className="flex bg-[#0B0F19] p-1 rounded-lg border border-slate-800/50">
                {['this-month', 'last-month', 'this-quarter', 'this-vat'].map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap ${
                      dateRange === range 
                        ? 'bg-slate-800 text-white shadow-lg' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {range.replace('-', ' ')}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsImportOpen(true)}
                className="bg-slate-800 text-slate-200 hover:text-white px-6 py-3 rounded-sm font-black text-[10px] uppercase tracking-widest border border-slate-700 transition-all flex items-center gap-2"
              >
                <Download size={14} /> Import CSV
              </button>
          </div>
        </div>

        <div className="flex bg-[#0B0F19] p-1 rounded-lg border border-slate-800/50 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap ${
                category === cat 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
        {selectedIds.length > 0 && (
          <div className="p-4 border-b border-slate-800/50 bg-[#0B0F19]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded">
                {selectedIds.length} selected
              </span>
            </div>
            <button
              type="button"
              onClick={openDeleteModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Trash2 size={14} />
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] bg-[#0B0F19]/50 border-b border-slate-800/50">
                <th className="px-4 py-5 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    aria-label="Select all expenses"
                    className="h-4 w-4 accent-orange-500"
                  />
                </th>
                <th className="px-6 py-5">Date / Supplier</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Input VAT</th>
                <th className="px-6 py-5">Amount (Incl)</th>
                <th className="px-6 py-5">Receipt</th>
                <th className="px-6 py-5 text-right font-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredExpenses.length === 0 ? (
                <tr>
                   <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 border border-slate-800/50">
                          <Receipt size={32} className="text-slate-700" />
                        </div>
                        <h3 className="text-white font-black uppercase tracking-tight mb-2">No Expenses Tracked</h3>
                        <p className="text-slate-500 text-xs font-medium mb-8 uppercase tracking-tighter">
                          Capture your first business expense to start tracking VAT and spend.
                        </p>
                        <Link 
                          href="/office/expenses/new"
                          className="text-orange-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all"
                        >
                          Add Your First Expense <Plus size={16} />
                        </Link>
                      </div>
                   </td>
                </tr>
              ) : filteredExpenses.map((ex: any) => (
                <tr key={ex.id} className="group hover:bg-[#0B0F19]/50 transition-colors">
                  <td className="px-4 py-6">
                    <input
                      type="checkbox"
                      checked={!!selected[String(ex.id)]}
                      onChange={(e) => toggleOne(String(ex.id), e.target.checked)}
                      aria-label={`Select expense ${ex.supplier_name}`}
                      className="h-4 w-4 accent-orange-500"
                    />
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{format(parseISO(ex.expense_date), 'dd MMM yyyy')}</p>
                    <p className="font-black text-white text-sm uppercase tracking-tight">{ex.supplier_name}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px] mt-0.5">{ex.description}</p>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded">
                      {ex.category}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                       <p className={`text-sm font-black ${ex.vat_claimable ? 'text-blue-500' : 'text-slate-600'}`}>
                        {formatCurrency(ex.input_vat_amount)}
                       </p>
                       <p className="text-[10px] font-bold uppercase text-slate-500">
                        {ex.vat_claimable ? 'Claimable' : 'Exempt'}
                       </p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <p className="font-black text-white text-sm">{formatCurrency(ex.amount_inclusive)}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Excl: {formatCurrency(ex.amount_exclusive)}</p>
                  </td>
                  <td className="px-6 py-6">
                    {ex.receipt_url ? (
                      <div className="flex items-center gap-2 text-orange-500">
                        <FileText size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Attached</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">None</span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/office/expenses/${ex.id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all"
                      >
                         <Eye size={16} />
                      </Link>
                      <Link 
                        href={`/office/expenses/${ex.id}/edit`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all"
                      >
                         <Edit2 size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Summary Charts */}
      {filteredExpenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-8 shadow-2xl overflow-hidden relative group">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp size={18} className="text-orange-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Expense Distribution</h3>
              </div>
              <CategorySpendChart data={categorySummary} />
           </div>

           <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-8 shadow-2xl overflow-hidden relative">
              <div className="flex items-center gap-3 mb-8">
                 <PieChartIcon size={18} className="text-blue-500" />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Category Breakdown</h3>
              </div>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                 <div className="flex-1">
                    <CategoryDistributionPie data={categorySummary} />
                 </div>
                 <div className="space-y-4 w-full lg:w-48">
                    {categorySummary.map((item: any) => (
                      <div key={item.category} className="flex flex-col gap-1">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">{item.category}</span>
                            <span className="text-[10px] font-black text-white">{formatCurrency(item.total)}</span>
                         </div>
                         <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.total / filteredExpenses.reduce((s: any, e: any) => s + Number(e.amount_inclusive), 0)) * 100}%` }}
                              className="h-full bg-orange-500" 
                            />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      <CSVImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteExpenses}
        items={expensesToDelete}
        itemType="expense"
      />
    </div>
  );
}
