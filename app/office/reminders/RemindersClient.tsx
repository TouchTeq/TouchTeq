'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BellRing, 
  TrendingUp, 
  Mail, 
  AlertCircle, 
  ChevronRight, 
  Send, 
  Loader2,
  X,
  History,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { createClient } from '@/lib/supabase/client';
import { pickPreferredRecipient } from '@/lib/clients/contactPreference';

export default function RemindersClient({ overdueInvoices, history, stats }: any) {
  const router = useRouter();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState<any>(null); // { invoice, nextType }
  const [customMessage, setCustomMessage] = useState('');
  const [manualRecipientEmail, setManualRecipientEmail] = useState<string | null>(null);
  const [manualRecipientName, setManualRecipientName] = useState<string | null>(null);
  const [manualRecipientMatched, setManualRecipientMatched] = useState<'technical' | 'finance' | 'primary' | 'none'>('none');

  useEffect(() => {
    if (!showManualModal) return;
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('client_contacts')
          .select('contact_type, full_name, email, is_primary')
          .eq('client_id', showManualModal.invoice.client_id);

        const pref = pickPreferredRecipient(data || [], 'invoice');
        const email = pref.email || showManualModal.invoice.clients?.email || null;
        const name = pref.name || showManualModal.invoice.clients?.contact_person || null;

        if (!cancelled) {
          setManualRecipientEmail(email);
          setManualRecipientName(name);
          setManualRecipientMatched(pref.matched);
        }
      } catch {
        if (!cancelled) {
          setManualRecipientEmail(showManualModal.invoice.clients?.email || null);
          setManualRecipientName(showManualModal.invoice.clients?.contact_person || null);
          setManualRecipientMatched('none');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showManualModal]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const getSeverityColor = (days: number) => {
    if (days >= 15) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (days >= 8) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  };

  const handleSendManual = async () => {
    if (!showManualModal) return;
    setLoading('manual');
    try {
      // In a real app, we'd have a specific manual trigger endpoint 
      // or we can reuse the process endpoint with a body specifying the invoice.
      const res = await fetch('/api/reminders/process', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: showManualModal.invoice.id, manual: true, message: customMessage })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success({
        title: 'Reminder Sent',
        message: `Sent for ${showManualModal.invoice.invoice_number}.`,
      });
      setShowManualModal(null);
      setCustomMessage('');
      setManualRecipientEmail(null);
      setManualRecipientName(null);
      setManualRecipientMatched('none');
      router.refresh();
    } catch (err: any) {
      toast.error({ title: 'Send Failed', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleRunSequence = async () => {
    setLoading('sequence');

    try {
      const res = await fetch('/api/reminders/process', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to run automated reminder sequence.');
      }

      const sentCount = Array.isArray(data.results)
        ? data.results.filter((item: any) => item.status === 'Sent').length
        : 0;

      toast.success({
        title: 'Sequence Complete',
        message: sentCount > 0 ? `${sentCount} reminder(s) delivered.` : 'No reminders were due to send.',
      });
      router.refresh();
    } catch (err: any) {
      toast.error({ title: 'Sequence Failed', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151B28] border border-slate-800/50 p-8 rounded-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertCircle size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 font-mono">Currently Overdue</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-black text-white">{stats.totalOverdueCount}</h3>
            <p className="text-xs font-bold text-red-500 mb-1 uppercase tracking-tighter">Invoices</p>
          </div>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-8 rounded-xl shadow-2xl group">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 font-mono">Reminders Sent (MTD)</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-black text-white">{stats.remindersSentThisMonth}</h3>
            <p className="text-xs font-bold text-blue-500 mb-1 uppercase tracking-tighter">Successfully Delivered</p>
          </div>
        </div>

        <div className="bg-orange-500 p-8 rounded-xl shadow-2xl shadow-orange-500/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-200 mb-2 font-mono">Total Recoverable Value</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-black text-white">{formatCurrency(stats.totalOverdueValue)}</h3>
          </div>
        </div>
      </div>

      {/* Active Sequence */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
              <BellRing size={20} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Active Reminder Sequence</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Clients currently being chased</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRunSequence}
            disabled={loading === 'sequence'}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0B0F19] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all hover:bg-slate-800/70 disabled:opacity-50"
          >
            {loading === 'sequence' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Run Automated Sequence
          </button>
        </div>

        <div className="overflow-x-auto text-white">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[9px] uppercase font-bold tracking-[0.3em] border-b border-slate-800/50 bg-slate-900/50">
                <th className="px-8 py-5">Invoice / Client</th>
                <th className="px-6 py-5">Days Overdue</th>
                <th className="px-6 py-5">Balance Due</th>
                <th className="px-6 py-5">Last Reminder</th>
                <th className="px-6 py-5 text-right font-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {overdueInvoices.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="bg-slate-900/50 p-12 rounded-lg border border-dashed border-slate-800">
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">No active overdue reminders</p>
                      </div>
                   </td>
                </tr>
              ) : overdueInvoices.map((inv: any) => {
                const days = differenceInDays(new Date(), new Date(inv.due_date));
                return (
                  <tr key={inv.id} className="group hover:bg-[#0B0F19]/50 transition-colors">
                    <td className="px-8 py-6">
                      <Link href={`/office/invoices/${inv.id}`} className="block group/link">
                        <p className="font-black text-sm uppercase tracking-tight group-hover/link:text-orange-500 transition-colors">{inv.invoice_number}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{inv.clients.company_name}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-2 py-1 rounded text-[10px] font-black border uppercase tracking-widest ${getSeverityColor(days)} ${days >= 15 ? 'animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}`}>
                        {days} Days
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-sm">{formatCurrency(inv.balance_due)}</p>
                    </td>
                    <td className="px-6 py-6 font-mono text-[10px] text-slate-400 font-bold">
                       {/* Simplified last rem detection - in real app we'd pass this from server */}
                       Automated Sequence Active
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => {
                          setManualRecipientEmail(null);
                          setManualRecipientName(null);
                          setManualRecipientMatched('none');
                          setShowManualModal({ invoice: inv, nextType: 'Manual reminder' });
                        }}
                        className="p-3 bg-slate-800 text-slate-400 hover:text-white hover:bg-orange-500 rounded transition-all"
                      >
                        <Send size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Reminder History</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Deliveries for {format(new Date(), 'MMMM yyyy')}</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto text-white">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[9px] uppercase font-bold tracking-[0.3em] bg-slate-900/50 border-b border-slate-800/50">
                <th className="px-8 py-5">Date/Time</th>
                <th className="px-6 py-5">Invoice</th>
                <th className="px-6 py-5">Recipient</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-8 py-5 text-right font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {history.map((h: any) => (
                <tr key={h.id} className="text-xs font-medium border-b border-slate-800/30">
                  <td className="px-8 py-4 text-slate-500 font-mono">{format(new Date(h.sent_at), 'dd MMM, HH:mm')}</td>
                  <td className="px-6 py-4 font-black uppercase tracking-tight">{h.invoices?.invoice_number}</td>
                  <td className="px-6 py-4 text-slate-400">{h.recipient_email}</td>
                  <td className="px-6 py-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {h.reminder_type}
                     </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {h.status === 'Sent' ? (
                       <span className="flex items-center justify-end gap-1.5 text-green-500 font-black uppercase text-[9px] tracking-widest">
                          <CheckCircle2 size={12} /> Delivered
                       </span>
                    ) : (
                      <span className="flex items-center justify-end gap-1.5 text-red-500 font-black uppercase text-[9px] tracking-widest">
                          <X size={12} /> Failed
                       </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Modal */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowManualModal(null);
                setManualRecipientEmail(null);
                setManualRecipientName(null);
                setManualRecipientMatched('none');
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#151B28] border border-slate-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative z-10" >
               <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-widest text-xs">Send Manual Reminder</h3>
                <button
                  onClick={() => {
                    setShowManualModal(null);
                    setManualRecipientEmail(null);
                    setManualRecipientName(null);
                    setManualRecipientMatched('none');
                  }}
                  className="text-slate-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="bg-[#0B0F19] p-4 rounded-lg border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">To: {showManualModal.invoice.clients.company_name}</p>
                    <p className="text-white font-bold">{manualRecipientEmail || showManualModal.invoice.clients.email || '—'}</p>
                    {(manualRecipientName || manualRecipientMatched !== 'none') && (
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                        {manualRecipientName ? `Attn: ${manualRecipientName}` : null}
                        {manualRecipientName && manualRecipientMatched !== 'none' ? ' • ' : null}
                        {manualRecipientMatched !== 'none' ? `${manualRecipientMatched} contact` : null}
                      </p>
                    )}
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Custom message (Optional Override)</label>
                    <textarea 
                      rows={5} 
                      value={customMessage} 
                      onChange={(e) => setCustomMessage(e.target.value)} 
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded p-4 text-white text-xs outline-none resize-none font-medium" 
                      placeholder="Add a personal note or instruction for the client..." 
                    />
                 </div>
                 <button 
                  onClick={handleSendManual} 
                  disabled={loading === 'manual'} 
                  className="w-full py-5 bg-orange-500 text-white font-black uppercase tracking-[0.3em] text-sm rounded-sm hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {loading === 'manual' ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Send Overnight Now
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
