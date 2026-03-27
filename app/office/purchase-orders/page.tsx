import { createClient } from '@/lib/supabase/server';
import { 
  ShoppingBag, 
  Plus, 
  Search,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import PurchaseOrdersControls from './PurchaseOrdersControls';
import PurchaseOrdersTable from './PurchaseOrdersTable';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R');
};

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const status = typeof params.status === 'string' ? params.status : 'all';

  // 1. Build Query
  let query = supabase
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (q) {
    query = query.or(`po_number.ilike.%${q}%,supplier_name.ilike.%${q}%`);
  }

  if (status !== 'all') {
    query = query.eq('status', status.charAt(0).toUpperCase() + status.slice(1));
  }

  const { data: purchaseOrders } = await query;

  // 2. Stats
  const { data: allPOs } = await supabase
    .from('purchase_orders')
    .select('status, total');

  const totalValue = allPOs?.reduce((sum, po) => sum + (po.total || 0), 0) || 0;
  const pendingCount = allPOs?.filter(po => ['Draft', 'Sent', 'Acknowledged'].includes(po.status)).length || 0;
  const deliveredCount = allPOs?.filter(po => po.status === 'Delivered').length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Purchase Orders</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Track orders to suppliers and vendors
          </p>
        </div>
        <Link 
          href="/office/purchase-orders/new"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm shadow-xl shadow-orange-500/20 w-fit"
        >
          <Plus size={16} />
          New Purchase Order
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-orange-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            Total PO Value
          </p>
          <h3 className="text-2xl font-black text-white">{formatCurrency(totalValue)}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-amber-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            Pending Orders
          </p>
          <h3 className="text-2xl font-black text-amber-500">{pendingCount}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-green-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            Delivered
          </p>
          <h3 className="text-2xl font-black text-green-500">{deliveredCount}</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <PurchaseOrdersControls initialQ={q} initialStatus={status as any} />

      {/* PO Table */}
      {purchaseOrders && purchaseOrders.length > 0 ? (
        <PurchaseOrdersTable purchaseOrders={purchaseOrders} />
      ) : (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-24 text-center">
            <div className="max-w-xs mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 border border-slate-800/50">
                <ShoppingBag size={32} className="text-slate-700" />
              </div>
              <h3 className="text-white font-black uppercase tracking-tight mb-2">No Purchase Orders Found</h3>
              <p className="text-slate-500 text-xs font-medium mb-8">
                {q
                  ? `No orders match your search "${q}".`
                  : "You haven't created any purchase orders yet."}
              </p>
              <Link
                href="/office/purchase-orders/new"
                className="text-orange-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all"
              >
                Create Your First PO <Plus size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
