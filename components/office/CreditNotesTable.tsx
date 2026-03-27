'use client';

import { useState } from 'react';
import { 
  Eye, 
  Trash2, 
  FileMinus,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { CreditNoteDetails } from './CreditNoteDetails';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { deleteCreditNote } from '@/lib/office/creditNoteActions';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { useRouter } from 'next/navigation';

type Props = {
  creditNotes: any[];
};

export function CreditNotesTable({ creditNotes }: Props) {
  const [selectedCN, setSelectedCN] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [cnToDelete, setCnToDelete] = useState<any>(null);
  const { success, error } = useOfficeToast();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount).replace('ZAR', 'R');
  };

  const handleDelete = async () => {
    if (!cnToDelete) return;
    try {
      await deleteCreditNote(cnToDelete.id);
      success({ title: 'Deleted', message: `Credit Note ${cnToDelete.cn_number} has been removed` });
      setCnToDelete(null);
      router.refresh();
    } catch (err: any) {
      error({ title: 'Delete Failed', message: err.message });
    }
  };

  return (
    <>
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead>
              <tr className="text-slate-500 text-[9px] uppercase font-black bg-slate-900/50 border-b border-slate-800">
                <th className="px-6 py-4">CN Number</th>
                <th className="px-6 py-4">Original Invoice</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {creditNotes.map((cn) => (
                <tr 
                  key={cn.id} 
                  className="group hover:bg-slate-800/20 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedCN(cn);
                    setIsDetailsOpen(true);
                  }}
                >
                  <td className="px-6 py-5">
                    <span className="font-black text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{cn.cn_number}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                      {cn.invoices?.invoice_number || 'N/A'}
                      <ArrowRight size={10} className="text-slate-600" />
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-white font-bold">{cn.clients?.company_name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-slate-400 text-xs font-medium">
                      {cn.date ? format(new Date(cn.date), 'dd MMM yyyy') : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5 max-w-[200px] truncate">
                    <span className="text-slate-500 text-[10px] font-medium leading-relaxed uppercase tracking-wide">{cn.reason || '-'}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-black text-white">{formatCurrency(cn.total || 0)}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded inline-flex items-center gap-1 border ${
                      cn.status === 'Draft' 
                        ? 'bg-slate-800 text-slate-400 border-slate-700' 
                        : 'bg-green-500/10 text-green-500 border-green-500/30 font-black'
                    }`}>
                      {cn.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedCN(cn);
                          setIsDetailsOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setCnToDelete(cn)}
                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Credit Note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {creditNotes.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                        <FileMinus size={24} className="text-slate-700" />
                      </div>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">No Credit Notes Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreditNoteDetails 
        cn={selectedCN}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedCN(null);
        }}
        onRefresh={() => {
          router.refresh();
        }}
        onDelete={() => {
          setIsDetailsOpen(false);
          setCnToDelete(selectedCN);
        }}
      />

      <DeleteConfirmationModal 
        isOpen={!!cnToDelete}
        onClose={() => setCnToDelete(null)}
        onConfirm={handleDelete}
        itemType="credit_note"
        items={cnToDelete ? [{ id: cnToDelete.id, name: cnToDelete.cn_number }] : []}
      />
    </>
  );
}
