'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Calendar, 
  FileText, 
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import DraftActionDock from '@/components/office/DraftActionDock';
import { useAiDraft } from '@/components/office/AiDraftContext';
import { useActiveDocument } from '@/components/office/ActiveDocumentContext';
import { DatePicker } from '@/components/ui/DatePicker';

export default function EditQuoteClient({ quote, initialLineItems, clients }: any) {
  const router = useRouter();
  const supabase = createClient();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States
  const [selectedClient, setSelectedClient] = useState<any>(quote.clients);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    issue_date: quote.issue_date,
    expiry_date: quote.expiry_date,
    notes: quote.notes || '',
    internal_notes: quote.internal_notes || '',
    status: quote.status
  });

  const [lineItems, setLineItems] = useState<any[]>(initialLineItems);
  const { clearAiDraft } = useAiDraft();
  const { registerDocumentSession, clearDocumentSession, updateField, addLineItem, removeLineItem, updateLineItem, documentData } = useActiveDocument();

  useEffect(() => {
    registerDocumentSession({
      documentType: 'quote',
      documentId: quote.id,
      documentData: {
        clientName: quote.clients?.company_name ?? null,
        clientId: quote.clients?.id ?? null,
        issue_date: quote.issue_date,
        expiry_date: quote.expiry_date,
        notes: quote.notes || '',
        internal_notes: quote.internal_notes || '',
        status: quote.status,
        lineItems: initialLineItems.map((item: any) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          total: Number(item.line_total || item.quantity * item.unit_price),
          line_total: Number(item.line_total || item.quantity * item.unit_price),
        })),
      },
      isOpen: true,
    });
    return () => clearDocumentSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearDocumentSession, registerDocumentSession, quote.id]);

  // Handle updates from AI Assistant (Live Session)
  useEffect(() => {
    if (!documentData) return;

    setFormData((prev) => ({
      ...prev,
      issue_date: documentData.issue_date || prev.issue_date,
      expiry_date: documentData.expiry_date || prev.expiry_date,
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
        line_total: Number(item.total ?? item.line_total ?? (Number(item.quantity) || 1) * (Number(item.unitPrice ?? item.unit_price) || 0)),
      })));
    }
  }, [documentData]);

  // Calculations
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  }, [lineItems]);

  const vatAmount = subtotal * 0.15;
  const total = subtotal + vatAmount;

  // Handlers
  const handleAddLine = () => {
    const newItem = { description: '', quantity: 1, unit_price: 0, line_total: 0 };
    setLineItems([...lineItems, newItem]);
    addLineItem({ ...newItem, unitPrice: 0 });
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
    removeLineItem(index);
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    const item = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      item.line_total = Number(item.quantity) * Number(item.unit_price);
    }
    newItems[index] = item;
    setLineItems(newItems);
    updateLineItem(index, field === 'unit_price' ? 'unitPrice' : field, value);
  };

  const handleFormFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updateField(field, value);
  };

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    updateField('clientName', client?.company_name ?? null);
  };

  const filteredClients = clients.filter((c: any) => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      setError("Please select a client.");
      return;
    }
    if (lineItems.some(item => !item.description || item.unit_price <= 0)) {
       setError("Please fill in all line item descriptions and prices.");
       return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Update Quote
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          client_id: selectedClient.id,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
          subtotal,
          vat_amount: vatAmount,
          total,
          status: formData.status,
          notes: formData.notes,
          internal_notes: formData.internal_notes
        })
        .eq('id', quote.id);

      if (quoteError) throw quoteError;

      // 2. Refresh Line Items (Delete and Re-insert is simplest for this scale)
      await supabase.from('quote_line_items').delete().eq('quote_id', quote.id);

      const itemsToInsert = lineItems.map(item => ({
        quote_id: quote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total
      }));

      const { error: itemsError } = await supabase.from('quote_line_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      router.push(`/office/quotes/${quote.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update quotation.");
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

  return (
    <div className="w-full space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link 
            href={`/office/quotes/${quote.id}`}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Detail
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Edit Quote</h1>
            <span className="px-3 py-1 bg-slate-800 text-slate-400 font-black text-xs rounded border border-slate-700">
              {quote.quote_number}
            </span>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Client select */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-8">
            {selectedClient ? (
              <div className="flex items-center justify-between bg-[#0B0F19] p-6 rounded-lg border border-orange-500/20 shadow-inner">
                <div className="flex items-center gap-6">
                  <Building2 size={24} className="text-orange-500" />
                  <div>
                    <p className="font-black text-white uppercase tracking-tight text-lg">{selectedClient.company_name}</p>
                    <p className="text-slate-400 font-bold text-xs">{selectedClient.contact_person} • {selectedClient.email}</p>
                  </div>
                </div>
                <button type="button" onClick={() => handleClientSelect(null)} className="p-2 text-slate-600 hover:text-red-500 rounded"><X size={18} /></button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text"
                  placeholder="Change client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 pl-12 text-white font-medium rounded-sm"
                />
                {searchTerm && filteredClients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#151B28] border border-slate-700 shadow-2xl rounded-lg z-50 max-h-60 overflow-y-auto">
                    {filteredClients.map((client: any) => (
                      <button key={client.id} type="button" onClick={() => { handleClientSelect(client); setSearchTerm(''); }} className="w-full text-left p-4 hover:bg-slate-800 border-b border-slate-800/50">
                        <p className="font-black text-white text-xs uppercase tracking-widest">{client.company_name}</p>
                        <p className="text-slate-500 text-[10px] font-bold">{client.contact_person}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
              <FileText className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Line Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-slate-800/50">
                    <th className="px-8 py-4 w-1/2">Description</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="bg-[#0B0F19]/20">
                      <td className="px-8 py-4">
                        <textarea 
                          required
                          value={item.description}
                          onChange={(e) => {
                            handleLineChange(idx, 'description', e.target.value);
                            setTimeout(() => {
                              const textarea = document.getElementById(`quote-desc-${idx}`);
                              if (textarea) {
                                textarea.style.height = 'auto';
                                textarea.style.height = textarea.scrollHeight + 'px';
                              }
                            }, 0);
                          }}
                          id={`quote-desc-${idx}`}
                          className="w-full bg-[#0B0F19] border border-slate-800 rounded focus:ring-0 outline-none text-slate-200 text-sm font-medium"
                          rows={1}
                          style={{ minHeight: '2rem', height: 'auto', resize: 'none', overflow: 'hidden', paddingTop: '0.5rem', paddingBottom: '0.375rem', paddingLeft: '0.75rem' }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="text" inputMode="numeric" value={item.quantity} onFocus={(e) => e.target.select()} onChange={(e) => { const val = e.target.value; if (val === '') { handleLineChange(idx, 'quantity', 0); } else { const num = parseInt(val.replace(/\D/g, ''), 10); if (!isNaN(num)) handleLineChange(idx, 'quantity', num); } }} onBlur={(e) => { const val = e.target.value; if (val === '' || isNaN(parseInt(val, 10))) { handleLineChange(idx, 'quantity', 1); } }} className="w-16 bg-[#0B0F19] border border-slate-800 rounded p-2 text-center text-white text-xs font-bold" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="text" inputMode="decimal" value={item.unit_price} onFocus={(e) => e.target.select()} onChange={(e) => { const val = e.target.value; if (val === '') { handleLineChange(idx, 'unit_price', 0); } else { const num = parseFloat(val.replace(/[^\d.]/g, '')); if (!isNaN(num)) handleLineChange(idx, 'unit_price', num); } }} onBlur={(e) => { const val = e.target.value; if (val === '' || isNaN(parseFloat(val))) { handleLineChange(idx, 'unit_price', 0); } }} className="w-28 bg-[#0B0F19] border border-slate-800 rounded p-2 text-right text-white text-xs font-bold" />
                      </td>
                      <td className="px-6 py-4 text-right font-black text-sm text-slate-200">
                        {formatRand(item.quantity * item.unit_price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => handleRemoveLine(idx)} className="text-slate-700 hover:text-red-500"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-8">
              <button type="button" onClick={handleAddLine} className="text-xs font-black uppercase tracking-widest text-orange-500 hover:text-white flex items-center gap-2"><Plus size={16} /> Add Line Item</button>
              <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>Subtotal</span><span>{formatRand(subtotal)}</span></div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-white border-t border-slate-800 pt-4"><span>Total Amount</span><span className="text-xl font-black text-orange-500">{formatRand(total)}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-6">
            <div className="space-y-4">
              <DatePicker 
                label="Issue Date"
                value={formData.issue_date}
                onChange={(val) => handleFormFieldChange('issue_date', val)}
              />
              <DatePicker 
                label="Expiry Date"
                value={formData.expiry_date}
                onChange={(val) => handleFormFieldChange('expiry_date', val)}
              />
            </div>
          </div>
          <div className="hidden lg:block">
            <button type="submit" disabled={loading} className="w-full py-5 bg-orange-500 hover:bg-orange-600 rounded-sm font-black text-sm uppercase tracking-[0.3em] text-white shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3">
              {loading ? 'Updating...' : <><Save size={18} /> Update Quote</>}
            </button>
          </div>
          {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
        </div>
      </form>

      <DraftActionDock
        backHref={`/office/quotes/${quote.id}`}
        backLabel="Quote"
        primaryLabel="Update Quote"
        onSave={triggerSave}
        disabled={loading}
        loading={loading}
      />
    </div>
  );
}
