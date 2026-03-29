'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Receipt,
  Mail,
  Loader2,
  AlertCircle,
  ExternalLink,
  Edit2,
  Maximize2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from '@/lib/quotes/QuotePDF';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { pickPreferredRecipient } from '@/lib/clients/contactPreference';

export default function QuoteDetailClient({ quote, lineItems, businessProfile }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientMatched, setRecipientMatched] = useState<'technical' | 'finance' | 'primary' | 'none'>('none');
  const toast = useOfficeToast();
  const supabase = createClient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPreviewModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!showEmailModal) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase
          .from('client_contacts')
          .select('contact_type, full_name, email, is_primary')
          .eq('client_id', quote.client_id);

        const pref = pickPreferredRecipient(data || [], 'quote');
        const email = pref.email || quote.clients?.email || null;
        const name = pref.name || quote.clients?.contact_person || null;

        if (!cancelled) {
          setRecipientEmail(email);
          setRecipientName(name);
          setRecipientMatched(pref.matched);
        }
      } catch {
        if (!cancelled) {
          setRecipientEmail(quote.clients?.email || null);
          setRecipientName(quote.clients?.contact_person || null);
          setRecipientMatched('none');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showEmailModal, supabase, quote.client_id, quote.clients]);

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading('status');
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', quote.id);

      if (error) throw error;

      if (newStatus === 'Accepted') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F97316', '#22C55E', '#FFFFFF']
        });
      }

      toast.success({ title: 'Status Updated', message: `Quote marked as ${newStatus}.` });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error({ title: 'Update Failed', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading('pdf');
    try {
      const blob = await pdf(<QuotePDF quote={quote} lineItems={lineItems} businessProfile={businessProfile} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quotation_${quote.quote_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Failed to generate PDF.");
    } finally {
      setLoading(null);
    }
  };

  const handleSendEmail = async () => {
    setLoading('email');
    setError(null);
    try {
      const blob = await pdf(<QuotePDF quote={quote} lineItems={lineItems} businessProfile={businessProfile} />).toBlob();

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result?.toString().split(',')[1]);
        reader.readAsDataURL(blob);
      });
      const base64Content = await base64Promise;

      const response = await fetch('/api/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          recipientEmail,
          recipientName,
          quoteNumber: quote.quote_number,
          personalMessage: emailMessage,
          pdfContent: base64Content
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setShowEmailModal(false);
      toast.success({ title: 'Email Sent', message: 'Quotation email sent successfully.' });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error({ title: 'Email Failed', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleConvertToInvoice = async () => {
    setLoading('convert');
    try {
      // Note: This logic would usually happen in a Server Action or API for safety, 
      // but for this MVP conversion, we'll implement it as described.
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert([{
          client_id: quote.client_id,
          invoice_number: quote.quote_number.replace('QT', 'INV'), // Simple mapping for now
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: quote.subtotal,
          vat_amount: quote.vat_amount,
          amount_paid: 0,
          status: 'Draft'
        }])
        .select()
        .single();

      if (invError) throw invError;

      // Copy line items
      const invoiceItems = lineItems.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total
      }));

      await supabase.from('invoice_line_items').insert(invoiceItems);

      // Update quote
      await supabase
        .from('quotes')
        .update({ status: 'Converted', converted_to_invoice: true, invoice_id: invoice.id })
        .eq('id', quote.id);

      router.push(`/office/invoices/${invoice.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const isReadOnly = ['Accepted', 'Declined', 'Expired', 'Converted'].includes(quote.status);

  return (
    <div className="space-y-10">
      {/* Management Toolbar */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link href="/office/quotes" className="p-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="h-10 w-px bg-slate-800" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Management Controls</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${quote.status === 'Draft' ? 'bg-slate-800 text-slate-400' :
                quote.status === 'Sent' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-green-500/10 text-green-500'
                }`}>
                {quote.status}
              </span>
              {quote.converted_to_invoice && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded">
                  Converted
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Main Actions */}
          {!isReadOnly && (
            <Link
              href={`/office/quotes/${quote.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-all"
            >
              <Edit2 size={14} /> Edit
            </Link>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={loading === 'pdf'}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-all"
          >
            {loading === 'pdf' ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
            PDF
          </button>

          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded border border-blue-600/20 transition-all"
          >
            <Send size={14} /> Send Email
          </button>

          {quote.status === 'Sent' && (
            <>
              <button
                onClick={() => handleUpdateStatus('Accepted')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white rounded border border-green-600/20 transition-all"
              >
                <CheckCircle2 size={14} /> Accept
              </button>
              <button
                onClick={() => handleUpdateStatus('Declined')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded border border-red-600/20 transition-all"
              >
                <XCircle size={14} /> Decline
              </button>
            </>
          )}

          {quote.status === 'Accepted' && !quote.converted_to_invoice && (
            <button
              onClick={handleConvertToInvoice}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-orange-500 text-white hover:bg-orange-600 rounded shadow-lg shadow-orange-500/20 transition-all"
            >
              <Receipt size={14} /> Convert to Invoice
            </button>
          )}

          {quote.converted_to_invoice && (
            <Link
              href={`/office/invoices/${quote.invoice_id}`}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-purple-500 text-white hover:bg-purple-600 rounded transition-all"
            >
              <ExternalLink size={14} /> View Invoice
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-3 font-bold text-sm">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Document Preview */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-[800px] mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Document Preview</p>
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-orange-500 transition-colors"
          >
            <Maximize2 size={12} /> Fullscreen
          </button>
        </div>

        <div
          className="w-full max-w-[800px] aspect-[1/1.41] bg-white text-slate-900 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden p-12 flex flex-col cursor-zoom-in relative group"
          onClick={() => setShowPreviewModal(true)}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all z-10">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2">
              <Maximize2 size={12} /> Click to expand
            </span>
          </div>
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center font-black text-white italic text-xl">T</div>
              <div>
                <span className="font-black text-xl uppercase tracking-tighter">Touch<span className="text-orange-500">Teq</span></span>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Engineering Services</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">Quotation</h2>
              <p className="text-xs font-bold text-slate-500">#{quote.quote_number}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-1">{new Date(quote.issue_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 border-b border-slate-100 pb-2">From:</h3>
              <div className="space-y-1">
                <p className="font-black text-sm uppercase">{businessProfile.legal_name}</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{businessProfile.physical_address}</p>
                <div className="pt-2 text-[10px] font-bold text-slate-400 space-y-0.5">
                  <p>VAT Reg: {businessProfile.vat_number}</p>
                  <p>Reg No: {businessProfile.registration_number}</p>
                  <p>Email: {businessProfile.email}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">For:</h3>
              <div className="space-y-1">
                <p className="font-black text-sm uppercase">{quote.clients?.company_name || 'N/A'}</p>
                <p className="text-xs font-bold text-slate-700">Attn: {quote.clients?.contact_person || 'N/A'}</p>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{quote.clients?.physical_address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-3 text-left w-3/5 rounded-l-sm">Description</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right rounded-r-sm">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((item: any, i: number) => (
                  <tr key={i} className="text-slate-800">
                    <td className="px-6 py-4 text-xs font-bold leading-relaxed">{item.description}</td>
                    <td className="px-4 py-4 text-xs font-bold text-center text-slate-500">{item.quantity}</td>
                    <td className="px-4 py-4 text-xs font-bold text-right text-slate-500">{new Intl.NumberFormat('en-ZA').format(item.unit_price)}</td>
                    <td className="px-6 py-4 text-xs font-black text-right">{new Intl.NumberFormat('en-ZA').format(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="mt-8 border-t-2 border-slate-900 pt-6 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>R {new Intl.NumberFormat('en-ZA').format(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>VAT (15%)</span>
                <span>R {new Intl.NumberFormat('en-ZA').format(quote.vat_amount)}</span>
              </div>
              <div className="flex items-baseline justify-between py-3 border-t border-slate-100 gap-4">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest whitespace-nowrap">Total Amount</span>
                <span className="text-lg font-black text-orange-500 tabular-nums">R {new Intl.NumberFormat('en-ZA').format(quote.total)}</span>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-12 bg-slate-50 p-6 rounded-sm border-l-4 border-orange-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Terms & Notes</p>
              <p className="text-[10px] text-slate-600 leading-relaxed font-medium italic">{quote.notes}</p>
            </div>
          )}

          <div className="mt-auto pt-12 border-t border-slate-100 text-center">
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              {businessProfile.legal_name} • Reg No: {businessProfile.registration_number} • VAT: {businessProfile.vat_number} • CSD: {businessProfile.csd_number}
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm"
            onClick={() => setShowPreviewModal(false)}
          >
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-6 right-6 z-10 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all shadow-xl"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full h-full max-w-6xl max-h-[90vh] overflow-auto rounded-sm shadow-2xl bg-white text-slate-900 p-12"
              onClick={e => e.stopPropagation()}
            >
              {/* Full document content mirrored from preview */}
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center font-black text-white italic text-xl">T</div>
                  <div>
                    <span className="font-black text-xl uppercase tracking-tighter">Touch<span className="text-orange-500">Teq</span></span>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Engineering Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">Quotation</h2>
                  <p className="text-xs font-bold text-slate-500">#{quote.quote_number}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">{new Date(quote.issue_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 border-b border-slate-100 pb-2">From:</h3>
                  <div className="space-y-1">
                    <p className="font-black text-sm uppercase">{businessProfile.legal_name}</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{businessProfile.physical_address}</p>
                    <div className="pt-2 text-[10px] font-bold text-slate-400 space-y-0.5">
                      <p>VAT Reg: {businessProfile.vat_number}</p>
                      <p>Reg No: {businessProfile.registration_number}</p>
                      <p>Email: {businessProfile.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">For:</h3>
                  <div className="space-y-1">
                    <p className="font-black text-sm uppercase">{quote.clients?.company_name || 'N/A'}</p>
                    <p className="text-xs font-bold text-slate-700">Attn: {quote.clients?.contact_person || 'N/A'}</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{quote.clients?.physical_address || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <table className="w-full mb-8">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-3 text-left w-3/5 rounded-l-sm">Description</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-right rounded-r-sm">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((item: any, i: number) => (
                    <tr key={i} className="text-slate-800">
                      <td className="px-6 py-4 text-xs font-bold leading-relaxed">{item.description}</td>
                      <td className="px-4 py-4 text-xs font-bold text-center text-slate-500">{item.quantity}</td>
                      <td className="px-4 py-4 text-xs font-bold text-right text-slate-500">{new Intl.NumberFormat('en-ZA').format(item.unit_price)}</td>
                      <td className="px-6 py-4 text-xs font-black text-right">{new Intl.NumberFormat('en-ZA').format(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end border-t-2 border-slate-900 pt-6">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Subtotal</span><span>R {new Intl.NumberFormat('en-ZA').format(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>VAT (15%)</span><span>R {new Intl.NumberFormat('en-ZA').format(quote.vat_amount)}</span>
                  </div>
                  <div className="flex items-baseline justify-between py-3 border-t border-slate-100 gap-4">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest whitespace-nowrap">Total Amount</span>
                    <span className="text-xl font-black text-orange-500 tabular-nums">R {new Intl.NumberFormat('en-ZA').format(quote.total)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmailModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#151B28] border border-slate-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-widest text-xs">Send Quotation by Email</h3>
                <button onClick={() => setShowEmailModal(false)} className="text-slate-500 hover:text-white"><XCircle size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-[#0B0F19] p-4 rounded-lg border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Recipient</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white font-bold">{recipientName || quote.clients?.contact_person}</p>
                    {recipientMatched !== 'none' && (
                      <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                        {recipientMatched}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs font-medium">{recipientEmail || quote.clients?.email}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Personal Message (Optional)</label>
                  <textarea
                    rows={4}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded p-4 text-white text-xs font-medium outline-none resize-none focus:border-orange-500"
                    placeholder="Hi John, attached is the quotation we discussed..."
                  />
                  <p className="text-[10px] text-slate-500 font-medium italic">The PDF quotation will be automatically attached.</p>
                </div>

                <button
                  onClick={handleSendEmail}
                  disabled={loading === 'email'}
                  className="w-full py-4 bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-sm hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading === 'email' ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                  Send Email Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
