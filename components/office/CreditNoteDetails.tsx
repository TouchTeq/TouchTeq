'use client';

import { useState } from 'react';
import { 
  X, 
  Download, 
  Mail, 
  Trash2, 
  FileText,
  AlertCircle,
  Eye,
  CheckCircle2,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer';
import { CreditNotePDF } from '@/lib/office/CreditNotePDF';
import { updateCreditNoteStatus } from '@/lib/office/creditNoteActions';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { sendDocumentEmail } from '@/lib/office/outbound-email';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface CreditNoteDetailsProps {
  cn: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onDelete: () => void;
}

const STATUS_OPTIONS = ['Draft', 'Issued'];

export function CreditNoteDetails({ cn, isOpen, onClose, onRefresh, onDelete }: CreditNoteDetailsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { success, error, info } = useOfficeToast();

  if (!cn) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await updateCreditNoteStatus(cn.id, newStatus);
      success({ title: 'Status Updated', message: `Credit Note ${cn.cn_number} is now ${newStatus}` });
      onRefresh?.();
    } catch (err: any) {
      error({ title: 'Update Failed', message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!cn.clients?.email) {
      error({ title: 'Missing Email', message: 'Client has no email configured.' });
      return;
    }

    try {
      setIsSending(true);
      info({ title: 'Preparing', message: 'Generating PDF and sending email...' });
      
      const supabase = createClient();
      
      // Generate PDF Base64
      const blob = await pdf(<CreditNotePDF cn={cn} client={cn.clients} invoice={cn.invoices} />).toBlob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
      });
      reader.readAsDataURL(blob);
      const base64 = await base64Promise;

      const ok = await sendDocumentEmail({
        supabase,
        documentType: 'credit-note',
        documentId: cn.id,
        attachmentBase64: base64,
        recipientEmail: cn.clients.email,
        recipientName: cn.clients.contact_person || cn.clients.company_name
      });

      if (ok) {
        success({ title: 'Sent', message: `Credit Note ${cn.cn_number} sent to ${cn.clients.email}` });
        onRefresh?.();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (err: any) {
      error({ title: 'Email Failed', message: err.message });
    } finally {
      setIsSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount).replace('ZAR', 'R');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-[#0B0F19] w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    {cn.cn_number}
                  </h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    Client: {cn.clients?.company_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                      activeTab === 'details' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                      activeTab === 'preview' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    PDF Preview
                  </button>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {activeTab === 'details' ? (
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Status & Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-6 bg-slate-900/30 p-6 rounded-xl border border-slate-800/50">
                    <div className="space-y-3">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Change Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(status)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                              cn.status === status
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {cn.status === 'Draft' && (
                        <Link
                          href={`/office/credit-notes/${cn.id}/edit`}
                          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border border-slate-700 transition-all"
                        >
                          <FileText size={14} /> Edit Credit Note
                        </Link>
                      )}
                      <button 
                        onClick={handleSendEmail}
                        disabled={isSending}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all"
                      >
                        {isSending ? 'Sending...' : <><Mail size={14} /> Send to Client</>}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Client Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-2">
                        <User size={14} className="text-orange-500" /> Client Details
                      </div>
                      <div className="bg-slate-900/20 p-5 rounded-xl border border-slate-800/50 space-y-3">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Name</p>
                          <p className="text-white font-bold">{cn.clients?.company_name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reference</p>
                          <p className="text-slate-300 font-mono text-sm">Against Invoice: {cn.invoices?.invoice_number || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-2">
                        <Calendar size={14} className="text-blue-500" /> Important Dates
                      </div>
                      <div className="bg-slate-900/20 p-5 rounded-xl border border-slate-800/50 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit Date</p>
                          <p className="text-white font-bold">{format(new Date(cn.date), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest border-b border-slate-800 pb-2">
                      <Hash size={14} className="text-emerald-500" /> Credit Adjustments
                    </div>
                    <div className="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-800/30 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-center">Qty</th>
                            <th className="px-6 py-4 text-right">Unit Price</th>
                            <th className="px-6 py-4 text-right">Total Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                          {cn.credit_note_items?.map((item: any) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 text-slate-200 text-sm font-medium">{item.description}</td>
                              <td className="px-6 py-4 text-center text-slate-400 text-sm font-mono">{item.quantity}</td>
                              <td className="px-6 py-4 text-right text-slate-400 text-sm font-mono">{formatCurrency(item.unit_price)}</td>
                              <td className="px-6 py-4 text-right text-white font-bold font-mono">{formatCurrency(item.line_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-900/60 font-black">
                            <td colSpan={3} className="px-6 py-4 text-right text-orange-500 text-xs uppercase tracking-widest">Total Credit Amount</td>
                            <td className="px-6 py-4 text-right text-white text-lg">{formatCurrency(cn.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {cn.reason && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} /> Reason for Credit
                      </p>
                      <div className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-xl text-slate-400 text-sm italic leading-relaxed">
                        {cn.reason}
                      </div>
                    </div>
                  )}

                  {/* Danger Zone */}
                  <div className="pt-8 border-t border-slate-800">
                    <button 
                      onClick={onDelete}
                      className="flex items-center gap-2 text-rose-500 hover:text-rose-400 font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                      <Trash2 size={14} /> Delete Credit Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-slate-800 flex flex-col">
                  <div className="bg-slate-900 p-3 flex items-center justify-between border-b border-slate-800">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Eye size={12} /> Live PDF Preview
                    </span>
                    <PDFDownloadLink
                      document={<CreditNotePDF cn={cn} client={cn.clients} invoice={cn.invoices} />}
                      fileName={`${cn.cn_number}.pdf`}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {({ loading }) => (
                        <>
                          <Download size={12} /> {loading ? 'PREPARING...' : 'DOWNLOAD PDF'}
                        </>
                      )}
                    </PDFDownloadLink>
                  </div>
                  <div className="flex-1 bg-slate-700">
                    <PDFViewer width="100%" height="100%" className="border-none">
                      <CreditNotePDF cn={cn} client={cn.clients} invoice={cn.invoices} />
                    </PDFViewer>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
