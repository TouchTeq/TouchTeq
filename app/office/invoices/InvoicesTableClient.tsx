'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BellRing, CreditCard, Download, Edit2, Eye, FileDown, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DeleteConfirmationModal, type DeletableItem } from '@/components/office/DeleteConfirmationModal';

type Props = {
  invoices: any[];
};

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: any) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function InvoicesTableClient({ invoices }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace('ZAR', 'R');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-800 text-slate-400';
      case 'Sent':
        return 'bg-blue-500/10 text-blue-500';
      case 'Partially Paid':
        return 'bg-amber-500/10 text-amber-500';
      case 'Paid':
        return 'bg-green-500/10 text-green-500';
      case 'Overdue':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  const router = useRouter();
  const supabase = createClient();
  const toast = useOfficeToast();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [working, setWorking] = useState<null | 'export' | 'markSent' | 'delete'>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoicesToDelete, setInvoicesToDelete] = useState<DeletableItem[]>([]);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected]
  );

  const allSelected = invoices.length > 0 && selectedIds.length === invoices.length;

  const toggleAll = (next: boolean) => {
    if (!next) {
      setSelected({});
      return;
    }
    const map: Record<string, boolean> = {};
    invoices.forEach((inv) => {
      map[String(inv.id)] = true;
    });
    setSelected(map);
  };

  const toggleOne = (id: string, next: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: next }));
  };

  const exportCsv = async () => {
    if (selectedIds.length === 0) {
      toast.info({ title: 'No Selection', message: 'Select at least one invoice.' });
      return;
    }
    setWorking('export');
    try {
      const rows = invoices.filter((i) => selectedIds.includes(String(i.id)));
      const header = [
        'invoice_number',
        'client_company',
        'issue_date',
        'due_date',
        'status',
        'total',
        'amount_paid',
        'balance_due',
      ];
      const lines = [
        header.join(','),
        ...rows.map((inv) =>
          [
            csvEscape(inv.invoice_number),
            csvEscape(inv.clients?.company_name ?? inv.quick_client_name ?? ''),
            csvEscape(inv.issue_date),
            csvEscape(inv.due_date),
            csvEscape(inv.status),
            csvEscape(inv.total ?? 0),
            csvEscape(inv.amount_paid ?? 0),
            csvEscape(inv.balance_due ?? 0),
          ].join(',')
        ),
      ];
      downloadText(`invoices_export_${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'));
      toast.success({ title: 'Export Ready', message: `Downloaded ${rows.length} invoice(s).` });
    } finally {
      setWorking(null);
    }
  };

  const markDraftsAsSent = async () => {
    if (selectedIds.length === 0) {
      toast.info({ title: 'No Selection', message: 'Select at least one invoice.' });
      return;
    }

    const draftIds = invoices
      .filter((i) => selectedIds.includes(String(i.id)) && i.status === 'Draft')
      .map((i) => i.id);

    if (draftIds.length === 0) {
      toast.info({ title: 'Nothing To Update', message: 'Only Draft invoices can be marked as Sent.' });
      return;
    }

    setWorking('markSent');
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'Sent' })
        .in('id', draftIds);

      if (error) throw error;

      toast.success({ title: 'Updated', message: `Marked ${draftIds.length} invoice(s) as Sent.` });
      setSelected({});
      router.refresh();
    } catch (e: any) {
      toast.error({ title: 'Update Failed', message: e.message });
    } finally {
      setWorking(null);
    }
  };

  const openDeleteModal = async () => {
    if (selectedIds.length === 0) {
      toast.info({ title: 'No Selection', message: 'Select at least one invoice.' });
      return;
    }

    const invoicesToCheck = invoices.filter(i => selectedIds.includes(String(i.id)));
    
    const invoicesWithLinks: DeletableItem[] = await Promise.all(
      invoicesToCheck.map(async (invoice) => {
        const { count: paymentCount } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('invoice_id', invoice.id);
        
        return {
          id: String(invoice.id),
          name: invoice.invoice_number,
          hasLinkedRecords: (paymentCount || 0) > 0
        };
      })
    );

    setInvoicesToDelete(invoicesWithLinks);
    setDeleteModalOpen(true);
  };

  const handleDeleteInvoices = async () => {
    const idsToDelete = invoicesToDelete.map(i => i.id);
    
    const { error } = await supabase.from('invoices').delete().in('id', idsToDelete);
    
    if (error) throw error;
    
    toast.success({
      title: 'Deleted',
      message: `${idsToDelete.length} invoice(s) deleted successfully.`,
    });
    setSelected({});
    router.refresh();
  };

  return (
    <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-slate-800/50 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
            <FileDown size={14} className="text-orange-500" />
            Bulk Actions
          </div>
          {selectedIds.length > 0 && (
            <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={working !== null}
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0F19] border border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            type="button"
            disabled={working !== null}
            onClick={markDraftsAsSent}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            <Send size={14} />
            Mark Drafts Sent
          </button>
          <button
            type="button"
            disabled={working !== null || selectedIds.length === 0}
            onClick={openDeleteModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            title="Delete selected invoices"
          >
            <Trash2 size={14} />
            Delete Selected ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-[#0B0F19]/50 border-b border-slate-800/50">
              <th className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  aria-label="Select all invoices"
                  className="h-4 w-4 accent-orange-500"
                />
              </th>
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Dates</th>
              <th className="px-6 py-4 text-right">Amounts</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {invoices && invoices.length > 0 ? (
              invoices.map((inv) => {
                const id = String(inv.id);
                return (
                  <tr key={inv.id} className="group hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-5">
                      <input
                        type="checkbox"
                        checked={!!selected[id]}
                        onChange={(e) => toggleOne(id, e.target.checked)}
                        aria-label={`Select invoice ${inv.invoice_number}`}
                        className="h-4 w-4 accent-orange-500"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/office/invoices/${inv.id}`}
                        className="font-black text-white text-sm uppercase tracking-tight hover:text-orange-400 transition-colors inline-block"
                      >
                        {inv.invoice_number}
                      </Link>
                      {inv.is_recurring && (
                        <span className="ml-2 text-[8px] font-black uppercase px-1.5 py-0.5 bg-cyan-500/10 text-cyan-500 rounded" title={`Recurring ${inv.recurring_frequency}`}>
                          ⟳
                        </span>
                      )}
                      {inv.status === 'Paid' && <div className="mt-1 h-0.5 w-8 bg-green-500/50 rounded-full" />}
                    </td>
                    <td className="px-6 py-5">
                      <>
                        <Link
                          href={inv.client_id ? `/office/clients/${inv.client_id}` : '#'}
                          className={`text-slate-200 text-sm font-bold hover:text-orange-400 transition-colors flex items-center gap-2 ${!inv.client_id ? 'cursor-default' : ''}`}
                        >
                          {inv.clients?.company_name ?? inv.quick_client_name ?? '—'}
                        </Link>
                        {(inv.clients?.contact_person || (inv.quick_client_name && inv.quick_client_email)) && (
                          <p className="text-slate-500 text-[10px] font-medium mt-0.5">
                            {inv.clients?.contact_person ?? (inv.quick_client_email || '')}
                          </p>
                        )}
                      </>
                    </td>
                    <td className="px-6 py-5 space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <span className="w-8 uppercase">Iss:</span>
                        <span className="text-slate-300">{format(new Date(inv.issue_date), 'dd MMM yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold">
                        <span className="w-8 uppercase text-slate-500">Due:</span>
                        <span
                          className={
                            inv.status === 'Overdue'
                              ? 'text-red-500 underline decoration-red-500/30'
                              : 'text-slate-400'
                          }
                        >
                          {format(new Date(inv.due_date), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right space-y-1">
                      <p className="font-black text-white text-sm">{formatCurrency(inv.total || 0)}</p>
                      {inv.amount_paid > 0 && (
                        <p className="text-[10px] font-bold text-green-500/80 uppercase">
                          Paid: {formatCurrency(inv.amount_paid)}
                        </p>
                      )}
                      {(inv.balance_due || 0) > 0 && (
                        <p className="text-[10px] font-black text-slate-500 uppercase">
                          Bal: {formatCurrency(inv.balance_due)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${getStatusColor(
                          inv.status
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/office/invoices/${inv.id}`}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                          title="View & Manage"
                        >
                          <Eye size={16} />
                        </Link>
                        {inv.status === 'Draft' && (
                          <Link
                            href={`/office/invoices/${inv.id}/edit`}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                            title="Edit Invoice"
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        {inv.status !== 'Paid' && inv.status !== 'Draft' && (
                          <button
                            type="button"
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                            title="Record Payment"
                          >
                            <CreditCard size={16} />
                          </button>
                        )}
                        {(inv.status === 'Overdue' || inv.status === 'Sent') && (
                          <Link
                            href={`/office/invoices/${inv.id}?action=reminder`}
                            className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                            title="Send Payment Reminder"
                          >
                            <BellRing size={16} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-24 text-center">
                  <p className="text-slate-600 text-xs font-black uppercase tracking-[0.3em]">
                    No invoices found
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteInvoices}
        items={invoicesToDelete}
        itemType="invoice"
      />
    </div>
  );
}
