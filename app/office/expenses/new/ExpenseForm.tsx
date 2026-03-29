'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Receipt, 
  Tag, 
  Type, 
  FileText, 
  ChevronLeft, 
  Save, 
  Loader2, 
  Upload, 
  X,
  FileIcon,
  CheckCircle2,
  Calculator,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { createExpense, updateExpense } from '@/lib/expenses/actions';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';

export default function ExpenseForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    expense_date: initialData?.expense_date || new Date().toISOString().split('T')[0],
    supplier_name: initialData?.supplier_name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Materials',
    notes: initialData?.notes || '',
    vat_claimable: initialData?.vat_claimable ?? true,
    amount_entered_as: 'Inclusive', // UI only
    amount_value: initialData?.amount_inclusive || '',
    receipt_url: initialData?.receipt_url || '',
  });
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Derived values for real-time preview
  const [calc, setCalc] = useState({
    inclusive: 0,
    exclusive: 0,
    vat: 0
  });

  useEffect(() => {
    const val = parseFloat(formData.amount_value) || 0;
    if (formData.amount_entered_as === 'Inclusive') {
      const vat = formData.vat_claimable ? (val * 15) / 115 : 0;
      setCalc({
        inclusive: val,
        exclusive: val - vat,
        vat: vat
      });
    } else {
      const vat = formData.vat_claimable ? val * 0.15 : 0;
      setCalc({
        inclusive: val + vat,
        exclusive: val,
        vat: vat
      });
    }
  }, [formData.amount_value, formData.amount_entered_as, formData.vat_claimable]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filePath, selectedFile);

      if (error) throw error;
      setFormData(prev => ({ ...prev, receipt_url: filePath }));
      setFile(selectedFile);
      toast.success({ title: 'Receipt Uploaded', message: 'File attached to this expense.' });
    } catch (err: any) {
      toast.error({ title: 'Upload Failed', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        amount_inclusive: calc.inclusive,
      };

      if (initialData?.id) {
        await updateExpense(initialData.id, {
            ...submissionData,
            old_date: initialData.expense_date
        }, Number(initialData.input_vat_amount), calc.vat);
      } else {
        await createExpense(submissionData, calc.vat);
      }

      toast.success({ title: initialData ? 'Expense Updated' : 'Expense Saved' });
      router.push('/office/expenses');
      router.refresh();
    } catch (err: any) {
      toast.error({ title: 'Save Failed', message: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="w-full pb-20">
      {categoryOpen && (
        <div className="fixed inset-0 z-[99]" onClick={() => setCategoryOpen(false)} />
      )}
      <div className="flex items-center gap-4 mb-10">
        <Link 
          href="/office/expenses"
          className="w-10 h-10 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
           <h1 className="text-2xl font-black text-white uppercase tracking-tight">
             {initialData ? 'Edit Expense' : 'Capture New Expense'}
           </h1>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
             Fields marked with * are required
           </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* General Details */}
          <section className="bg-[#151B28] border border-slate-800/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                <FileText size={80} />
             </div>
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-slate-800/50 pb-4">Basic Information</h2>
             
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <DatePicker 
                     label="Expense Date"
                     value={formData.expense_date}
                     onChange={(val) => setFormData(prev => ({ ...prev, expense_date: val }))}
                   />
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Category *</label>
                       <div className="relative">
                         <button
                           type="button"
                           onClick={() => setCategoryOpen(!categoryOpen)}
                           className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
                             categoryOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                           }`}
                         >
                           <div className="flex items-center gap-3">
                             <Tag className="text-slate-500" size={16} />
                             <span className="text-white">{formData.category}</span>
                           </div>
                           <ChevronDown size={14} className={`text-slate-500 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
                         </button>
                         {categoryOpen && (
<div className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] p-1">
                              {['Materials', 'Travel', 'Equipment', 'Software', 'Professional Fees', 'Other'].map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, category: cat }));
                                    setCategoryOpen(false);
                                  }}
                                  className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-medium text-sm ${
                                    formData.category === cat ? 'text-orange-500' : 'text-slate-300'
                                  }`}
                               >
                                 {cat}
                               </button>
                             ))}
                           </div>
                         )}
                       </div>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Supplier / Payee *</label>
                  <div className="relative group">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={16} />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Makro, Takealot, WebAfrica..."
                      value={formData.supplier_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                      className="w-full bg-[#0B0F19] border border-slate-800/50 focus:border-orange-500/50 outline-none pl-12 pr-4 py-3 text-sm text-white font-medium rounded-lg transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Short description of the spend..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-[#0B0F19] border border-slate-800/50 focus:border-orange-500/50 outline-none px-4 py-3 text-sm text-white font-medium rounded-lg transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Internal Notes</label>
                  <textarea 
                    rows={4}
                    placeholder="Any extra details or project references..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-[#0B0F19] border border-slate-800/50 focus:border-orange-500/50 outline-none px-4 py-3 text-sm text-white font-medium rounded-lg transition-all resize-none"
                  />
                </div>
             </div>
          </section>

          {/* Receipt Section */}
          <section className="bg-[#151B28] border border-slate-800/50 rounded-2xl p-8 shadow-2xl overflow-hidden relative">
             <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                <Receipt size={80} />
             </div>
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-slate-800/50 pb-4">Receipt / Proof of Payment</h2>
             
             {!formData.receipt_url ? (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="group border-2 border-dashed border-slate-800 rounded-2xl py-12 flex flex-col items-center justify-center hover:border-orange-500/30 hover:bg-orange-500/5 transition-all cursor-pointer"
               >
                 <div className="w-12 h-12 bg-slate-800 group-hover:bg-orange-500/10 rounded-full flex items-center justify-center text-slate-500 group-hover:text-orange-500 transition-all mb-4">
                    {uploading ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
                 </div>
                 <p className="text-white font-black uppercase tracking-widest text-xs">Upload Receipt</p>
                 <p className="text-slate-500 text-[10px] font-bold uppercase mt-2">Support JPG, PNG, PDF (Max 5MB)</p>
                 <input type="file" onChange={handleUpload} ref={fileInputRef} className="hidden" />
               </div>
             ) : (
               <div className="flex items-center justify-between bg-[#0B0F19] p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded flex items-center justify-center text-orange-500">
                       <FileIcon size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-500 font-extrabold uppercase">File Uploaded</p>
                       <p className="text-white text-xs font-black truncate max-w-[200px]">
                        {formData.receipt_url.split('/').pop()}
                       </p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, receipt_url: '' }))}
                    className="text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
               </div>
             )}
          </section>
        </div>

        {/* Amount & Calculation Sidebar */}
        <div className="space-y-8">
           <section className="bg-[#151B28] border border-orange-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm sticky top-10">
              <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                <Calculator size={80} className="text-orange-500" />
              </div>
              
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500 mb-8 border-b border-orange-500/10 pb-4">Financials</h2>

              <div className="space-y-6">
                 {/* VAT Toggle */}
                 <div className="flex items-center justify-between p-4 bg-[#0B0F19] rounded-xl border border-slate-800/50">
                    <div>
                       <p className="text-[10px] font-black uppercase text-white">VAT Claimable</p>
                       <p className="text-[10px] font-bold uppercase text-slate-500">Enable 15% Input VAT</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, vat_claimable: !prev.vat_claimable }))}
                      className={`w-12 h-6 rounded-full p-1 transition-all ${formData.vat_claimable ? 'bg-orange-500' : 'bg-slate-800'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.vat_claimable ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>

                 {/* Entry Mode Toggle */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Enter Amount As</label>
                    <div className="flex bg-[#0B0F19] p-1 rounded-lg border border-slate-800/50">
                      {['Inclusive', 'Exclusive'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, amount_entered_as: mode }))}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                            formData.amount_entered_as === mode 
                              ? 'bg-slate-800 text-white shadow-md' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Amount Input */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                      {formData.amount_entered_as === 'Inclusive' ? 'Total (Inc VAT) *' : 'Amount (Excl VAT) *'}
                    </label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">R</span>
                       <input 
                         type="number"
                         step="0.01"
                         required
                         placeholder="0.00"
                         value={formData.amount_value}
                         onChange={(e) => setFormData(prev => ({ ...prev, amount_value: e.target.value }))}
                         className="w-full bg-[#0B0F19] border border-slate-800/50 focus:border-orange-500/50 outline-none pl-10 pr-4 py-4 text-xl font-black text-white rounded-xl transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                       />
                    </div>
                 </div>

                 {/* Breakdown Visualizer */}
                 <div className="bg-[#0B0F19] rounded-xl border border-slate-800/50 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black uppercase text-slate-500">Net Exclusive</p>
                       <p className="text-sm font-bold text-slate-300">R {calc.exclusive.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black uppercase text-blue-500">Input VAT (15%)</p>
                       <p className={`text-sm font-black ${formData.vat_claimable ? 'text-blue-500' : 'text-slate-600 line-through'}`}>
                         R {calc.vat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                       </p>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                       <p className="text-xs font-black uppercase text-white">Grand Total</p>
                       <p className="text-lg font-black text-orange-500">R {calc.inclusive.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>

                 <button
                   type="submit"
                   disabled={loading || uploading}
                   className="w-full bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20 text-white font-black uppercase text-xs tracking-[0.2em] py-5 rounded-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                 >
                   {loading ? <Loader2 className="animate-spin" size={18} /> : (initialData ? <Save size={18} /> : <CheckCircle2 size={18} />)}
                   {initialData ? 'Update Expense' : 'Confirm Expense'}
                 </button>
              </div>
           </section>
        </div>
      </form>
    </div>
  );
}
