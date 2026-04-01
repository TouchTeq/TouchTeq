'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

const CN_STATUSES = ['Draft', 'Sent', 'Issued', 'Applied', 'Cancelled'];
const CREDIT_REASONS = ['Incorrect Amount', 'Returned Equipment', 'Disputed Charges', 'Duplicate Invoice', 'Other'];

export default function NewCreditNotePage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const [formData, setFormData] = useState({
    reason: '',
    notes: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'Draft',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('company_name');
      setClients(data || []);
      setFetchingClients(false);
    }
    fetchClients();
  }, [supabase]);

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const vat_amount = subtotal * 0.15;
    const total = subtotal + vat_amount;
    return { subtotal, vat_amount, total };
  }, [lineItems]);

  const handleAddLine = () => {
    setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleLineChange = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        item.total = Number(item.quantity) * Number(item.unit_price);
      }
      newItems[index] = item;
      return newItems;
    });
  };

  const handleClientSelect = useCallback((client: any | null) => {
    setSelectedClient(client);
    setSearchTerm(client?.company_name || '');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      setError('Please select a client.');
      return;
    }
    if (!formData.reason) {
      setError('Please select a reason for the credit note.');
      return;
    }
    if (lineItems.some(item => !item.description || item.unit_price <= 0)) {
      setError('Please fill in all line item descriptions and prices.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const itemsJson = lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { data: result, error: rpcError } = await supabase.rpc('create_credit_note_with_items', {
        p_client_id: selectedClient.id,
        p_line_items: itemsJson,
        p_reason: formData.reason,
        p_notes: formData.notes || null,
        p_issue_date: formData.issue_date,
        p_status: formData.status,
      });

      if (rpcError || !result) throw new Error(rpcError?.message || 'Credit note creation failed');

      toast.success({ title: 'Saved', message: `Credit Note ${result.document_number} created successfully.` });
      router.push(`/office/credit-notes/${result.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save credit note.');
      setLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const filteredClients = clients.filter(c =>
    (c.company_name || '').toLowerCase().includes(normalizedSearchTerm) ||
    (c.contact_person || '').toLowerCase().includes(normalizedSearchTerm)
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount).replace('ZAR', 'R');

  return (
    <div className="w-full space-y-10 pb-24">
      {statusOpen && <div className="fixed inset-0 z-[99]" onClick={() => setStatusOpen(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/office/credit-notes" className="p-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">New Credit Note</h1>
            <p className="text-slate-500 text-sm">Create a credit note for a client</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* Client Selection */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
        <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Client *</h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setSelectedClient(null); }}
            onFocus={() => {}}
            placeholder="Search clients..."
            className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-slate-600"
          />
          {searchTerm && !selectedClient && (
            <div className="absolute z-10 mt-1 w-full bg-[#0B0F19] border border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No clients found</div>
              ) : (
                filteredClients.map(client => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleClientSelect(client)}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-medium text-white">{client.company_name}</span>
                    {client.contact_person && <span className="text-slate-500 ml-2">— {client.contact_person}</span>}
                  </button>
                ))
              )}
            </div>
          )}
          {selectedClient && (
            <div className="mt-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="text-sm text-emerald-400 font-medium">{selectedClient.company_name}</span>
              <button type="button" onClick={() => { setSelectedClient(null); setSearchTerm(''); }} className="ml-2 text-slate-500 hover:text-white">
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
        <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DatePicker
            label="Issue Date"
            value={formData.issue_date}
            onChange={val => setFormData(prev => ({ ...prev, issue_date: val }))}
          />
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Reason *</label>
            <select
              value={formData.reason}
              onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="">Select reason...</option>
              {CREDIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="relative">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Status</label>
            <button
              type="button"
              onClick={() => setStatusOpen(!statusOpen)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm text-left flex items-center justify-between"
            >
              {formData.status}
              <span className="text-slate-500">▼</span>
            </button>
            {statusOpen && (
              <div className="absolute z-10 mt-1 w-full bg-[#0B0F19] border border-slate-800 rounded-lg shadow-xl">
                {CN_STATUSES.map(s => (
                  <button key={s} type="button" onClick={() => { setFormData(prev => ({ ...prev, status: s })); setStatusOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes..."
            rows={2}
            className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black uppercase text-slate-500">Line Items</h2>
          <button type="button" onClick={handleAddLine} className="flex items-center gap-1 text-xs font-black uppercase text-orange-500 hover:text-orange-400">
            <Plus size={14} /> Add Item
          </button>
        </div>
        <div className="space-y-3">
          {lineItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                value={item.description}
                onChange={e => handleLineChange(idx, 'description', e.target.value)}
                placeholder="Description"
                className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={e => handleLineChange(idx, 'quantity', Number(e.target.value))}
                placeholder="Qty"
                className="w-20 bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm text-right"
              />
              <input
                type="number"
                value={item.unit_price}
                onChange={e => handleLineChange(idx, 'unit_price', Number(e.target.value))}
                placeholder="Price"
                className="w-32 bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm text-right"
              />
              <span className="w-28 text-right text-sm font-bold text-white">{formatCurrency(item.total)}</span>
              <button type="button" onClick={() => handleRemoveLine(idx)} className="text-slate-500 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="text-white font-bold">{formatCurrency(totals.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">VAT (15%)</span><span className="text-white font-bold">{formatCurrency(totals.vat_amount)}</span></div>
            <div className="flex justify-between border-t border-slate-800 pt-2"><span className="text-white font-black uppercase">Total</span><span className="text-white font-black">{formatCurrency(totals.total)}</span></div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit as any}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          Save Credit Note
        </button>
      </div>
    </div>
  );
}
