'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { createSalesOrder, updateSalesOrder, type SOLineItemInput } from '@/lib/sales-orders/actions';

interface Row extends SOLineItemInput {
  _k: number;
}

const formatRand = (n: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n || 0).replace('ZAR', 'R');

export default function SalesOrderForm({
  clients,
  mode,
  salesOrderId,
  initial,
}: {
  clients: { id: string; company_name: string }[];
  mode: 'new' | 'edit';
  salesOrderId?: string;
  initial?: any;
}) {
  const router = useRouter();
  const toast = useOfficeToast();
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState<string>(initial?.client_id ?? '');
  const [orderDate, setOrderDate] = useState<string>(initial?.order_date ?? new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState<string>(initial?.expected_delivery_date ?? '');
  const [status, setStatus] = useState<string>(initial?.status ?? 'Draft');
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [rows, setRows] = useState<Row[]>(
    (initial?.sales_order_items?.length
      ? initial.sales_order_items
          .slice()
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((i: any, k: number) => ({ _k: k, description: i.description, quantity: Number(i.quantity), unit_price: Number(i.unit_price), qty_type: i.qty_type }))
      : [{ _k: 0, description: '', quantity: 1, unit_price: 0, qty_type: 'qty' }])
  );

  const totals = useMemo(() => {
    const subtotal = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unit_price) || 0), 0);
    const vat = subtotal * 0.15;
    return { subtotal, vat, total: subtotal + vat };
  }, [rows]);

  const setRow = (k: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r._k === k ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { _k: Math.max(0, ...rs.map((r) => r._k)) + 1, description: '', quantity: 1, unit_price: 0, qty_type: 'qty' }]);
  const removeRow = (k: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r._k !== k) : rs));

  const handleSubmit = async () => {
    if (!clientId) {
      toast.error({ title: 'Missing client', message: 'Please select a client.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client_id: clientId,
        order_date: orderDate,
        expected_delivery_date: deliveryDate || null,
        status,
        notes: notes || null,
        line_items: rows.map((r) => ({ description: r.description, quantity: Number(r.quantity), unit_price: Number(r.unit_price), qty_type: r.qty_type })),
      };
      const res = mode === 'new' ? await createSalesOrder(payload) : await updateSalesOrder(salesOrderId!, payload);
      if ('error' in res && res.error) {
        toast.error({ title: 'Save failed', message: res.error });
        return;
      }
      toast.success({ title: 'Saved', message: mode === 'new' ? 'Sales order created.' : 'Sales order updated.' });
      const id = mode === 'new' ? (res as any).id : salesOrderId;
      router.push(`/office/sales-orders/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none';

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href={mode === 'edit' ? `/office/sales-orders/${salesOrderId}` : '/office/sales-orders'} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          {mode === 'new' ? 'New Sales Order' : 'Edit Sales Order'}
        </h1>
      </div>

      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Client *</label>
          <select className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— select client —</option>
            {clients.map((c) => (<option key={c.id} value={c.id}>{c.company_name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Status</label>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {['Draft', 'Confirmed', 'Partially Invoiced', 'Invoiced', 'Cancelled'].map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Order Date</label>
          <input type="date" className={inputCls} value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Expected Delivery</label>
          <input type="date" className={inputCls} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
        </div>
      </div>

      {/* Line items */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-white font-black uppercase text-sm">Line Items</h2>
          <button onClick={addRow} className="flex items-center gap-1 text-orange-500 hover:text-orange-400 text-xs font-black uppercase tracking-widest">
            <Plus size={14} /> Add Item
          </button>
        </div>
        <div className="divide-y divide-slate-800/40">
          {rows.map((r) => (
            <div key={r._k} className="p-4 grid grid-cols-12 gap-3 items-start">
              <div className="col-span-12 md:col-span-6">
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={r.description}
                  onChange={(e) => setRow(r._k, { description: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="col-span-3 md:col-span-2">
                <input type="number" step="any" placeholder="Qty" value={r.quantity} onChange={(e) => setRow(r._k, { quantity: parseFloat(e.target.value) })} className={inputCls} />
              </div>
              <div className="col-span-3 md:col-span-1">
                <select value={r.qty_type} onChange={(e) => setRow(r._k, { qty_type: e.target.value })} className={inputCls}>
                  <option value="qty">qty</option>
                  <option value="hrs">hrs</option>
                </select>
              </div>
              <div className="col-span-4 md:col-span-2">
                <input type="number" step="any" placeholder="Unit price" value={r.unit_price} onChange={(e) => setRow(r._k, { unit_price: parseFloat(e.target.value) })} className={inputCls} />
              </div>
              <div className="col-span-2 md:col-span-1 flex justify-end pt-2">
                <button onClick={() => removeRow(r._k)} className="text-slate-500 hover:text-red-400" title="Remove">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatRand(totals.subtotal)}</span></div>
            <div className="flex justify-between text-slate-400"><span>VAT (15%)</span><span>{formatRand(totals.vat)}</span></div>
            <div className="flex justify-between text-white font-black border-t border-slate-800 pt-2"><span>Total</span><span className="text-orange-400">{formatRand(totals.total)}</span></div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Notes</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} resize-none`} placeholder="Notes shown on the order…" />
      </div>

      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {mode === 'new' ? 'Create Sales Order' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
