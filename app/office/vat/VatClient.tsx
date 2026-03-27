'use client';

import { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Eye,
  RefreshCw,
  Loader2,
  X,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import VATReportPDF from '@/components/office/VATReportPDF';
import { recalculateVatPeriod, submitVatPeriod, payVatPeriod } from '@/lib/vat/actions';
import { useRouter } from 'next/navigation';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';

export default function VatClient({ periods, currentInvoices, currentExpenses, businessProfile }: any) {
  const router = useRouter();
  const toast = useOfficeToast();
  const [recalculating, setRecalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingPeriod, setSubmittingPeriod] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payingPeriod, setPayingPeriod] = useState<any>(null);

  const currentPeriod = periods.find((p: any) => p.status === 'Open') || periods[0];
  const historyPeriods = periods.filter((p: any) => p.id !== currentPeriod?.id);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const daysToDue = currentPeriod ? differenceInDays(parseISO(currentPeriod.due_date), new Date()) : 0;
  const dueColor = daysToDue > 14 ? 'text-green-500' : daysToDue > 7 ? 'text-amber-500' : 'text-red-500';

  const handleRecalculate = async () => {
    if (!currentPeriod) return;
    setRecalculating(true);
    try {
      await recalculateVatPeriod(currentPeriod.id);
      toast.success({ title: 'VAT Recalculated', message: 'Period figures refreshed successfully.' });
      router.refresh();
    } catch (err: any) {
      toast.error({ title: 'Recalculation Failed', message: err.message });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Current Period Focus */}
      {currentPeriod && (
        <section className="bg-[#151B28] border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl relative group">
           <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Calculator size={200} className="text-orange-500" />
           </div>

           <div className="p-10 border-b border-slate-800/50 flex flex-col lg:flex-row justify-between gap-10">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-[0.25em] rounded-sm border border-orange-500/20">Active Period</span>
                   <Clock size={16} className={dueColor} />
                   <span className={`text-[10px] font-black uppercase tracking-widest ${dueColor}`}>
                     {daysToDue < 0 ? 'Overdue!' : `${daysToDue} Days until submission`}
                   </span>
                 </div>
                 <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                   {format(parseISO(currentPeriod.period_start), 'dd MMM yyyy')} — {format(parseISO(currentPeriod.period_end), 'dd MMM yyyy')}
                 </h2>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                   Submission due by {format(parseISO(currentPeriod.due_date), 'dd MMMM yyyy')}
                 </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                  onClick={handleRecalculate}
                  disabled={recalculating}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all border border-slate-700/50"
                 >
                    {recalculating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} 
                    Recalculate
                 </button>
                 
                 <PDFDownloadLink 
                   document={<VATReportPDF period={currentPeriod} invoices={currentInvoices} expenses={currentExpenses} businessProfile={businessProfile} />}
                   fileName={`TouchTeq-VAT-${format(parseISO(currentPeriod.period_start), 'MMM-yyyy')}.pdf`}
                   className="bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all border border-slate-700/50"
                 >
                    {({ loading }: any) => (
                      <span className="flex items-center gap-3">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                        Generate Report
                      </span>
                    )}
                 </PDFDownloadLink>

                 <button 
                  onClick={() => setSubmittingPeriod(currentPeriod)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
                 >
                    <CheckCircle2 size={16} /> Mark as Submitted
                 </button>
              </div>
           </div>

           <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-12 bg-[#0B0F19]/30">
              <div className="space-y-2">
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <TrendingUp size={14} className="text-red-500" /> Output VAT (Payable)
                 </p>
                 <h3 className="text-4xl font-black text-white">{formatCurrency(currentPeriod.output_vat)}</h3>
                 <div className="flex gap-4 pt-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                       {currentInvoices.length} Invoices
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <TrendingDown size={14} className="text-green-500" /> Input VAT (Claimable)
                 </p>
                 <h3 className="text-4xl font-black text-white">{formatCurrency(currentPeriod.input_vat)}</h3>
                 <div className="flex gap-4 pt-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                       {currentExpenses.length} Expenses
                    </div>
                 </div>
              </div>

              <div className="space-y-2 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                 <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calculator size={14} /> Net VAT Payable
                 </p>
                 <h3 className="text-5xl font-black text-orange-500">
                    {formatCurrency(currentPeriod.net_vat_payable)}
                 </h3>
                 <p className="text-[9px] font-bold text-slate-500 uppercase mt-2 tracking-tighter">
                    Estimated balance due to SARS
                 </p>
              </div>
           </div>
        </section>
      )}

      {/* History Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">VAT Period History</h2>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] bg-[#0B0F19]/50">
                <th className="px-6 py-5">Period Range</th>
                <th className="px-6 py-5">Output VAT</th>
                <th className="px-6 py-5">Input VAT</th>
                <th className="px-6 py-5">Net Payable</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {historyPeriods.map((period: any) => (
                <tr key={period.id} className="group hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-6">
                    <p className="font-black text-white text-sm uppercase tracking-tight">
                       {format(parseISO(period.period_start), 'dd MMM')} — {format(parseISO(period.period_end), 'dd MMM yyyy')}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Due: {format(parseISO(period.due_date), 'dd MMM yyyy')}</p>
                  </td>
                  <td className="px-6 py-6 text-slate-300 text-sm font-medium">{formatCurrency(period.output_vat)}</td>
                  <td className="px-6 py-6 text-slate-300 text-sm font-medium">{formatCurrency(period.input_vat)}</td>
                  <td className="px-6 py-6 font-black text-white text-sm">{formatCurrency(period.net_vat_payable)}</td>
                  <td className="px-6 py-6 font-black text-white text-sm">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded inline-block ${
                      period.status === 'Open' ? 'bg-orange-500/10 text-orange-500' :
                      period.status === 'Submitted' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {period.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Link 
                         href={`/office/vat/${period.id}`}
                         className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-all"
                       >
                          <Eye size={16} />
                       </Link>
                       {period.status === 'Submitted' && (
                         <button 
                           onClick={() => setPayingPeriod(period)}
                           className="text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/10 px-3 py-1.5 rounded transition-all border border-green-500/20"
                         >
                            Mark Paid
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Submission Modal */}
      <AnimatePresence>
        {submittingPeriod && (
          <SubmissionModal 
            period={submittingPeriod} 
            onClose={() => setSubmittingPeriod(null)} 
          />
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {payingPeriod && (
          <PaymentModal 
            period={payingPeriod} 
            onClose={() => setPayingPeriod(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmissionModal({ period, onClose }: { period: any, onClose: () => void }) {
  const router = useRouter();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState(false);
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [ref, setRef] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitVatPeriod(period.id, submissionDate, ref, notes);
      onClose();
      toast.success({ title: 'VAT Submitted', message: 'Submission recorded successfully.' });
      router.refresh();
    } catch (err: any) {
      toast.error({ title: 'Submission Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#151B28] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden relative z-10 p-8 shadow-2xl">
         <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Mark as Submitted</h3>
         <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8 border-b border-slate-800/50 pb-4">
            Period: {format(parseISO(period.period_start), 'MMM yyyy')} — {format(parseISO(period.period_end), 'MMM yyyy')}
         </p>

         <div className="space-y-6">
            <div className="bg-[#0B0F19] p-4 rounded-xl border border-slate-800 text-center">
               <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Total Net VAT Payable</p>
               <h4 className="text-3xl font-black text-orange-500">R {Number(period.net_vat_payable).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</h4>
            </div>

            <DatePicker 
              label="Submission Date"
              value={submissionDate}
              onChange={setSubmissionDate}
            />

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400">SARS Reference (Optional)</label>
               <input 
                 type="text"
                 value={ref}
                 onChange={(e) => setRef(e.target.value)}
                 placeholder="e.g. 123456789"
                 className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none px-4 py-3 text-sm text-white font-medium rounded-lg transition-all"
               />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-xs tracking-widest py-4 rounded-sm transition-all flex items-center justify-center gap-2"
            >
               {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
               Confirm Submission
            </button>
         </div>
      </motion.div>
    </div>
  );
}

function PaymentModal({ period, onClose }: { period: any, onClose: () => void }) {
  const router = useRouter();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const handlePay = async () => {
    setLoading(true);
    try {
      await payVatPeriod(period.id, paymentDate, Number(period.net_vat_payable));
      onClose();
      toast.success({ title: 'VAT Payment Recorded', message: 'Payment saved successfully.' });
      router.refresh();
    } catch (err: any) {
      toast.error({ title: 'Payment Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#151B28] border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden relative z-10 p-8 shadow-2xl">
         <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Record VAT Payment</h3>
         <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8 border-b border-slate-800/50 pb-4">
            Payment to SARS for {format(parseISO(period.period_start), 'MMM')}-{format(parseISO(period.period_end), 'MMM yyyy')}
         </p>

         <div className="space-y-6 text-center">
            <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
               <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Amount to Pay</p>
               <h4 className="text-3xl font-black text-white">R {Number(period.net_vat_payable || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</h4>
            </div>

            <DatePicker 
              label="Payment Date"
              value={paymentDate}
              onChange={setPaymentDate}
            />

            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-black uppercase text-xs tracking-widest py-4 rounded-sm transition-all flex items-center justify-center gap-2"
            >
               {loading ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
               Confirm Payment
            </button>
         </div>
      </motion.div>
    </div>
  );
}
