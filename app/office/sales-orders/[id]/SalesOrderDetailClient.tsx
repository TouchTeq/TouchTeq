'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Edit2, Trash2, Receipt, Loader2, FileText, ExternalLink } from 'lucide-react';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { convertSalesOrderToInvoice, deleteSalesOrder } from '@/lib/sales-orders/actions';

const formatRand = (n: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n || 0).replace('ZAR', 'R');

const statusClass = (s: string) =>
  s === 'Invoiced' ? 'bg-green-500/20 text-green-400'
  : s === 'Confirmed' ? 'bg-blue-500/20 text-blue-400'
  : s === 'Partially Invoiced' ? 'bg-amber-500/20 text-amber-400'
  : s === 'Cancelled' ? 'bg-red-500/20 text-red-400'
  : 'bg-slate-700 text-slate-300';

export default function SalesOrderDetailClient({ so }: { so: any }) {
  const router = useRouter();
  const toast = useOfficeToast();
  const [busy, setBusy] = useState<string | null>(null);

  const items = (so.sales_order_items ?? []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const linkedInvoice = Array.isArray(so.invoices) ? so.invoices[0] : so.invoices;

  const handleConvert = async () => {
    setBusy('convert');
    try {
      const res = await convertSalesOrderToInvoice(so.id);
      if ('error' in res && res.error) {
        toast.error({ title: 'Could not invoice', message: res.error });
        return;
      }
      toast.success({ title: 'Invoice created', message: `Invoice ${(res as any).invoiceNumber} created from ${so.so_number}.` });
      router.push(`/office/invoices/${(res as any).invoiceId}`);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete sales order ${so.so_number}? This cannot be undone.`)) return;
    setBusy('delete');
    try {
      const res = await deleteSalesOrder(so.id);
      if ('error' in res && res.error) {
        toast.error({ title: 'Delete failed', message: res.error });
        return;
      }
      toast.success({ title: 'Deleted', message: 'Sales order removed.' });
      router.push('/office/sales-orders');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/office/sales-orders" className="p-2 text-slate-500 hover:text-white"><ArrowLeft size={20} /></Link>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sales Order</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-white font-black text-lg">{so.so_number}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${statusClass(so.status)}`}>{so.status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-3">
          {so.status !== 'Invoiced' && (
            <Link href={`/office/sales-orders/${so.id}/edit`} className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700">
              <Edit2 size={14} /> Edit
            </Link>
          )}
          {so.status !== 'Invoiced' && so.status !== 'Cancelled' && (
            <button onClick={handleConvert} disabled={busy === 'convert'} className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-green-500 text-white hover:bg-green-600 rounded shadow-lg shadow-green-500/20 disabled:opacity-50">
              {busy === 'convert' ? <Loader2 className="animate-spin" size={14} /> : <Receipt size={14} />} Convert to Invoice
            </button>
          )}
          <button onClick={handleDelete} disabled={busy === 'delete'} className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded border border-red-500/20 disabled:opacity-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Linkages */}
      <div className="flex flex-wrap gap-3">
        {so.quotes?.quote_number && (
          <span className="inline-flex items-center gap-2 text-xs bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded">
            <FileText size={12} /> From quote {so.quotes.quote_number}
          </span>
        )}
        {linkedInvoice?.invoice_number && (
          <Link href={`/office/invoices/${linkedInvoice.id}`} className="inline-flex items-center gap-2 text-xs bg-green-500/10 text-green-400 px-3 py-1.5 rounded hover:bg-green-500/20">
            <ExternalLink size={12} /> Invoiced as {linkedInvoice.invoice_number}
          </Link>
        )}
      </div>

      {/* Body */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase">Client</p>
            <p className="text-white font-bold">{so.clients?.company_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase">Order Date</p>
            <p className="text-white font-bold">{so.order_date ? format(parseISO(so.order_date), 'dd MMM yyyy') : '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase">Expected Delivery</p>
            <p className="text-white font-bold">{so.expected_delivery_date ? format(parseISO(so.expected_delivery_date), 'dd MMM yyyy') : '—'}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
              <th className="text-left py-2 font-black">Description</th>
              <th className="text-center py-2 font-black">Qty</th>
              <th className="text-right py-2 font-black">Unit Price</th>
              <th className="text-right py-2 font-black">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {items.map((i: any) => (
              <tr key={i.id} className="text-slate-300">
                <td className="py-3 whitespace-pre-line">{i.description}</td>
                <td className="py-3 text-center text-slate-400">{i.qty_type === 'hrs' ? `${i.quantity} hrs` : i.quantity}</td>
                <td className="py-3 text-right text-slate-400">{formatRand(i.unit_price)}</td>
                <td className="py-3 text-right text-white font-bold">{formatRand(i.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatRand(so.subtotal)}</span></div>
            <div className="flex justify-between text-slate-400"><span>VAT (15%)</span><span>{formatRand(so.vat_amount)}</span></div>
            <div className="flex justify-between text-white font-black border-t border-slate-800 pt-2"><span>Total</span><span className="text-orange-400">{formatRand(so.total)}</span></div>
          </div>
        </div>

        {so.notes && (
          <div className="border-t border-slate-800 pt-4">
            <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Notes</p>
            <p className="text-slate-300 text-sm whitespace-pre-line">{so.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
