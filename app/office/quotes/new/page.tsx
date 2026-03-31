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
  FileText, 
  AlertCircle,
  Search,
  Check,
  ChevronDown,
  X,
  CreditCard,
  Percent,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';
import DraftActionDock from '@/components/office/DraftActionDock';
import { useAiDraft } from '@/components/office/AiDraftContext';
import { useActiveDocument } from '@/components/office/ActiveDocumentContext';
import { matchClient, sanitizeClientNameAi } from '@/lib/clients/clientMatching';

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export default function NewQuotePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    }>
      <NewQuoteContent />
    </Suspense>
  );
}

function NewQuoteContent() {
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
  const [quoteNumber, setQuoteNumber] = useState('QT-....');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const clientSearchRef = useRef<HTMLDivElement>(null);
  
  // Close client search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [includeVat, setIncludeVat] = useState(true);
  const [quoteValidityDays, setQuoteValidityDays] = useState(30);

  // Form State
  const [formData, setFormData] = useState({
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    expiry_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    notes: '',
    internal_notes: '',
    status: 'Draft'
  });
  const [statusOpen, setStatusOpen] = useState(false);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);

  const descriptionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    descriptionRefs.current.forEach((textarea, idx) => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });
  }, [lineItems]);

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
      const configuredValidity = Number(documentSettings.quote_validity_days);
      const nextValidity = Number.isFinite(configuredValidity) ? Math.max(1, Math.min(365, configuredValidity)) : 30;
      setQuoteValidityDays(nextValidity);
      setIncludeVat(documentSettings.always_include_vat !== false);
      setFormData((prev) => ({
        ...prev,
        expiry_date: format(addDays(new Date(`${prev.issue_date}T00:00:00`), nextValidity), 'yyyy-MM-dd'),
      }));

      // Get quote number from DB sequence (concurrency-safe)
      const { data: quoteNumber, error: numError } = await supabase.rpc('generate_quote_number');
      if (numError) {
        console.error('Failed to generate quote number:', numError);
      }
      const generatedNumber = quoteNumber || 'QT-0001';
      setQuoteNumber(generatedNumber);
    }
    init();
  }, [supabase]);

  const { draft, clearAiDraft } = useAiDraft();
  const { registerDocumentSession, clearDocumentSession, updateField, addLineItem, removeLineItem, updateLineItem, documentData } = useActiveDocument();

  // Handle AI Assistant Draft
  useEffect(() => {
    if (draft && draft.type === 'quote' && !fetchingClients) {
      const { clientName, lineItems: aiLineItems, notes } = draft.data;
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
            toast.success({ 
                title: "AI Draft Loaded", 
                message: `Matched client: ${matched.company_name}` 
            });
          } else {
            toast.info({ 
              title: "AI Draft Loaded", 
              message: `New client: "${sanitizedName}". Please select or create.` 
            });
            setSearchTerm(sanitizedName);
            updateField('clientName', sanitizedName);
          }
        });
      }

      // 2. Pre-populate Line Items
      if (aiLineItems && aiLineItems.length > 0) {
        setLineItems(nextLineItems);
      }

      // 3. Pre-populate Notes
      if (notes) {
        setFormData(prev => ({ ...prev, notes }));
        updateField('notes', notes);
      }

      registerDocumentSession({
        documentType: 'quote',
        documentId: null,
        documentData: {
          quoteNumber,
          documentNumber: quoteNumber,
          clientName: clientName ? sanitizeClientNameAi(clientName) : null,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
          reference: quoteNumber,
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
        },
        isOpen: true,
      });

      // Clear draft so it doesn't re-trigger
      clearAiDraft();
    }
  }, [clearAiDraft, draft, fetchingClients, formData.expiry_date, formData.internal_notes, formData.issue_date, formData.notes, formData.status, quoteNumber, registerDocumentSession, lineItems, toast, updateField]);

  useEffect(() => {
    return () => {
      clearDocumentSession();
    };
  }, [clearDocumentSession]);

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
      expiry_date: documentData.expiry_date || prev.expiry_date,
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
    setLineItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
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

  const handleFormFieldChange = useCallback((field: 'issue_date' | 'expiry_date' | 'notes' | 'internal_notes' | 'status', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    updateField(field, value);
  }, [updateField]);

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const filteredClients = clients.filter((c) =>
    (c.company_name || '').toLowerCase().includes(normalizedSearchTerm) ||
    (c.contact_person || '').toLowerCase().includes(normalizedSearchTerm)
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
      // 1. Insert Quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert([{
          client_id: selectedClient.id,
          quote_number: quoteNumber,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
          subtotal,
          vat_amount: vatAmount,
          total,
          status: formData.status,
          notes: formData.notes,
          internal_notes: formData.internal_notes
        }])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // 2. Insert Line Items
      const itemsToInsert = lineItems.map(item => ({
        quote_id: quote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('quote_line_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      router.push(`/office/quotes/${quote.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save quotation.");
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

  // Inline Client Creation States
  const [inlineClient, setInlineClient] = useState({ company: '', name: '', email: '' });
  const handleCreateClientInline = async () => {
    if (!inlineClient.company || !inlineClient.name || !inlineClient.email) return;
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          company_name: inlineClient.company,
          contact_person: inlineClient.name,
          email: inlineClient.email
        }])
        .select()
        .single();
      
      if (error) throw error;
      setClients([data, ...clients]);
      setSelectedClient(data);
      setIsClientModalOpen(false);
      setInlineClient({ company: '', name: '', email: '' });
    } catch (err: any) {
      toast.error({ title: 'Client Create Failed', message: err.message });
    }
  };

  const formatRand = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(val).replace('ZAR', 'R');
  };

  return (
    <div className="w-full space-y-10 pb-24">
      {statusOpen && (
        <div className="fixed inset-0 z-[99]" onClick={() => setStatusOpen(false)} />
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link
            href="/office/quotes"
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Registry
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">New Quote</h1>
            <span className="px-3 py-1 bg-slate-800 text-slate-400 font-black text-xs rounded border border-slate-700">
              {quoteNumber}
            </span>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Client selection */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-visible shadow-2xl">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="text-orange-500" size={18} />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Recipient Details</h2>
              </div>
              {!selectedClient && (
                <button 
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-white transition-colors"
                >
                  + Create New Client
                </button>
              )}
            </div>
            
            <div className="p-8">
              {selectedClient ? (
                <div className="flex items-center justify-between bg-[#0B0F19] p-6 rounded-lg border border-orange-500/20 shadow-inner">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <p className="font-black text-white uppercase tracking-tight text-lg">{selectedClient.company_name}</p>
                      <p className="text-slate-400 font-bold text-xs flex items-center gap-2">
                        <User size={12} className="text-slate-600" /> {selectedClient.contact_person}
                        <span className="text-slate-700">|</span>
                        <Mail size={12} className="text-slate-600" /> {selectedClient.email}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleClientSelect(null)}
                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/5 rounded transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div ref={clientSearchRef} className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input 
                    type="text"
                    placeholder="Search and select a client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 pl-12 text-white transition-all font-medium rounded-sm"
                  />
                  {searchTerm && filteredClients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#151B28] border border-slate-700 shadow-2xl rounded-lg z-50 max-h-60 overflow-y-auto overflow-x-hidden">
                      {filteredClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            handleClientSelect(client);
                            setSearchTerm('');
                          }}
                          className="w-full text-left p-4 hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0"
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

          {/* Section 3: Line Items */}
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
                          placeholder="e.g. Electrical Inspection & Commissioning"
                          className="w-full bg-[#0B0F19] border border-slate-800 rounded focus:ring-0 outline-none text-slate-200 text-sm font-medium"
                          rows={1}
                          style={{ minHeight: '2rem', height: 'auto', resize: 'none', overflow: 'hidden', paddingTop: '0.5rem', paddingBottom: '0.375rem', paddingLeft: '0.75rem' }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              handleLineChange(idx, 'quantity', 0);
                            } else {
                              const num = parseInt(val.replace(/\D/g, ''), 10);
                              if (!isNaN(num)) handleLineChange(idx, 'quantity', num);
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === '' || isNaN(parseInt(val, 10))) {
                              handleLineChange(idx, 'quantity', 1);
                            }
                          }}
                          className="w-16 bg-[#0B0F19] border border-slate-800 rounded p-2 text-center text-white text-xs font-bold outline-none focus:border-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={item.unit_price}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              handleLineChange(idx, 'unit_price', 0);
                            } else {
                              const num = parseFloat(val.replace(/[^\d.]/g, ''));
                              if (!isNaN(num)) handleLineChange(idx, 'unit_price', num);
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === '' || isNaN(parseFloat(val))) {
                              handleLineChange(idx, 'unit_price', 0);
                            }
                          }}
                          className="w-28 bg-[#0B0F19] border border-slate-800 rounded p-2 text-right text-white text-xs font-bold outline-none focus:border-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-black text-sm text-slate-200">
                        {formatRand(item.quantity * item.unit_price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className={`p-2 text-slate-700 hover:text-red-500 transition-colors ${lineItems.length === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-8">
              <button 
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-500 hover:text-white transition-colors"
              >
                <Plus size={16} /> Add Line Item
              </button>

              <div className="w-full md:w-96 md:ml-auto space-y-3 pt-6 border-t md:border-t-0 md:pt-0 border-slate-800">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Subtotal</span>
                <span className="font-bold text-right min-w-[120px]">{formatRand(subtotal)}</span>
              </div>
              <label className="flex items-center justify-between gap-3 text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Apply VAT (15%)</span>
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  className="h-4 w-4 accent-orange-500"
                />
              </label>
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">VAT (15%)</span>
                <span className="font-bold text-right min-w-[120px]">{formatRand(vatAmount)}</span>
              </div>
                <div className="flex justify-between items-center py-4 border-t border-slate-800">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Total Amount</span>
                  <span className="text-xl font-black text-orange-500 text-right min-w-[120px]">{formatRand(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Quote Settings */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-visible shadow-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
              <Calendar className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Dates & Status</h2>
            </div>

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
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Default validity: {quoteValidityDays} days</p>
            </div>

              <div className="space-y-2 pt-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Initial Status</label>
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
                       {['Draft', 'Sent', 'Accepted'].map((status) => (
                         <button
                           key={status}
                           type="button"
                           onClick={() => {
                             handleFormFieldChange('status', status);
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

          {/* Notes */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
              <FileText className="text-orange-500" size={18} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Additional Notes</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Public Note (on PDF)</label>
                <textarea 
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleFormFieldChange('notes', e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium outline-none resize-none"
                  placeholder="Terms and conditions, lead times..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Internal Notes (Private)</label>
                <textarea 
                  rows={3}
                  value={formData.internal_notes}
                  onChange={(e) => handleFormFieldChange('internal_notes', e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium outline-none resize-none"
                  placeholder="Private context for this quote..."
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="hidden lg:flex w-full py-5 bg-orange-500 hover:bg-orange-600 rounded-sm font-black text-sm uppercase tracking-[0.3em] text-white shadow-xl shadow-orange-500/20 transition-all items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (
              <>
                <Save size={18} /> Save Quotation
              </>
            )}
          </button>
          
          {error && (
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </p>
          )}
        </div>
      </form>

      <DraftActionDock
        backHref="/office/quotes"
        backLabel="Quotes"
        primaryLabel="Save Quote"
        onSave={triggerSave}
        disabled={loading}
        loading={loading}
      />

      {/* Inline Client Modal */}
      <AnimatePresence>
        {isClientModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClientModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#151B28] border border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-widest text-xs">Quick Create Client</h3>
                <button onClick={() => setIsClientModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company Name</label>
                   <input 
                      value={inlineClient.company}
                      onChange={(e) => setInlineClient({...inlineClient, company: e.target.value})}
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Name</label>
                   <input 
                      value={inlineClient.name}
                      onChange={(e) => setInlineClient({...inlineClient, name: e.target.value})}
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                   <input 
                      type="email"
                      value={inlineClient.email}
                      onChange={(e) => setInlineClient({...inlineClient, email: e.target.value})}
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded p-3 text-white text-xs font-medium"
                   />
                </div>
                <button 
                  onClick={handleCreateClientInline}
                  className="w-full py-4 bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-sm hover:bg-orange-600 transition-all"
                >
                  Create & Select
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
