'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Edit2, Eye, FileDown, Send, FileText, Trash2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';

type Props = {
  deliveryNotes: any[];
};

export default function DeliveryNotesTableClient({ deliveryNotes }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useOfficeToast();
  const [working, setWorking] = useState<null | string>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Signed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Disputed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700/50';
    }
  };

  return (
    <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-[#0B0F19]/50 border-b border-slate-800/50">
              <th className="px-6 py-4">DN #</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Linked Invoice</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {deliveryNotes.map((dn) => (
              <tr key={dn.id} className="group hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-5">
                  <Link
                    href={`/office/delivery-notes/${dn.id}`}
                    className="font-black text-white text-sm uppercase tracking-tight hover:text-orange-400 transition-colors inline-block"
                  >
                    {dn.delivery_note_number}
                  </Link>
                </td>
                <td className="px-6 py-5">
                  <span className="text-white text-sm font-bold">
                    {dn.clients?.company_name || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  {dn.invoices?.invoice_number ? (
                    <Link
                      href={`/office/invoices/${dn.linked_invoice_id}`}
                      className="text-orange-400 text-sm font-bold hover:text-orange-300"
                    >
                      {dn.invoices.invoice_number}
                    </Link>
                  ) : (
                    <span className="text-slate-500 text-sm">—</span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <span className="text-slate-300 text-sm">
                    {dn.date_of_delivery ? format(new Date(dn.date_of_delivery), 'dd MMM yyyy') : '—'}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${getStatusColor(dn.status)}`}
                  >
                    {dn.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/office/delivery-notes/${dn.id}`}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                      title="View"
                    >
                      <Eye size={16} />
                    </Link>
                    <button
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                      title="Download PDF"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                      title="Send to Client"
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
