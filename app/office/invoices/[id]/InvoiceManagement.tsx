'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  Download, 
  CheckCircle2, 
  CreditCard, 
  Receipt,
  Mail,
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Plus,
  History,
  BellRing,
  Maximize2,
  ChevronDown,
  FileMinus
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '@/lib/invoices/InvoicePDF';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';
import { pickPreferredRecipient } from '@/lib/clients/contactPreference';

export default function InvoiceManagement({ invoice, initialPayments, lineItems, businessProfile, reminderLogs }: any) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState(initialPayments);
  
  // Modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientMatched, setRecipientMatched] = useState<'technical' | 'finance' | 'primary' | 'none'>('none');

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
          .eq('client_id', invoice.client_id);

        const pref = pickPreferredRecipient(data || [], 'invoice');
        const email = pref.email || invoice.clients?.email || null;
        const name = pref.name || invoice.clients?.contact_person || null;

        if (!cancelled) {
          setRecipientEmail(email);
          setRecipientName(name);
          setRecipientMatched(pref.matched);
        }
      } catch {
        if (!cancelled) {
          setRecipientEmail(invoice.clients?.email || null);
          setRecipientName(invoice.clients?.contact_person || null);
          setRecipientMatched('none');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showEmailModal, supabase, invoice.client_id, invoice.clients]);
  
  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: invoice.balance_due,
    date: new Date().toISOString().split('T')[0],
    method: 'EFT',
    reference: '',
    notes: ''
  });
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(val).replace('ZAR', 'R');
  };

  const handleDownloadPDF = async () => {
    setLoading('pdf');
    try {
      const blob = await pdf(<InvoicePDF invoice={invoice} lineItems={lineItems} businessProfile={businessProfile} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TouchTeq-${invoice.invoice_number}-${invoice.clients.company_name.replace(/\s+/g, '')}.pdf`;
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
      const blob = await pdf(<InvoicePDF invoice={invoice} lineItems={lineItems} businessProfile={businessProfile} />).toBlob();
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result?.toString().split(',')[1]);
        reader.readAsDataURL(blob);
      });
      const base64Content = await base64Promise;

      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          recipientEmail,
          recipientName,
          invoiceNumber: invoice.invoice_number,
          personalMessage: emailMessage,
          pdfContent: base64Content
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }

      setShowEmailModal(false);
      toast.success({ title: 'Email Sent', message: 'Invoice email sent successfully.' });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error({ title: 'Email Failed', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleRecordPayment = async (manualData?: any) => {
    const data = manualData || paymentForm;
    if (!manualData && data.amount <= 0) return;
    if (data.amount > invoice.balance_due + 0.01) {
      setError("Payment amount cannot exceed balance due.");
      return;
    }

    setLoading('payment');
    setError(null);
    try {
      // 1. Insert Payment
      const { data: payment, error: pError } = await supabase
        .from('payments')
        .insert([{
          invoice_id: invoice.id,
          amount: data.amount,
          payment_date: data.date,
          payment_method: data.method,
          reference: data.reference,
          notes: data.notes
        }])
        .select()
        .single();

      if (pError) throw pError;

      // 2. Update Invoice
      const newPaidAmount = Number(invoice.amount_paid) + Number(data.amount);
      const isPaid = newPaidAmount >= Number(invoice.total) - 0.01;
      
      const { error: invError } = await supabase
        .from('invoices')
        .update({
          amount_paid: newPaidAmount,
          status: isPaid ? 'Paid' : 'Partially Paid'
        })
        .eq('id', invoice.id);

      if (invError) throw invError;

      // 3. Update VAT Period (Output VAT)
      const issueDate = invoice.issue_date;
      const { data: period } = await supabase
        .from('vat_periods')
        .select('*')
        .lte('period_start', issueDate)
        .gte('period_end', issueDate)
        .single();
      
      if (period) {
        await supabase
          .from('vat_periods')
          .update({ output_vat: Number(period.output_vat) + Number(invoice.vat_amount) })
          .eq('id', period.id);
      }

      if (isPaid) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22C55E', '#F97316', '#FFFFFF']
        });
      }

      setShowPaymentModal(false);
      toast.success({
        title: 'Payment Recorded',
        message: isPaid ? 'Invoice marked as paid.' : 'Payment applied to invoice balance.',
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error({ title: 'Payment Failed', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm("Are you sure you want to mark this invoice as fully paid? This will record a manual payment for the remaining balance.")) return;
    
    const manualData = {
      amount: invoice.balance_due,
      date: new Date().toISOString().split('T')[0],
      method: 'Manual/Cash',
      reference: 'Self-marked as paid',
      notes: 'Final settlement recorded manually.'
    };
    
    handleRecordPayment(manualData);
  };

  return (
    <div className="space-y-10">
      {/* Management Toolbar */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link href="/office/invoices" className="p-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="h-10 w-px bg-slate-800" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Management</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                invoice.status === 'Draft' ? 'bg-slate-800 text-slate-400' : 
                invoice.status === 'Sent' ? 'bg-blue-500/10 text-blue-500' :
                invoice.status === 'Paid' ? 'bg-green-500/10 text-green-500' :
                invoice.status === 'Overdue' ? 'bg-red-500/10 text-red-500' :
                'bg-amber-500/10 text-amber-500'
              }`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {invoice.status === 'Draft' && (
            <Link 
              href={`/office/invoices/${invoice.id}/edit`}
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

          {invoice.status !== 'Paid' && (
            <>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-green-500 text-white hover:bg-green-600 rounded shadow-lg shadow-green-500/20 transition-all px-6 py-3"
              >
                <CreditCard size={14} /> Record Payment
              </button>
              
              <button 
                onClick={handleMarkAsPaid}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700 transition-all"
              >
                <CheckCircle2 size={14} /> Mark as Paid
              </button>

              {invoice.credit_status !== 'Fully Credited' && (
                <Link 
                  href={`/office/invoices/${invoice.id}/credit-note`}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded border border-red-500/20 transition-all"
                >
                  <FileMinus size={14} /> Issue Credit Note
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-3 font-bold text-sm">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Document Preview */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Tax Invoice Preview</p>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-orange-500 transition-colors"
            >
              <Maximize2 size={12} /> Fullscreen
            </button>
          </div>
          <div
            className="w-full bg-white text-slate-900 shadow-2xl rounded-sm p-12 min-h-[1000px] flex flex-col cursor-zoom-in relative group"
            onClick={() => setShowPreviewModal(true)}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-all z-10 pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2">
                <Maximize2 size={12} /> Click to expand
              </span>
            </div>
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b border-orange-500 pb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center font-black text-white italic text-xl">T</div>
                <div>
                  <span className="font-black text-xl uppercase tracking-tighter">Touch<span className="text-orange-500">Teq</span></span>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Engineering Services</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">Tax Invoice</h2>
                <p className="text-xs font-bold text-slate-500">#{invoice.invoice_number}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1">{new Date(invoice.issue_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div className="space-y-4">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Supplier:</h3>
                <div className="space-y-1">
                  <p className="font-black text-sm uppercase">{businessProfile.legal_name}</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{businessProfile.physical_address}</p>
                  <div className="pt-4 text-[9px] font-bold text-slate-400 space-y-1">
                    <p>VAT No: {businessProfile.vat_number}</p>
                    <p>Reg No: {businessProfile.registration_number}</p>
                    <p>CSD No: {businessProfile.csd_number}</p>
                    <p>Email: {businessProfile.email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Bill To:</h3>
                <div className="space-y-1">
                  <p className="font-black text-sm uppercase">{invoice.clients.company_name}</p>
                  <p className="text-xs font-bold text-slate-700">Attn: {invoice.clients.contact_person}</p>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{invoice.clients.physical_address}</p>
                  {invoice.clients.vat_number && <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">VAT No: {invoice.clients.vat_number}</p>}
                </div>
              </div>
            </div>

            <div className="mb-8 bg-slate-50 p-4 rounded-sm flex justify-between">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Reference</p>
                <p className="text-xs font-black text-slate-800">{invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                <p className="text-xs font-black text-slate-800">{new Date(invoice.due_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1">
              <table className="w-full">
                <thead className="bg-[#1E293B] text-white">
                  <tr className="text-[9px] font-black uppercase tracking-widest">
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

            {/* Totals Box */}
            <div className="mt-8 border-t-2 border-slate-900 pt-6 flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>R {new Intl.NumberFormat('en-ZA').format(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>VAT (15%)</span>
                  <span>R {new Intl.NumberFormat('en-ZA').format(invoice.vat_amount)}</span>
                </div>
                <div className="flex items-end justify-between py-4 border-t border-slate-100 gap-8">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest whitespace-nowrap leading-none">Total</span>
                  <span className="text-xl font-black text-orange-500 tabular-nums whitespace-nowrap leading-none tracking-tight">R {new Intl.NumberFormat('en-ZA').format(invoice.total)}</span>
                </div>
                {invoice.amount_paid > 0 && (
                  <div className="flex justify-between py-2 bg-green-50 px-3 rounded-sm">
                    <span className="text-[10px] font-black text-green-700 uppercase">Paid to date</span>
                    <span className="text-[10px] font-black text-green-700">- R {new Intl.NumberFormat('en-ZA').format(invoice.amount_paid)}</span>
                  </div>
                )}
                {invoice.balance_due > 0 && (
                  <div className="flex justify-between py-3 border-t-2 border-slate-900">
                    <span className="text-xs font-black text-slate-900 uppercase">Balance Due</span>
                    <span className="text-sm font-black text-slate-900 underline underline-offset-4 decoration-orange-500">R {new Intl.NumberFormat('en-ZA').format(invoice.balance_due)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Banking */}
            <div className="mt-12 bg-slate-50 p-8 rounded-sm border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 border-b pb-2">Banking Details</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bank</p>
                  <p className="text-[10px] font-bold text-slate-700">First National Bank (FNB)</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Account Number</p>
                  <p className="text-[10px] font-bold text-slate-700">62740294851</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Account Type</p>
                  <p className="text-[10px] font-bold text-slate-700">Business Current</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Branch Code</p>
                  <p className="text-[10px] font-bold text-slate-700">250655</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Use Reference</p>
                <p className="text-xs font-black text-slate-900">{invoice.invoice_number}</p>
              </div>
            </div>

            <div className="mt-auto pt-12 border-t border-slate-100 text-center">
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                {businessProfile.legal_name} • VAT: {businessProfile.vat_number} • Reg: {businessProfile.registration_number}
              </p>
            </div>
          </div>
        </div>

        {/* Fullscreen Invoice Preview Modal */}
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
            <div
              className="w-full h-full max-w-6xl max-h-[90vh] overflow-auto rounded-sm shadow-2xl bg-white text-slate-900 p-12"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-12 border-b border-orange-500 pb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center font-black text-white italic text-xl">T</div>
                  <div>
                    <span className="font-black text-xl uppercase tracking-tighter">Touch<span className="text-orange-500">Teq</span></span>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Engineering Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">Tax Invoice</h2>
                  <p className="text-xs font-bold text-slate-500">#{invoice.invoice_number}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">{new Date(invoice.issue_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="space-y-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Supplier:</h3>
                  <div className="space-y-1">
                    <p className="font-black text-sm uppercase">{businessProfile.legal_name}</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{businessProfile.physical_address}</p>
                    <div className="pt-4 text-[9px] font-bold text-slate-400 space-y-1">
                      <p>VAT No: {businessProfile.vat_number}</p>
                      <p>Reg No: {businessProfile.registration_number}</p>
                      <p>Email: {businessProfile.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Bill To:</h3>
                  <div className="space-y-1">
                    <p className="font-black text-sm uppercase">{invoice.clients.company_name}</p>
                    <p className="text-xs font-bold text-slate-700">Attn: {invoice.clients.contact_person}</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{invoice.clients.physical_address}</p>
                  </div>
                </div>
              </div>
              <table className="w-full mb-8">
                <thead className="bg-[#1E293B] text-white">
                  <tr className="text-[9px] font-black uppercase tracking-widest">
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
              <div className="border-t-2 border-slate-900 pt-6 flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Subtotal</span><span>R {new Intl.NumberFormat('en-ZA').format(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>VAT (15%)</span><span>R {new Intl.NumberFormat('en-ZA').format(invoice.vat_amount)}</span>
                  </div>
                  <div className="flex items-end justify-between py-4 border-t border-slate-100 gap-8">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest whitespace-nowrap leading-none">Total</span>
                    <span className="text-xl font-black text-orange-500 tabular-nums whitespace-nowrap leading-none tracking-tight">R {new Intl.NumberFormat('en-ZA').format(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar: Financial Trail */}
        <div className="space-y-8">
          {/* Summary Card */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-orange-500" /> Settlement Summary
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Invoice Value</p>
                <p className="text-xl font-black text-white">{formatCurrency(invoice.total)}</p>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000" 
                  style={{ width: `${(invoice.amount_paid / invoice.total) * 100}%` }} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Collected</p>
                  <p className="text-sm font-black text-green-500">{formatCurrency(invoice.amount_paid)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Remaining</p>
                  <p className="text-sm font-black text-amber-500">{formatCurrency(invoice.balance_due)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                <History size={16} className="text-orange-500" /> Payment Trail
              </div>
              {payments.length > 0 && (
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-black rounded-full">
                  {payments.length}
                </span>
              )}
            </div>
            
            <div className="p-6">
              {payments && payments.length > 0 ? (
                <div className="space-y-8 relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-800/50" />
                  {payments.map((p: any, idx: number) => (
                    <div key={p.id} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-6 h-6 bg-[#0B0F19] border border-slate-800 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="font-black text-white text-sm">{formatCurrency(p.amount)}</p>
                          <span className="text-[10px] font-bold text-slate-500">
                            {format(new Date(p.payment_date), 'dd MMM yyyy')}
                          </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {p.payment_method} • {p.reference || 'No Reference'}
                        </p>
                        {p.notes && <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed mt-2">{p.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <div className="w-12 h-12 bg-slate-800/30 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={24} className="text-slate-700" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No payments recorded</p>
                </div>
              )}
            </div>
          </div>

          {/* Reminder History Section */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                <BellRing size={16} className="text-orange-500" /> Reminder Sequence
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Sequence Indicator */}
              <div className="flex justify-between relative px-2">
                <div className="absolute top-3 left-6 right-6 h-0.5 bg-slate-800 z-0" />
                {['1st Reminder', '2nd Reminder', 'Final Notice'].map((type, idx) => {
                  const sent = reminderLogs?.some((l: any) => l.reminder_type === type && l.status === 'Sent');
                  return (
                    <div key={type} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                        sent ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-[#0B0F19] border-slate-700 text-slate-500'
                      }`}>
                        {sent ? <CheckCircle2 size={12} /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-tighter text-center ${sent ? 'text-white' : 'text-slate-600'}`}>{type.replace(' Reminder', '').replace(' Notice', '')}</span>
                    </div>
                  );
                })}
              </div>

              {/* Reminder Log List */}
              <div className="space-y-4">
                {reminderLogs && reminderLogs.length > 0 ? (
                  reminderLogs.map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-slate-900/30 rounded border border-slate-800/50 group/log">
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-tight">{log.reminder_type}</p>
                        <p className="text-[9px] text-slate-500 font-bold">{format(new Date(log.sent_at), 'dd MMM, HH:mm')}</p>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        log.status === 'Sent' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {log.status === 'Sent' ? 'Delivered' : 'Failed'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No Reminders Sent</p>
                  </div>
                )}
              </div>

              {(invoice.status === 'Overdue' || invoice.status === 'Sent') && (
                <button 
                  onClick={() => setShowEmailModal(true)} // Or dedicated trigger
                  className="w-full py-4 bg-[#1e293b] hover:bg-orange-500 hover:text-white text-slate-400 rounded-sm font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group"
                >
                  <Send size={14} className="group-hover:translate-x-1 transition-transform" /> Send Next Reminder
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#151B28] border border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-widest text-xs">Record Client Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Amount Received (ZAR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded p-4 pl-10 text-white font-black text-xl outline-none focus:border-orange-500"
                    />
                  </div>
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest text-right">Max: {formatCurrency(invoice.balance_due)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DatePicker 
                    label="Date Received"
                    value={paymentForm.date}
                    onChange={(val) => setPaymentForm({...paymentForm, date: val})}
                  />
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Method</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPaymentMethodOpen(!paymentMethodOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
                          paymentMethodOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-white">{paymentForm.method}</span>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform ${paymentMethodOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {paymentMethodOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[#0B0F19] border border-slate-700 rounded-lg shadow-xl z-50">
                          {['EFT', 'Cash', 'Other'].map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => {
                                setPaymentForm({...paymentForm, method});
                                setPaymentMethodOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left hover:bg-[#151B28] transition-colors font-bold text-sm uppercase tracking-widest ${
                                paymentForm.method === method ? 'text-orange-500' : 'text-slate-300'
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Reference / Notes</label>
                  <input 
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                    placeholder="Bank reference number..."
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium outline-none mb-2"
                  />
                  <textarea 
                    rows={2}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    placeholder="Internal notes about this payment..."
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium outline-none resize-none"
                  />
                </div>

                <button 
                  onClick={handleRecordPayment}
                  disabled={loading === 'payment'}
                  className="w-full py-5 bg-green-500 text-white font-black uppercase tracking-[0.3em] text-sm rounded-sm hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 disabled:opacity-50"
                >
                  {loading === 'payment' ? 'Recording...' : 'Finalize Payment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEmailModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#151B28] border border-slate-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative z-10" >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-widest text-xs">Send Tax Invoice</h3>
                <button onClick={() => setShowEmailModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-[#0B0F19] p-4 rounded-lg border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Recipient</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white font-bold">{recipientName || invoice.clients.contact_person}</p>
                    {recipientMatched !== 'none' && (
                      <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                        {recipientMatched}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">{recipientEmail || invoice.clients.email}</p>
                </div>
                <textarea rows={4} value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 rounded p-4 text-white text-xs outline-none resize-none" placeholder="Add a personal message..." />
                <button onClick={handleSendEmail} disabled={loading === 'email'} className="w-full py-4 bg-blue-600 text-white font-black uppercase text-xs rounded-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                   {loading === 'email' ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />} Send Invoice Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
  return <div className={`border-2 border-white/30 border-t-white rounded-full animate-spin ${className}`} style={{ width: size, height: size }} />;
}

function TrendingUp({ className, size }: { className?: string, size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
}
