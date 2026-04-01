'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Lock, Save, Trash2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { useActiveDocument } from '@/components/office/ActiveDocumentContext';

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

const CREDIT_REASONS = ['Incorrect Amount', 'Returned Equipment', 'Disputed Charges', 'Duplicate Invoice', 'Other'];

export default function EditCreditNoteClient({
  initialCreditNote,
  clients,
}: {
  initialCreditNote: any;
  clients: any[];
}) {
  const router = useRouter();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(initialCreditNote.clients || null);
  const [searchTerm, setSearchTerm] = useState(initialCreditNote.clients?.company_name || '');

  const [formData, setFormData] = useState({
    reason: initialCreditNote.reason || '',
    notes: initialCreditNote.notes || '',
    issue_date: initialCreditNote.issue_date || '',
    status: initialCreditNote.status || 'Draft',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    (initialCreditNote.credit_note_items || []).map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.line_total || item.quantity * item.unit_price),
    }))
  );
  const { registerDocumentSession, clearDocumentSession, updateField, addLineItem, removeLineItem, updateLineItem, documentData } = useActiveDocument();

  useEffect(() => {
    registerDocumentSession({
      documentType: 'credit_note',
      documentId: initialCreditNote.id,
      documentData: {
        documentNumber: initialCreditNote.credit_note_number,
        clientId: initialCreditNote.client_id || initialCreditNote.clients?.id || null,
        reason: initialCreditNote.reason || '',
        notes: initialCreditNote.notes || '',
        issue_date: initialCreditNote.issue_date || '',
        status: initialCreditNote.status || 'Draft',
        lineItems: (initialCreditNote.credit_note_items || []).map((item: any) => ({
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
  }, [clearDocumentSession, registerDocumentSession, initialCreditNote.id]);

  useEffect(() => {
    if (!documentData) return;

    setFormData((prev) => ({
      ...prev,
      reason: documentData.reason ?? prev.reason,
      notes: documentData.notes ?? prev.notes,
      issue_date: documentData.issue_date ?? prev.issue_date,
      status: documentData.status ?? prev.status,
    }));

    if (documentData.clientId && (!selectedClient || selectedClient.id !== documentData.clientId)) {
      const nextClient = clients.find((c) => c.id === documentData.clientId);
      if (nextClient) {
        setSelectedClient(nextClient);
        setSearchTerm(nextClient.company_name || '');
      }
    }

    if (Array.isArray(documentData.lineItems)) {
      setLineItems(documentData.lineItems.map((item: any) => ({
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unitPrice ?? item.unit_price) || 0,
        total: Number(item.total ?? item.line_total ?? (Number(item.quantity) || 1) * (Number(item.unitPrice ?? item.unit_price) || 0)),
      })));
    }
  }, [clients, documentData, selectedClient]);

  if (initialCreditNote.status !== 'Draft') {
    return (
      <div className="w-full py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
          <Lock size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Credit Note Locked</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
          Only Draft credit notes can be edited to maintain financial integrity.
        </p>
        <Link href="/office/invoices?tab=credit-notes" className="inline-block text-orange-500 font-black text-xs uppercase tracking-[0.2em] border-b border-orange-500/30 pb-1 mt-8">
          Go Back to Credit Notes
        </Link>
      </div>
    );
  }

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const vat_amount = subtotal * 0.15;
    const total = subtotal + vat_amount;
    return { subtotal, vat_amount, total };
  }, [lineItems]);

  const handleAddLine = () => {
    setLineItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
    addLineItem({ description: '', quantity: 1, unitPrice: 0, total: 0 });
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((_, i) => i !== index));
      removeLineItem(index);
    }
  };

  const handleLineChange = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        item.total = Number(item.quantity) * Number(item.unit_price);
      }
      next[index] = item;
      return next;
    });
    updateLineItem(index, field === 'unit_price' ? 'unitPrice' : field, value);
  };

  const handleClientSelect = useCallback((client: any | null) => {
    setSelectedClient(client);
    setSearchTerm(client?.company_name || '');
    updateField('clientId', client?.id || null);
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
    if (lineItems.some((item) => !item.description || item.unit_price <= 0)) {
      setError('Please fill in all line item descriptions and prices.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const itemsJson = lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const response = await fetch(`/api/office/credit-notes/${initialCreditNote.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          reason: formData.reason,
          notes: formData.notes,
          issue_date: formData.issue_date,
          status: formData.status,
          line_items: itemsJson,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Credit note update failed');
      }

      toast.success({ title: 'Saved', message: `Credit Note ${result.creditNote?.credit_note_number} updated.` });
      router.push('/office/invoices?tab=credit-notes');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save credit note.');
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const filteredClients = clients.filter((c) =>
    (c.company_name || '').toLowerCase().includes(normalizedSearchTerm) ||
    (c.contact_person || '').toLowerCase().includes(normalizedSearchTerm)
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount).replace('ZAR', 'R');

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-10 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/office/invoices?tab=credit-notes" className="p-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Edit Credit Note</h1>
            <p className="text-slate-500 text-sm">{initialCreditNote.credit_note_number}</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 text-xs font-black uppercase bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
        <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Client *</h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedClient(null); }}
            placeholder="Search clients..."
            className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-slate-600"
          />
          {searchTerm && !selectedClient && (
            <div className="absolute z-10 mt-1 w-full bg-[#0B0F19] border border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No clients found</div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleClientSelect(client)}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-medium text-white">{client.company_name}</span>
                    {client.contact_person && <span className="text-slate-500 ml-2">- {client.contact_person}</span>}
                  </button>
                ))
              )}
            </div>
          )}
          {selectedClient && (
            <div className="mt-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
              <span className="text-sm text-emerald-400 font-medium">{selectedClient.company_name}</span>
              <button type="button" onClick={() => { setSelectedClient(null); setSearchTerm(''); }} className="text-slate-500 hover:text-white">
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
        <h2 className="text-xs font-black uppercase text-slate-500 mb-4">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DatePicker
            label="Issue Date"
            value={formData.issue_date}
            onChange={(val) => {
              setFormData((prev) => ({ ...prev, issue_date: val }));
              updateField('issue_date', val);
            }}
          />
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Reason *</label>
            <select
              value={formData.reason}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, reason: e.target.value }));
                updateField('reason', e.target.value);
              }}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm"
            >
              <option value="">Select reason</option>
              {CREDIT_REASONS.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Notes</label>
            <input
              value={formData.notes}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, notes: e.target.value }));
                updateField('notes', e.target.value);
              }}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-slate-500">Line Items</h2>
          <button
            onClick={handleAddLine}
            className="flex items-center gap-2 text-orange-500 hover:text-white font-black uppercase tracking-widest text-[10px]"
          >
            Add Line
          </button>
        </div>
        <div className="space-y-4">
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-6">
                <textarea
                  value={item.description}
                  onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => handleLineChange(idx, 'unit_price', Number(e.target.value))}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between gap-2">
                <span className="text-white font-bold">{formatCurrency(item.total)}</span>
                <button
                  onClick={() => handleRemoveLine(idx)}
                  className="p-2 text-red-500 hover:text-white hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end text-sm font-black text-white">
          Total: {formatCurrency(totals.total)}
        </div>
      </div>
    </form>
  );
}
