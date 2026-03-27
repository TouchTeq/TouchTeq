'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Calendar, 
  Receipt, 
  AlertCircle,
  Search,
  X,
  Hash,
  FileText,
  ChevronDown,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import DraftActionDock from '@/components/office/DraftActionDock';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { useAiDraft } from '@/components/office/AiDraftContext';
import { useActiveDocument } from '@/components/office/ActiveDocumentContext';
import { matchClient, sanitizeClientNameAi } from '@/lib/clients/clientMatching';
import { DatePicker } from '@/components/ui/DatePicker';

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    }>
      <NewInvoiceContent />
    </Suspense>
  );
}

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const toast = useOfficeToast();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('INV-....');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);
  const [includeVat, setIncludeVat] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    reference: '',
    notes: '',
    internal_notes: '',
    status: 'Draft'
  });
  const [statusOpen, setStatusOpen] = useState(false);
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [recurringStartDate, setRecurringStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringAutoSend, setRecurringAutoSend] = useState(false);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);

  // Load Initial Data
  useEffect(() => {
    async function init() {
      // Fetch Clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('company_name');
      setClients(clientsData || []);
      setFetchingClients(false);

      const { data: profileData } = await supabase
        .from('business_profile')
        .select('document_settings')
        .single();
      const documentSettings = profileData?.document_settings || {};
      const configuredTerms = Number(documentSettings.default_payment_terms_days ?? documentSettings.invoice_payment_terms_days);
      const nextTerms = Number.isFinite(configuredTerms) ? Math.max(1, Math.min(365, configuredTerms)) : 30;
      setPaymentTermsDays(nextTerms);
      setIncludeVat(documentSettings.always_include_vat !== false);
      setFormData((prev) => ({
        ...prev,
        due_date: format(addDays(new Date(`${prev.issue_date}T00:00:00`), nextTerms), 'yyyy-MM-dd'),
      }));

      // Sequential Numbering
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });
      
      const nextNum = (count || 0) + 1;
      setInvoiceNumber(`INV-${String(nextNum).padStart(4, '0')}`);
    }
    init();
  }, [supabase]);

  const { draft, clearAiDraft } = useAiDraft();
  const { registerDocumentSession, clearDocumentSession, updateField, addLineItem, removeLineItem, updateLineItem, documentData } = useActiveDocument();

  // Handle AI Assistant Draft
  useEffect(() => {
    if (draft && draft.type === 'invoice' && !fetchingClients) {
      const { clientName, lineItems: aiLineItems, invoiceDate, dueDate, notes } = draft.data;
      const nextLineItems = (aiLineItems && aiLineItems.length > 0)
        ? aiLineItems.map((item: any) => ({
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_price: item.unitPrice || 0,
            total: (item.quantity || 1) * (item.unitPrice || 0)
          }))
        : lineItems;
      
      // 1. Sanitize & Match Client
      if (clientName) {
        const sanitizedName = sanitizeClientNameAi(clientName);
        matchClient(sanitizedName).then(matched => {
          if (matched) {
            setSelectedClient(matched);
            updateField('clientName', matched.company_name);
            toast.success({ title: "AI Draft Loaded", message: `Matched client: ${matched.company_name}` });
          } else {
            toast.info({ title: "AI Draft Loaded", message: `New client detected: "${sanitizedName}"` });
            setSearchTerm(sanitizedName);
            updateField('clientName', sanitizedName);
          }
        });
      }

      // 2. Dates
      if (invoiceDate || dueDate) {
        setFormData(prev => ({
          ...prev,
          issue_date: invoiceDate || prev.issue_date,
          due_date: dueDate || prev.due_date
        }));
        if (invoiceDate) updateField('issue_date', invoiceDate);
        if (dueDate) updateField('due_date', dueDate);
      }

      // 3. Pre-populate Line Items
      if (aiLineItems && aiLineItems.length > 0) {
        setLineItems(nextLineItems);
      }

      // 4. Pre-populate Notes
      if (notes) {
        setFormData(prev => ({ ...prev, notes }));
        updateField('notes', notes);
      }

      registerDocumentSession({
        documentType: 'invoice',
        documentId: null,
        documentData: {
          clientName: clientName ? sanitizeClientNameAi(clientName) : null,
          issue_date: invoiceDate || formData.issue_date,
          due_date: dueDate || formData.due_date,
          reference: invoiceNumber,
          notes: notes || formData.notes,
          internal_notes: formData.internal_notes,
          status: formData.status,
          lineItems: nextLineItems.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            total: item.total,
            line_total: item.total,
          })),
          subtotal: nextLineItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price)), 0),
          vatAmount: includeVat ? nextLineItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price)), 0) * 0.15 : 0,
          total: includeVat ? nextLineItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price)), 0) * 1.15 : nextLineItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price)), 0),
          invoiceNumber,
        },
        isOpen: true,
      });

      // Clear draft
      clearAiDraft();
    }
  }, [clearAiDraft, draft, fetchingClients, formData, includeVat, invoiceNumber, lineItems, registerDocumentSession, toast, updateField]);

  useEffect(() => {
    if (!documentData) {
      return;
    }

    const nextClientName = documentData.clientName ?? null;
    if (nextClientName) {
      const matchedClient = clients.find((client) => String(client.company_name || '').toLowerCase() === String(nextClientName).toLowerCase());
      if (matchedClient && matchedClient.id !== selectedClient?.id) {
        setSelectedClient(matchedClient);
      } else if (!matchedClient && searchTerm !== nextClientName) {
        setSearchTerm(nextClientName);
      }
    }

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
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unitPrice ?? item.unit_price) || 0,
        total: Number(item.total ?? item.line_total ?? (Number(item.quantity) || 1) * (Number(item.unitPrice ?? item.unit_price) || 0)),
      })));
    }
  }, [clients, documentData, searchTerm, selectedClient?.id]);

  useEffect(() => {
    return () => {
      clearDocumentSession();
    };
  }, [clearDocumentSession]);

  // Calculations
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  }, [lineItems]);

  const vatAmount = includeVat ? subtotal * 0.15 : 0;
  const total = subtotal + vatAmount;

  // Handlers
  const handleAddLine = () => {
    setLineItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
    addLineItem({ description: '', quantity: 1, unitPrice: 0, total: 0, line_total: 0 });
  };

  const handleRemoveLine = (index: number) => {
    setLineItems((prev) => {
      if (prev.length === 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    removeLineItem(index);
  };

  const handleLineChange = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        item.total = Number(item.quantity) * Number(item.unit_price);
      }
      newItems[index] = item;
      return newItems;
    });
    updateLineItem(index, field === 'unit_price' ? 'unitPrice' : field, value);
  };

  const handleClientSelect = useCallback((client: any | null) => {
    setSelectedClient(client);
    updateField('clientName', client?.company_name ?? null);
  }, [updateField]);

  const handleFormFieldChange = useCallback((field: 'issue_date' | 'due_date' | 'reference' | 'notes' | 'internal_notes' | 'status', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    updateField(field, value);
  }, [updateField]);

  const filteredClients = clients.filter(c => 
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
      // 1. Insert Invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert([{
          client_id: selectedClient.id,
          invoice_number: invoiceNumber,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          subtotal,
          vat_amount: vatAmount,
          total,
          status: formData.status,
          notes: formData.notes,
          internal_notes: formData.internal_notes,
          amount_paid: 0,
          is_recurring: isRecurring,
          recurring_frequency: isRecurring ? recurringFrequency : null,
          recurring_start_date: isRecurring ? recurringStartDate : null,
          recurring_end_date: isRecurring && recurringEndDate ? recurringEndDate : null,
          recurring_auto_send: isRecurring ? recurringAutoSend : false,
          recurring_next_date: isRecurring ? recurringStartDate : null
        }])
        .select()
        .single();

      if (invError) throw invError;

      // 2. Insert Line Items
      const itemsToInsert = lineItems.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('invoice_line_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      router.push(`/office/invoices/${invoice.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save invoice.");
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
            href="/office/invoices"
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Registry
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">New Invoice</h1>
            <span className="px-3 py-1 bg-slate-800 text-slate-400 font-black text-xs rounded border border-slate-700">
              {invoiceNumber}
            </span>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Client Selection */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="text-orange-500" size={18} />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Client Details</h2>
              </div>
            </div>
            
            <div className="p-8">
              {selectedClient ? (
                <div className="flex items-center justify-between bg-[#0B0F19] p-6 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 italic font-black text-xl">
                      {selectedClient.company_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-white uppercase tracking-tight text-lg">{selectedClient.company_name}</p>
                      <p className="text-slate-400 font-bold text-xs flex items-center gap-2 mt-1">
                        {selectedClient.contact_person} • {selectedClient.email}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleClientSelect(null)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input 
                    type="text"
                    placeholder="Search and select a client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 pl-12 text-white font-medium rounded-sm"
                  />
                  {searchTerm && filteredClients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#151B28] border border-slate-700 shadow-2xl rounded-lg z-50 max-h-60 overflow-y-auto">
                      {filteredClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => { handleClientSelect(client); setSearchTerm(''); }}
                          className="w-full text-left p-4 hover:bg-slate-800 transition-colors border-b border-slate-800/50"
                        >
                          <p className="font-black text-white text-xs uppercase tracking-widest">{client.company_name}</p>
                          <p className="text-slate-500 text-[10px] font-bold">{client.contact_person} • {client.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
              <Receipt className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Invoice Items</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[9px] uppercase font-bold tracking-[0.2em] border-b border-slate-800/50">
                    <th className="px-8 py-4 w-1/2">Description</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Unit Price (R)</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="bg-[#0B0F19]/20 group">
                      <td className="px-8 py-4">
                        <textarea 
                          required
                          value={item.description}
                          onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                          placeholder="e.g. Electrical Installation & Wiring"
                          className="w-full bg-transparent border-none outline-none text-slate-200 text-sm font-medium resize-none"
                          rows={1}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input type="number" min="1" value={item.quantity} onChange={(e) => handleLineChange(idx, 'quantity', parseInt(e.target.value) || 1)} className="w-16 bg-[#0B0F19] border border-slate-800 rounded p-2 text-center text-white text-xs font-bold" />
                      </td>
                      <td className="px-6 py-4">
                        <input type="number" step="0.01" value={item.unit_price} onFocus={(e) => e.target.select()} onChange={(e) => handleLineChange(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="w-28 bg-[#0B0F19] border border-slate-800 rounded p-2 text-right text-white text-xs font-bold" />
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
                <label className="flex items-center justify-between gap-3 text-[10px] font-black uppercase text-slate-500">
                  <span>Apply VAT (15%)</span>
                  <input
                    type="checkbox"
                    checked={includeVat}
                    onChange={(e) => setIncludeVat(e.target.checked)}
                    className="h-4 w-4 accent-orange-500"
                  />
                </label>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500"><span>VAT (15%)</span><span className="font-bold">{formatRand(vatAmount)}</span></div>
                <div className="flex justify-between items-center py-4 border-t border-slate-800"><span className="text-xs font-black uppercase text-white">Grand Total</span><span className="text-2xl font-black text-orange-500">{formatRand(total)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
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
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Default terms: {paymentTermsDays} days</p>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">PO / Reference</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input type="text" value={formData.reference} onChange={(e) => handleFormFieldChange('reference', e.target.value)} placeholder="Optional reference..." className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 pl-10 text-white text-xs font-medium" />
                </div>
              </div>
              <div className="space-y-2 pt-4">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Initial Status</label>
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
                     <div className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-700 rounded-lg shadow-xl z-50">
                       {['Draft', 'Sent'].map((status) => (
                         <button
                           key={status}
                           type="button"
                           onClick={() => {
                             handleFormFieldChange('status', status);
                             setStatusOpen(false);
                           }}
                           className={`w-full px-4 py-2.5 text-left hover:bg-[#0B0F19] transition-colors font-bold text-sm uppercase tracking-widest ${
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

               {/* Recurring Invoice Toggle */}
               <div className="space-y-3 pt-4 border-t border-slate-800/50">
                 <div className="flex items-center justify-between">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Make Recurring</label>
                   <button
                     type="button"
                     onClick={() => setIsRecurring(!isRecurring)}
                     className={`relative w-11 h-6 rounded-full transition-colors ${isRecurring ? 'bg-orange-500' : 'bg-slate-700'}`}
                   >
                     <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isRecurring ? 'left-6' : 'left-1'}`} />
                   </button>
                 </div>
                 
                 {isRecurring && (
                   <div className="space-y-3 pt-2">
                     <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Frequency</label>
                       <select
                         value={recurringFrequency}
                         onChange={(e) => setRecurringFrequency(e.target.value)}
                         className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-white text-xs"
                       >
                         <option value="weekly">Weekly</option>
                         <option value="monthly">Monthly</option>
                         <option value="quarterly">Quarterly</option>
                         <option value="annually">Annually</option>
                       </select>
                     </div>
                      <DatePicker 
                        label="Start Date"
                        value={recurringStartDate}
                        onChange={setRecurringStartDate}
                      />
                      <DatePicker 
                        label="End Date (optional)"
                        value={recurringEndDate}
                        onChange={setRecurringEndDate}
                      />
                     <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Auto-send</span>
                       <button
                         type="button"
                         onClick={() => setRecurringAutoSend(!recurringAutoSend)}
                         className={`relative w-11 h-6 rounded-full transition-colors ${recurringAutoSend ? 'bg-green-500' : 'bg-slate-700'}`}
                       >
                         <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${recurringAutoSend ? 'left-6' : 'left-1'}`} />
                       </button>
                     </div>
                     <p className="text-[9px] text-slate-500">
                       {recurringAutoSend ? 'Automatically sent to client on schedule' : 'Creates draft for review'}
                     </p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
              <FileText className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Notes</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <textarea rows={3} value={formData.notes} onChange={(e) => handleFormFieldChange('notes', e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium resize-none" placeholder="Public notes on invoice..." />
              <textarea rows={3} value={formData.internal_notes} onChange={(e) => handleFormFieldChange('internal_notes', e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium border-dashed" placeholder="Internal private context..." />
            </div>
          </div>

          <div className="hidden lg:block">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-orange-500 hover:bg-orange-600 rounded-sm font-black text-sm uppercase tracking-[0.3em] text-white shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Create Tax Invoice</>}
            </button>
          </div>
          {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
        </div>
      </form>

      <DraftActionDock
        backHref="/office/invoices"
        backLabel="Invoices"
        primaryLabel="Save Invoice"
        onSave={triggerSave}
        disabled={loading}
        loading={loading}
      />
    </div>
  );
}
