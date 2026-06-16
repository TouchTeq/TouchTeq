import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Plus, ClipboardList, ArrowRight } from 'lucide-react';
import { getSalesOrders } from '@/lib/sales-orders/actions';

const formatRand = (n: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n || 0).replace('ZAR', 'R');

const statusClass = (s: string) =>
  s === 'Invoiced' ? 'bg-green-500/20 text-green-400'
  : s === 'Confirmed' ? 'bg-blue-500/20 text-blue-400'
  : s === 'Partially Invoiced' ? 'bg-amber-500/20 text-amber-400'
  : s === 'Cancelled' ? 'bg-red-500/20 text-red-400'
  : 'bg-slate-700 text-slate-300';

export default async function SalesOrdersPage() {
  const res = await getSalesOrders();
  const orders = ('data' in res ? res.data : []) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Sales Orders</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Confirmed customer orders awaiting invoicing</p>
        </div>
        <Link href="/office/sales-orders/new" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm shadow-xl shadow-orange-500/20 w-fit">
          <Plus size={16} /> New Sales Order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-12 text-center">
          <ClipboardList size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-black uppercase mb-2">No Sales Orders</h3>
          <p className="text-slate-500 text-sm mb-6">Create one directly, or convert an accepted quote into a sales order.</p>
          <Link href="/office/sales-orders/new" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-bold text-sm uppercase tracking-widest">
            Create your first sales order <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
                <th className="text-left p-4 font-black">Order</th>
                <th className="text-left p-4 font-black">Client</th>
                <th className="text-left p-4 font-black">Order Date</th>
                <th className="text-right p-4 font-black">Total</th>
                <th className="text-left p-4 font-black">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-800/20">
                  <td className="p-4 text-white font-bold">{o.so_number}</td>
                  <td className="p-4 text-slate-400">{o.clients?.company_name ?? '—'}</td>
                  <td className="p-4 text-slate-400">{o.order_date ? format(parseISO(o.order_date), 'dd MMM yyyy') : '—'}</td>
                  <td className="p-4 text-right text-white">{formatRand(o.total)}</td>
                  <td className="p-4"><span className={`text-[10px] px-2 py-1 rounded font-black uppercase ${statusClass(o.status)}`}>{o.status}</span></td>
                  <td className="p-4 text-right">
                    <Link href={`/office/sales-orders/${o.id}`} className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-400 font-bold text-xs uppercase tracking-widest">
                      Open <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
