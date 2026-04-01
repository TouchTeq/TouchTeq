'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  ArrowLeft, 
  Building2, 
  Receipt, 
  Plus, 
  Trash2,
  Calendar,
  Hash,
  FileText,
  X,
  Search,
  Lock,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import DraftActionDock from '@/components/office/DraftActionDock';
import { useAiDraft } from '@/components/office/AiDraftContext';
import { useActiveDocument } from '@/components/office/ActiveDocumentContext';
import { DatePicker } from '@/components/ui/DatePicker';

export default function EditInvoiceClient({ initialInvoice, initialLineItems, initialClients }: any) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedClient, setSelectedClient] = useState(initialInvoice.clients);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    issue_date: initialInvoice.issue_date,
    due_date: initialInvoice.due_date,
    reference: initialInvoice.reference || '',
    notes: initialInvoice.notes || '',
    internal_notes: initialInvoice.internal_notes || '',
    status: initialInvoice.status
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const { clearAiDraft } = useAiDraft();
  const { registerDocumentSession, clearDocumentSession, updateField, addLineItem, removeLineItem, updateLineItem, documentData } = useActiveDocument();

  const [lineItems, setLineItems] = useState(initialLineItems.map((item: any) => ({
    id: item.id,
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    total: Number(item.line_total),
    qty_type: item.qty_type === 'hrs' ? 'hrs' : 'qty'
  })));

  const descriptionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    descriptionRefs.current.forEach((textarea, idx) => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });
  }, [lineItems]);

  useEffect(() => {
    registerDocumentSession({
      documentType: 'invoice',
      documentId: initialInvoice.id,
      documentData: {
        invoiceNumber: initialInvoice.invoice_number,
        documentNumber: initialInvoice.invoice_number,
        clientName: initialInvoice.clients?.company_name ?? null,
        clientId: initialInvoice.clients?.id ?? null,
        issue_date: initialInvoice.issue_date,
        due_date: initialInvoice.due_date,
        reference: initialInvoice.reference || '',
        notes: initialInvoice.notes || '',
        internal_notes: initialInvoice.internal_notes || '',
        status: initialInvoice.status,
        lineItems: initialLineItems.map((item: any) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          total: Number(item.line_total || item.quantity * item.unit_price),
          line_total: Number(item.line_total || item.quantity * item.unit_price),
          qty_type: item.qty_type === 'hrs' ? 'hrs' : 'qty',
        })),
      },
      isOpen: true,
    });
    return () => clearDocumentSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearDocumentSession, registerDocumentSession, initialInvoice.id]);

  // Handle updates from AI Assistant (Live Session)
  useEffect(() => {
    if (!documentData) return;

    setFormData((prev) => ({
      ...prev,
      issue_date: documentData.issue_date || prev.issue_date,
      due_date: documentData.due_date || prev.due_date,
      reference: documentData.reference ?? prev.reference,
      notes: documentData.notes ?? prev.notes,
      internal_notes: documentData.internal_notes ?? prev.internal_notes,
      status: documentData.status ?? prev.status,
    }));

    if (Array.isArray(documentData.lineItems)) {
      setLineItems(documentData.lineItems.map((item: any) => ({
        id: item.id || undefined,
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unitPrice ?? item.unit_price) || 0,
        total: Number(item.total ?? item.line_total ?? (Number(item.quantity) || 1) * (Number(item.unitPrice ?? item.unit_price) || 0)),
        qty_type: item.qty_type === 'hrs' ? 'hrs' : 'qty',
      })));
    }
  }, [documentData]);

  const subtotal = useMemo(() => {
    return lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
  }, [lineItems]);

  const vatAmount = subtotal * 0.15;
  const total = subtotal + vatAmount;

  const handleLineChange = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    setLineItems(newItems);
    updateLineItem(index, field === 'unit_price' ? 'unitPrice' : field, value);
  };

  const handleAddLine = () => {
    const newItem = { description: '', quantity: 1, unit_price: 0, total: 0, qty_type: 'qty' as const };
    setLineItems([...lineItems, newItem]);
    addLineItem({ ...newItem, unitPrice: 0, qty_type: 'qty' });
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_: any, i: number) => i !== index));
    removeLineItem(index);
  };

  const handleFormFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const itemsJson = lineItems.map((item: any, idx: number) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        qty_type: item.qty_type || 'qty',
      }));

      const response = await fetch(`/api/office/invoices/${initialInvoice.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          status: formData.status,
          notes: formData.notes,
          internal_notes: formData.internal_notes,
          reference: formData.reference,
          line_items: itemsJson,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Invoice update failed');
      }

      router.push(`/office/invoices/${initialInvoice.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const triggerSave = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  // Allow AI assistant to trigger save remotely
  useEffect(() => {
    const handler = () => triggerSave();
    window.addEventListener('touchteq-ai-save-document', handler);
    return () => window.removeEventListener('touchteq-ai-save-document', handler);
  }, [triggerSave]);

  const formatRand = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(val).replace('ZAR', 'R');
  };

  // If not draft, show lock
  if (initialInvoice.status !== 'Draft') {
    return (
      <div className="w-full py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
          <Lock size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Invoice Locked</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
          Sent, partially paid, or completed invoices cannot be edited to maintain financial integrity. 
          To correct this invoice, please create a new one and note the correction in the reference field.
        </p>
        <Link href={`/office/invoices/${initialInvoice.id}`} className="inline-block text-orange-500 font-black text-xs uppercase tracking-[0.2em] border-b border-orange-500/30 pb-1 mt-8">
          Go Back to Invoice Detail
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-24">
      {statusOpen && (
        <div className="fixed inset-0 z-[99]" onClick={() => setStatusOpen(false)} />
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link href={`/office/invoices/${initialInvoice.id}`} className="flex items-center gap-2 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-colors">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Edit Invoice</h1>
            <span className="px-3 py-1 bg-slate-800 text-slate-400 font-black text-xs rounded border border-slate-700">
              {initialInvoice.invoice_number}
            </span>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
              <Building2 className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Client Details</h2>
            </div>
            <div className="p-8">
               <div className="flex items-center justify-between bg-[#0B0F19] p-6 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 italic font-black text-xl">
                      {selectedClient.company_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-white uppercase tracking-tight text-lg">{selectedClient.company_name}</p>
                      <p className="text-slate-400 font-bold text-xs mt-1">{selectedClient.contact_person} • {selectedClient.email}</p>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
              <Receipt className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Line Items</h2>
            </div>
            {/* Table matches NewInvoicePage */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-slate-800/50">
                    <th className="px-8 py-4 w-1/2">Description</th>
                    <th className="px-2 py-4">Type</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Price (R)</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {lineItems.map((item: any, idx: number) => (
                    <tr key={idx} className="bg-[#0B0F19]/20 group">
                      <td className="px-8 py-4">
                        <textarea 
                          ref={(el) => { descriptionRefs.current[idx] = el; }}
                          required 
                          value={item.description} 
                          onChange={(e) => {
                            handleLineChange(idx, 'description', e.target.value);
                            setTimeout(() => {
                              const textarea = descriptionRefs.current[idx];
                              if (textarea) {
                                textarea.style.height = 'auto';
                                textarea.style.height = textarea.scrollHeight + 'px';
                              }
                            }, 0);
                          }} 
                          className="w-full bg-[#0B0F19] border border-slate-800 rounded outline-none text-slate-200 text-sm font-medium" 
                          rows={1}
                          style={{ minHeight: '2rem', height: 'auto', resize: 'none', overflow: 'hidden', paddingTop: '0.5rem', paddingBottom: '0.375rem', paddingLeft: '0.75rem' }}
                        />
                      </td>
                      <td className="px-2 py-4">
                        <button
                          type="button"
                          onClick={() => handleLineChange(idx, 'qty_type', item.qty_type === 'qty' ? 'hrs' : 'qty')}
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                            item.qty_type === 'hrs' 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-[#0B0F19] border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.qty_type === 'hrs' ? 'Hrs' : 'Qty'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <input type="text" inputMode="numeric" value={item.quantity} onFocus={(e) => e.target.select()} onChange={(e) => { const val = e.target.value; if (val === '') { handleLineChange(idx, 'quantity', 0); } else { const num = parseInt(val.replace(/\D/g, ''), 10); if (!isNaN(num)) handleLineChange(idx, 'quantity', num); } }} onBlur={(e) => { const val = e.target.value; if (val === '' || isNaN(parseInt(val, 10))) { handleLineChange(idx, 'quantity', 1); } }} className="w-16 bg-[#0B0F19] border border-slate-800 rounded p-2 text-center text-white text-xs font-bold" />
                      </td>
                      <td className="px-6 py-4">
                        <input type="text" inputMode="decimal" value={item.unit_price} onFocus={(e) => e.target.select()} onChange={(e) => { const val = e.target.value; if (val === '') { handleLineChange(idx, 'unit_price', 0); } else { const num = parseFloat(val.replace(/[^\d.]/g, '')); if (!isNaN(num)) handleLineChange(idx, 'unit_price', num); } }} onBlur={(e) => { const val = e.target.value; if (val === '' || isNaN(parseFloat(val))) { handleLineChange(idx, 'unit_price', 0); } }} className="w-28 bg-[#0B0F19] border border-slate-800 rounded p-2 text-right text-white text-xs font-bold" />
                      </td>
                      <td className="px-6 py-4 text-right font-black text-sm text-slate-200">{formatRand(item.quantity * item.unit_price)}</td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => handleRemoveLine(idx)} className={`p-2 text-slate-700 hover:text-red-500 transition-colors ${lineItems.length === 1 ? 'opacity-0 pointer-events-none' : ''}`}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-8">
              <button type="button" onClick={handleAddLine} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-500 hover:text-white transition-colors"><Plus size={16} /> Add Line Item</button>
              <div className="w-full md:w-80 space-y-3 pt-6 border-t md:border-t-0 md:pt-0 border-slate-800">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500"><span>Subtotal</span><span className="font-bold">{formatRand(subtotal)}</span></div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500"><span>VAT (15%)</span><span className="font-bold">{formatRand(vatAmount)}</span></div>
                <div className="flex justify-between items-center py-4 border-t border-slate-800"><span className="text-xs font-black uppercase text-white">Total Value</span><span className="text-2xl font-black text-orange-500">{formatRand(total)}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
              <Calendar className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Settings</h2>
            </div>
            <div className="space-y-4">
              <DatePicker 
                label="Issue Date"
                value={formData.issue_date}
                onChange={(val) => handleFormFieldChange('issue_date', val)}
              />
              <DatePicker 
                label="Due Date"
                value={formData.due_date}
                onChange={(val) => handleFormFieldChange('due_date', val)}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reference</label>
                <input type="text" value={formData.reference} onChange={(e) => handleFormFieldChange('reference', e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium" />
              </div>
              <div className="space-y-2 pt-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Update Status</label>
                 <div className="relative">
                   <button
                     type="button"
                     onClick={() => setStatusOpen(!statusOpen)}
                     className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#151B28] ${
                       statusOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                     }`}
                   >
                     <span className="text-white">{formData.status}</span>
                     <ChevronDown size={14} className={`text-slate-500 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                   </button>
                   {statusOpen && (
<div className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] p-1">
                        {['Draft', 'Sent'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, status});
                              setStatusOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-bold text-sm uppercase tracking-widest ${
                              formData.status === status ? 'text-orange-500' : 'text-slate-300'
                            }`}
                         >
                           {status}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
              <FileText className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Notes</h2>
            </div>
            <div className="space-y-4">
              <textarea rows={3} value={formData.notes} onChange={(e) => handleFormFieldChange('notes', e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium resize-none" placeholder="Public notes..." />
              <textarea rows={3} value={formData.internal_notes} onChange={(e) => handleFormFieldChange('internal_notes', e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium resize-none border-dashed" placeholder="Internal notes..." />
            </div>
          </div>

          <div className="hidden lg:block">
            <button type="submit" disabled={loading} className="w-full py-5 bg-orange-500 hover:bg-orange-600 rounded-sm font-black text-sm uppercase tracking-[0.3em] text-white shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? <div className="border-2 border-white/30 border-t-white rounded-full animate-spin w-5 h-5" /> : <Save size={18} />} Update Invoice
            </button>
          </div>
          {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
        </div>
      </form>

      <DraftActionDock
        backHref={`/office/invoices/${initialInvoice.id}`}
        backLabel="Invoice"
        primaryLabel="Update Invoice"
        onSave={triggerSave}
        disabled={loading}
        loading={loading}
      />
    </div>
  );
}
