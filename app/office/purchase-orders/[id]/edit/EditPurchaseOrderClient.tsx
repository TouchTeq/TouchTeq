'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Plus, Trash2, Lock } from 'lucide-react';
import Link from 'next/link';
import { DatePicker } from '@/components/ui/DatePicker';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { useActiveDocument } from '@/components/office/ActiveDocumentContext';

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export default function EditPurchaseOrderClient({
  initialPO,
  quotes,
  invoices,
}: {
  initialPO: any;
  quotes: any[];
  invoices: any[];
}) {
  const router = useRouter();
  const toast = useOfficeToast();
  const descriptionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    supplier_name: initialPO.supplier_name || '',
    supplier_contact: initialPO.supplier_contact || '',
    supplier_email: initialPO.supplier_email || '',
    date_raised: initialPO.date_raised || '',
    delivery_date: initialPO.delivery_date || '',
    status: initialPO.status || 'Draft',
    linked_quote_id: initialPO.linked_quote_id || '',
    linked_invoice_id: initialPO.linked_invoice_id || '',
    notes: initialPO.notes || '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    (initialPO.purchase_order_items || []).map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total: Number(item.line_total || item.quantity * item.unit_price),
    }))
  );
  const { registerDocumentSession, clearDocumentSession, updateField, addLineItem, removeLineItem, updateLineItem, documentData } = useActiveDocument();

  useEffect(() => {
    registerDocumentSession({
      documentType: 'purchase_order',
      documentId: initialPO.id,
      documentData: {
        documentNumber: initialPO.po_number,
        supplier_name: initialPO.supplier_name,
        supplier_contact: initialPO.supplier_contact || '',
        supplier_email: initialPO.supplier_email || '',
        date_raised: initialPO.date_raised,
        delivery_date: initialPO.delivery_date || '',
        status: initialPO.status,
        linked_quote_id: initialPO.linked_quote_id || '',
        linked_invoice_id: initialPO.linked_invoice_id || '',
        notes: initialPO.notes || '',
        lineItems: (initialPO.purchase_order_items || []).map((item: any) => ({
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
  }, [clearDocumentSession, registerDocumentSession, initialPO.id]);

  useEffect(() => {
    if (!documentData) return;

    setFormData((prev) => ({
      ...prev,
      supplier_name: documentData.supplier_name ?? prev.supplier_name,
      supplier_contact: documentData.supplier_contact ?? prev.supplier_contact,
      supplier_email: documentData.supplier_email ?? prev.supplier_email,
      date_raised: documentData.date_raised ?? prev.date_raised,
      delivery_date: documentData.delivery_date ?? prev.delivery_date,
      status: documentData.status ?? prev.status,
      linked_quote_id: documentData.linked_quote_id ?? prev.linked_quote_id,
      linked_invoice_id: documentData.linked_invoice_id ?? prev.linked_invoice_id,
      notes: documentData.notes ?? prev.notes,
    }));

    if (Array.isArray(documentData.lineItems)) {
      setLineItems(documentData.lineItems.map((item: any) => ({
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unitPrice ?? item.unit_price) || 0,
        total: Number(item.total ?? item.line_total ?? (Number(item.quantity) || 1) * (Number(item.unitPrice ?? item.unit_price) || 0)),
      })));
    }
  }, [documentData]);

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const vat_amount = subtotal * 0.15;
    const total = subtotal + vat_amount;
    return { subtotal, vat_amount, total };
  }, [lineItems]);

  if (initialPO.status !== 'Draft') {
    return (
      <div className="w-full py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
          <Lock size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Purchase Order Locked</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
          Only Draft purchase orders can be edited to maintain financial integrity.
        </p>
        <Link href={`/office/purchase-orders`} className="inline-block text-orange-500 font-black text-xs uppercase tracking-[0.2em] border-b border-orange-500/30 pb-1 mt-8">
          Go Back to Purchase Orders
        </Link>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    updateField(field, value);
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
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

  const handleAddLineItem = () => {
    setLineItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
    addLineItem({ description: '', quantity: 1, unitPrice: 0, total: 0 });
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((_, i) => i !== index));
      removeLineItem(index);
    }
  };

  const handleSave = async () => {
    if (!formData.supplier_name.trim()) {
      toast.error({ title: 'Required', message: 'Please enter a supplier name.' });
      return;
    }

    const hasValidItems = lineItems.some((item) => item.description.trim() && item.total > 0);
    if (!hasValidItems) {
      toast.error({ title: 'Required', message: 'Please add at least one line item with description and price.' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const itemsJson = lineItems
        .filter((item) => item.description.trim())
        .map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

      const response = await fetch(`/api/office/purchase-orders/${initialPO.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_name: formData.supplier_name,
          supplier_contact: formData.supplier_contact,
          supplier_email: formData.supplier_email,
          date_raised: formData.date_raised,
          delivery_date: formData.delivery_date,
          status: formData.status,
          notes: formData.notes,
          linked_quote_id: formData.linked_quote_id || null,
          linked_invoice_id: formData.linked_invoice_id || null,
          line_items: itemsJson,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Purchase order update failed');
      }

      toast.success({ title: 'Saved', message: `Purchase Order ${result.purchaseOrder?.po_number} updated.` });
      router.push(`/office/purchase-orders/${initialPO.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save purchase order.');
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount).replace('ZAR', 'R');

  return (
    <div className="w-full space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/office/purchase-orders/${initialPO.id}`} className="p-2 text-slate-500 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white uppercase">Edit Purchase Order</h1>
            <p className="text-slate-500 text-sm">{initialPO.po_number}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 text-xs font-black uppercase bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-6">
        <h2 className="text-xs font-black uppercase text-slate-500">Supplier Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Supplier Name *</label>
            <input
              value={formData.supplier_name}
              onChange={(e) => handleFieldChange('supplier_name', e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Person</label>
            <input
              value={formData.supplier_contact}
              onChange={(e) => handleFieldChange('supplier_contact', e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Supplier Email</label>
            <input
              value={formData.supplier_email}
              onChange={(e) => handleFieldChange('supplier_email', e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white"
            />
          </div>
          <DatePicker
            label="Date Raised"
            value={formData.date_raised}
            onChange={(val) => handleFieldChange('date_raised', val)}
          />
          <DatePicker
            label="Delivery Date"
            value={formData.delivery_date}
            onChange={(val) => handleFieldChange('delivery_date', val)}
          />
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes</label>
            <input
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Linked Quote</label>
            <select
              value={formData.linked_quote_id || ''}
              onChange={(e) => handleFieldChange('linked_quote_id', e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white"
            >
              <option value="">None</option>
              {quotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quote_number} - {q.clients?.company_name || ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Linked Invoice</label>
            <select
              value={formData.linked_invoice_id || ''}
              onChange={(e) => handleFieldChange('linked_invoice_id', e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white"
            >
              <option value="">None</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} - {inv.clients?.company_name || ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-slate-500">Line Items</h2>
          <button
            onClick={handleAddLineItem}
            className="flex items-center gap-2 text-orange-500 hover:text-white font-black uppercase tracking-widest text-[10px]"
          >
            <Plus size={14} /> Add Line
          </button>
        </div>
        <div className="space-y-4">
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-6">
                <textarea
                  ref={(el) => (descriptionRefs.current[idx] = el)}
                  value={item.description}
                  onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => handleLineItemChange(idx, 'unit_price', Number(e.target.value))}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between gap-2">
                <span className="text-white font-bold">{formatCurrency(item.total)}</span>
                <button
                  onClick={() => handleRemoveLineItem(idx)}
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
    </div>
  );
}
