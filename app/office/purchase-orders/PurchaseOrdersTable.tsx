'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Send, CheckCircle, Truck, XCircle, FileDown, Package } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';

import { Trash2, Edit } from 'lucide-react';
import { PurchaseOrderDetails } from '@/components/office/PurchaseOrderDetails';
import { DeleteConfirmationModal } from '@/components/office/DeleteConfirmationModal';
import { deletePurchaseOrder } from '@/lib/office/purchaseOrderActions';

type Props = {
  purchaseOrders: any[];
  onRefresh?: () => void;
};

export default function PurchaseOrdersTable({ purchaseOrders, onRefresh }: Props) {
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useOfficeToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount).replace('ZAR', 'R');
  };

  const handleDelete = async () => {
    if (!poToDelete) return;
    try {
      setIsDeleting(true);
      await deletePurchaseOrder(poToDelete.id);
      success({ title: 'Deleted', message: `PO ${poToDelete.po_number} has been removed` });
      setPoToDelete(null);
      onRefresh?.();
    } catch (err: any) {
      error({ title: 'Delete Failed', message: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-800 text-slate-400';
      case 'Sent':
        return 'bg-blue-500/10 text-blue-500';
      case 'Acknowledged':
        return 'bg-amber-500/10 text-amber-500';
      case 'Delivered':
        return 'bg-green-500/10 text-green-500';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle size={14} />;
      case 'Acknowledged':
        return <Truck size={14} />;
      case 'Cancelled':
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="text-slate-500 text-[9px] uppercase font-black bg-slate-900/50 border-b border-slate-800">
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Date Raised</th>
                <th className="px-6 py-4">Expected Delivery</th>
                <th className="px-6 py-4">Linked Job</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {purchaseOrders.map((po) => (
                <tr 
                  key={po.id} 
                  className="group hover:bg-slate-800/20 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPO(po);
                    setIsDetailsOpen(true);
                  }}
                >
                  <td className="px-6 py-5">
                    <span className="font-black text-white text-sm group-hover:text-orange-500 transition-colors uppercase tracking-tight">{po.po_number}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-white font-bold text-sm">{po.supplier_name}</p>
                      {po.supplier_email && (
                        <p className="text-slate-500 text-[10px] font-mono">{po.supplier_email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-slate-400 text-xs font-medium">
                      {po.date_raised ? format(new Date(po.date_raised), 'dd MMM yyyy') : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-slate-400 text-xs font-medium">
                      {po.delivery_date ? format(new Date(po.delivery_date), 'dd MMM yyyy') : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {po.linked_quote_id && (
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded">Quote</span>
                      )}
                      {po.linked_invoice_id && (
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded">Invoice</span>
                      )}
                      {!po.linked_quote_id && !po.linked_invoice_id && (
                        <span className="text-slate-600 text-[10px] italic">Not linked</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-black text-white text-sm">{formatCurrency(po.total || 0)}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded inline-flex items-center gap-1 border ${getStatusColor(po.status)} ${
                      po.status === 'Sent' ? 'border-blue-500/30' : 
                      po.status === 'Acknowledged' ? 'border-amber-500/30' :
                      po.status === 'Delivered' ? 'border-green-500/30' :
                      po.status === 'Cancelled' ? 'border-red-500/30' : 'border-slate-700'
                    }`}>
                      {getStatusIcon(po.status)}
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedPO(po);
                          setIsDetailsOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-2 text-slate-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                        title="Edit PO"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setPoToDelete(po)}
                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete PO"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {purchaseOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                        <Package size={24} className="text-slate-700" />
                      </div>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">No Purchase Orders Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PurchaseOrderDetails 
        po={selectedPO}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPO(null);
        }}
        onRefresh={onRefresh}
        onDelete={() => {
          setIsDetailsOpen(false);
          setPoToDelete(selectedPO);
        }}
      />

      <DeleteConfirmationModal 
        isOpen={!!poToDelete}
        onClose={() => setPoToDelete(null)}
        onConfirm={handleDelete}
        itemType="purchase_order"
        items={poToDelete ? [{ id: poToDelete.id, name: poToDelete.po_number }] : []}
      />
    </>
  );
}
