'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Edit2, ExternalLink, Eye, FileDown, FileInput, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DeleteConfirmationModal, type DeletableItem } from '@/components/office/DeleteConfirmationModal';

type Props = {
  quotes: any[];
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

export default function QuotesTableClient({ quotes }: Props) {
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
      case 'Accepted':
        return 'bg-green-500/10 text-green-500';
      case 'Declined':
        return 'bg-red-500/10 text-red-500';
      case 'Expired':
        return 'bg-orange-500/10 text-orange-500';
      case 'Converted':
        return 'bg-purple-500/10 text-purple-500';
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
  const [quotesToDelete, setQuotesToDelete] = useState<DeletableItem[]>([]);

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const allSelected = quotes.length > 0 && selectedIds.length === quotes.length;

  const toggleAll = (next: boolean) => {
    if (!next) {
      setSelected({});
      return;
    }
    const map: Record<string, boolean> = {};
    quotes.forEach((q) => {
      map[String(q.id)] = true;
    });
    setSelected(map);
  };

  const toggleOne = (id: string, next: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: next }));
  };

  const exportCsv = async () => {
    if (selectedIds.length === 0) {
      toast.info({ title: 'No Selection', message: 'Select at least one quote.' });
      return;
    }
    setWorking('export');
    try {
      const rows = quotes.filter((q) => selectedIds.includes(String(q.id)));
      const header = ['quote_number', 'client_company', 'issue_date', 'expiry_date', 'status', 'total'];
      const lines = [
        header.join(','),
        ...rows.map((q) =>
          [
            csvEscape(q.quote_number),
            csvEscape(q.clients?.company_name ?? q.quick_client_name ?? ''),
            csvEscape(q.issue_date),
            csvEscape(q.expiry_date),
            csvEscape(q.status),
            csvEscape(q.total ?? 0),
          ].join(',')
        ),
      ];
      downloadText(`quotes_export_${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'));
      toast.success({ title: 'Export Ready', message: `Downloaded ${rows.length} quote(s).` });
    } finally {
      setWorking(null);
    }
  };

  const markDraftsAsSent = async () => {
    if (selectedIds.length === 0) {
      toast.info({ title: 'No Selection', message: 'Select at least one quote.' });
      return;
    }

    const draftIds = quotes
      .filter((q) => selectedIds.includes(String(q.id)) && q.status === 'Draft')
      .map((q) => q.id);

    if (draftIds.length === 0) {
      toast.info({ title: 'Nothing To Update', message: 'Only Draft quotes can be marked as Sent.' });
      return;
    }

    setWorking('markSent');
    try {
      const { error } = await supabase.from('quotes').update({ status: 'Sent' }).in('id', draftIds);
      if (error) throw error;

      toast.success({ title: 'Updated', message: `Marked ${draftIds.length} quote(s) as Sent.` });
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
      toast.info({ title: 'No Selection', message: 'Select at least one quote.' });
      return;
    }

    const quotesToCheck = quotes.filter(q => selectedIds.includes(String(q.id)));
    
    const quotesWithLinks: DeletableItem[] = await Promise.all(
      quotesToCheck.map(async (quote) => {
        const { count: invoiceCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('quote_id', quote.id);
        
        return {
          id: String(quote.id),
          name: quote.quote_number,
          hasLinkedRecords: (invoiceCount || 0) > 0
        };
      })
    );

    setQuotesToDelete(quotesWithLinks);
    setDeleteModalOpen(true);
  };

  const handleDeleteQuotes = async () => {
    const idsToDelete = quotesToDelete.map(q => q.id);
    
    const { error } = await supabase.from('quotes').delete().in('id', idsToDelete);
    
    if (error) throw error;
    
    toast.success({
      title: 'Deleted',
      message: `${idsToDelete.length} quotation(s) deleted successfully.`,
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
            title="Delete selected quotations"
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
                  aria-label="Select all quotes"
                  className="h-4 w-4 accent-orange-500"
                />
              </th>
              <th className="px-6 py-4">Quote #</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Issue Date</th>
              <th className="px-6 py-4">Expiry Date</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {quotes && quotes.length > 0 ? (
              quotes.map((quote) => {
                const id = String(quote.id);
                return (
                  <tr key={quote.id} className="group hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-5">
                      <input
                        type="checkbox"
                        checked={!!selected[id]}
                        onChange={(e) => toggleOne(id, e.target.checked)}
                        aria-label={`Select quote ${quote.quote_number}`}
                        className="h-4 w-4 accent-orange-500"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/office/quotes/${quote.id}`}
                        className="font-black text-white text-sm uppercase tracking-tight hover:text-orange-400 transition-colors inline-block"
                      >
                        {quote.quote_number}
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <>
                        <Link
                          href={quote.client_id ? `/office/clients/${quote.client_id}` : '#'}
                          className={`text-slate-200 text-sm font-bold hover:text-orange-400 transition-colors flex items-center gap-2 ${!quote.client_id ? 'cursor-default' : ''}`}
                        >
                          {quote.clients?.company_name ?? quote.quick_client_name ?? '—'}
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
                        </Link>
                        {(quote.clients?.contact_person || (quote.quick_client_name && quote.quick_client_email)) && (
                          <p className="text-slate-500 text-xs">
                            {quote.clients?.contact_person ?? (quote.quick_client_email || '')}
                          </p>
                        )}
                      </>
                    </td>
                    <td className="px-6 py-5 text-slate-400 text-xs font-medium">
                      {format(new Date(quote.issue_date), 'dd MMM yyyy')}
                    </td>
                    <td
                      className={`px-6 py-5 text-xs font-medium ${
                        quote.status === 'Expired' ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      {format(new Date(quote.expiry_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-5 text-right font-black text-sm text-white">
                      {formatCurrency(quote.total || 0)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${getStatusColor(
                          quote.status
                        )}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/office/quotes/${quote.id}`}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                          title="View Management"
                        >
                          <Eye size={16} />
                        </Link>
                        {(quote.status === 'Draft' || quote.status === 'Sent') && (
                          <Link
                            href={`/office/quotes/${quote.id}/edit`}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                            title="Edit Quote"
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        {quote.status === 'Accepted' && !quote.converted_to_invoice && (
                          <button
                            type="button"
                            className="p-2 text-green-500 hover:text-white hover:bg-green-600 rounded-lg transition-all"
                            title="Convert to Invoice"
                          >
                            <FileInput size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-24 text-center">
                  <p className="text-slate-600 text-xs font-black uppercase tracking-[0.3em]">No quotes found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteQuotes}
        items={quotesToDelete}
        itemType="quotation"
      />
    </div>
  );
}

