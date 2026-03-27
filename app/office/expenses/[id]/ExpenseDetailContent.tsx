'use client';

import { useState } from 'react';
import { 
  ChevronLeft, 
  Edit2, 
  Trash2, 
  Calendar, 
  Tag, 
  FileText, 
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  CreditCard,
  Eye,
  Receipt,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { deleteExpense } from '@/lib/expenses/actions';
import { useOfficeToast } from '@/components/office/OfficeToastContext';

export default function ExpenseDetailContent({ expense, signedUrl }: { expense: any, signedUrl: string | null }) {
  const router = useRouter();
  const toast = useOfficeToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id, expense.expense_date, Number(expense.input_vat_amount));
      toast.success({ title: 'Expense Deleted' });
      router.push('/office/expenses');
      router.refresh();
    } catch (err: any) {
      toast.error({ title: 'Delete Failed', message: err.message });
      setIsDeleting(false);
    }
  };

  const isPdf = expense.receipt_url?.toLowerCase().endsWith('.pdf');

  return (
    <div className="w-full pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <Link 
            href="/office/expenses"
            className="w-10 h-10 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
             <h1 className="text-3xl font-black text-white uppercase tracking-tight">Expense Details</h1>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
               Record ID: {expense.id.slice(0, 8)}...
             </p>
          </div>
        </div>

        <div className="flex gap-4">
           <Link 
             href={`/office/expenses/${expense.id}/edit`}
             className="bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-sm transition-all flex items-center gap-2"
           >
             <Edit2 size={14} /> Edit Expense
           </Link>
           <button 
             onClick={() => setShowDeleteConfirm(true)}
             className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-sm transition-all flex items-center gap-2 border border-red-500/20"
           >
             <Trash2 size={14} /> Delete
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <section className="bg-[#151B28] border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="p-8 border-b border-slate-800/50">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{expense.category}</p>
                          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">{expense.supplier_name}</h2>
                          <p className="text-slate-400 font-medium text-lg leading-snug">{expense.description}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Paid</p>
                          <h3 className="text-3xl font-black text-white">{formatCurrency(expense.amount_inclusive)}</h3>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-800/30">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-500">Expense Date</p>
                          <div className="flex items-center gap-2 text-white">
                             <Calendar size={14} className="text-slate-600" />
                             <span className="text-xs font-black">{format(parseISO(expense.expense_date), 'dd MMM yyyy')}</span>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-500">VAT Status</p>
                          <div className="flex items-center gap-2">
                             {expense.vat_claimable ? (
                               <CheckCircle2 size={14} className="text-green-500" />
                             ) : (
                               <AlertCircle size={14} className="text-slate-600" />
                             )}
                             <span className={`text-xs font-black uppercase ${expense.vat_claimable ? 'text-green-500' : 'text-slate-500'}`}>
                                {expense.vat_claimable ? 'Claimable' : 'No VAT'}
                             </span>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-500">Input VAT</p>
                          <p className="text-xs font-black text-blue-500">{formatCurrency(expense.input_vat_amount)}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-500">Net Amount</p>
                          <p className="text-xs font-black text-slate-300">{formatCurrency(expense.amount_exclusive)}</p>
                       </div>
                    </div>
                </div>
                
                <div className="p-8 bg-[#0B0F19]/30">
                   <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                      <FileText size={12} /> Internal Notes
                   </h4>
                   <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {expense.notes || 'No notes provided for this expense.'}
                   </p>
                </div>
            </section>

            {/* Receipt Preview */}
            <section className="bg-[#151B28] border border-slate-800/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8 border-b border-slate-800/50 pb-4">Receipt View</h3>
               
               {signedUrl ? (
                 <div className="space-y-6">
                    {isPdf ? (
                      <div className="border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-900 transition-all group">
                         <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                            <FileText size={32} />
                         </div>
                         <p className="text-white font-black text-sm mb-6">PDF Document Attached</p>
                         <a 
                           href={signedUrl} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="bg-slate-800 hover:bg-white hover:text-black px-8 py-3 rounded-sm font-black text-[10px] uppercase tracking-widest text-white transition-all flex items-center gap-2"
                         >
                            <Download size={14} /> Download Receipt
                         </a>
                      </div>
                    ) : (
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-inner group relative">
                         <img src={signedUrl} alt="Receipt" className="w-full h-auto max-h-[600px] object-contain" />
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a 
                              href={signedUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-white text-black px-8 py-3 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                               <Eye size={14} /> View Full Image
                            </a>
                         </div>
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="border-2 border-dashed border-slate-800 rounded-xl py-20 flex flex-col items-center justify-center text-slate-700">
                    <Receipt size={48} className="mb-4 opacity-50" />
                    <p className="text-sm font-black uppercase tracking-widest">No receipt attached</p>
                 </div>
               )}
            </section>
         </div>

         {/* Financial Sidebar Context */}
         <div className="space-y-8">
            <section className="bg-[#151B28] border border-slate-800/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                  <CreditCard size={80} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-slate-800/50 pb-4">VAT Impact</h3>
                
                <div className="space-y-6">
                   <div className="flex items-center gap-4 bg-[#0B0F19] p-4 rounded-xl border border-slate-800/50">
                      <div className="w-12 h-12 bg-blue-500/10 rounded flex items-center justify-center text-blue-500">
                         < TrendingUp size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Input VAT Claimed</p>
                         <p className="text-xl font-black text-blue-500">{formatCurrency(expense.input_vat_amount)}</p>
                      </div>
                   </div>

                   <div className="p-4 rounded-xl border border-slate-800/50 bg-[#0B0F19]/50 space-y-3">
                      <p className="text-[9px] font-black uppercase text-slate-300">Accounting Details</p>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                         <span>Created</span>
                         <span className="text-slate-400">{format(new Date(expense.created_at), 'dd MMM yyyy, HH:mm')}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                         <span>Last Updated</span>
                         <span className="text-slate-400">{format(new Date(expense.updated_at), 'dd MMM yyyy, HH:mm')}</span>
                      </div>
                   </div>
                </div>
            </section>
         </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-[#151B28] border border-slate-800 max-w-sm w-full rounded-2xl p-8 relative z-10 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-white font-black uppercase tracking-tight text-lg mb-2">Delete Expense?</h3>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-tighter mb-8 leading-relaxed">
                This will permanently remove the expense and reverse the R {expense.input_vat_amount} from your VAT period. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs tracking-[0.2em] py-4 rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : 'Yes, Delete Record'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="text-slate-400 font-black uppercase text-xs tracking-[0.2em] py-4 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
