'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Edit2, Eye, FileDown, UserCheck, UserX, Trash2, MailX } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DeleteConfirmationModal, type DeletableItem } from '@/components/office/DeleteConfirmationModal';

const CATEGORY_COLORS: Record<string, string> = {
  'Service Support':      'bg-blue-500/10 text-blue-400',
  'Projects':             'bg-orange-500/10 text-orange-400',
  'Back up Power Supply': 'bg-green-500/10 text-green-400',
  'Software Support':     'bg-purple-500/10 text-purple-400',
};

type Props = {
  clients: any[];
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

export default function ClientsTableClient({ clients }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace('ZAR', 'R');
  };

  const router = useRouter();
  const supabase = createClient();
  const toast = useOfficeToast();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [working, setWorking] = useState<null | 'export' | 'activate' | 'deactivate' | 'delete'>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientsToDelete, setClientsToDelete] = useState<DeletableItem[]>([]);

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const allSelected = clients.length > 0 && selectedIds.length === clients.length;

  const toggleAll = (next: boolean) => {
    if (!next) {
      setSelected({});
      return;
    }
    const map: Record<string, boolean> = {};
    clients.forEach((c) => {
      map[String(c.id)] = true;
    });
    setSelected(map);
  };

  const toggleOne = (id: string, next: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: next }));
  };

  const exportCsv = async () => {
    if (selectedIds.length === 0) {
      toast.info({ title: 'No Selection', message: 'Select at least one client.' });
      return;
    }
    setWorking('export');
    try {
      const rows = clients.filter((c) => selectedIds.includes(String(c.id)));
      const header = [
        'company_name',
        'contact_person',
        'job_title',
        'email',
        'phone',
        'vat_number',
        'category',
        'opening_balance',
        'is_active',
        'email_missing',
        'outstanding_balance',
      ];
      const lines = [
        header.join(','),
        ...rows.map((c) =>
          [
            csvEscape(c.company_name),
            csvEscape(c.contact_person),
            csvEscape(c.job_title),
            csvEscape(c.email),
            csvEscape(c.phone),
            csvEscape(c.vat_number),
            csvEscape(c.category ?? ''),
            csvEscape(c.opening_balance ?? 0),
            csvEscape(c.is_active),
            csvEscape(c.email_missing ?? false),
            csvEscape(c.outstanding_balance ?? 0),
          ].join(',')
        ),
      ];
      downloadText(`clients_export_${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'));
      toast.success({ title: 'Export Ready', message: `Downloaded ${rows.length} client(s).` });
    } finally {
      setWorking(null);
    }
  };

  const setActiveState = async (nextActive: boolean) => {
    if (selectedIds.length === 0) {
      toast.info({ title: 'No Selection', message: 'Select at least one client.' });
      return;
    }

    const idsToUpdate = clients
      .filter((c) => selectedIds.includes(String(c.id)) && !!c.is_active !== nextActive)
      .map((c) => c.id);

    if (idsToUpdate.length === 0) {
      toast.info({
        title: 'Nothing To Update',
        message: nextActive ? 'All selected clients are already Active.' : 'All selected clients are already Inactive.',
      });
      return;
    }

    setWorking(nextActive ? 'activate' : 'deactivate');
    try {
      const { error } = await supabase.from('clients').update({ is_active: nextActive }).in('id', idsToUpdate);
      if (error) throw error;

      toast.success({
        title: 'Updated',
        message: nextActive
          ? `Activated ${idsToUpdate.length} client(s).`
          : `Deactivated ${idsToUpdate.length} client(s).`,
      });
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
      toast.info({ title: 'No Selection', message: 'Select at least one client.' });
      return;
    }

    const clientsToCheck = clients.filter(c => selectedIds.includes(String(c.id)));
    
    const clientsWithLinks: DeletableItem[] = await Promise.all(
      clientsToCheck.map(async (client) => {
        const { count: invoiceCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);
        
        const { count: quoteCount } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);
        
        return {
          id: String(client.id),
          name: client.company_name,
          hasLinkedRecords: (invoiceCount || 0) > 0 || (quoteCount || 0) > 0
        };
      })
    );

    setClientsToDelete(clientsWithLinks);
    setDeleteModalOpen(true);
  };

  const handleDeleteClients = async () => {
    const idsToDelete = clientsToDelete.map(c => c.id);
    
    const { error } = await supabase.from('clients').delete().in('id', idsToDelete);
    
    if (error) throw error;
    
    toast.success({
      title: 'Deleted',
      message: `${idsToDelete.length} client(s) deleted successfully.`,
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
            onClick={() => setActiveState(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            title="Set selected clients to Active"
          >
            <UserCheck size={14} />
            Set Active
          </button>
          <button
            type="button"
            disabled={working !== null}
            onClick={() => setActiveState(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            title="Set selected clients to Inactive"
          >
            <UserX size={14} />
            Set Inactive
          </button>
          <button
            type="button"
            disabled={working !== null || selectedIds.length === 0}
            onClick={openDeleteModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            title="Delete selected clients"
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
                  aria-label="Select all clients"
                  className="h-4 w-4 accent-orange-500"
                />
              </th>
              <th className="px-6 py-4">Company Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Contact Person</th>
              <th className="px-6 py-4">Contact Method</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Outstanding Balance</th>
              <th className="px-6 py-4 text-right">Invoice Total</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {clients.map((client) => {
              const id = String(client.id);
              return (
                <tr key={client.id} className="group hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-5">
                    <input
                      type="checkbox"
                      checked={!!selected[id]}
                      onChange={(e) => toggleOne(id, e.target.checked)}
                      aria-label={`Select client ${client.company_name}`}
                      className="h-4 w-4 accent-orange-500"
                    />
                  </td>
                  <td className="px-6 py-5">
                    <Link
                      href={`/office/clients/${client.id}`}
                      className="font-black text-white text-sm uppercase tracking-tight hover:text-orange-400 transition-colors inline-block"
                    >
                      {client.company_name}
                    </Link>
                    {client.vat_number && (
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        VAT: {client.vat_number}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {client.category ? (
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                        CATEGORY_COLORS[client.category] || 'bg-slate-800/50 text-slate-400'
                      }`}>
                        {client.category}
                      </span>
                    ) : (
                      <span className="text-slate-700 text-[10px] font-bold">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-slate-200 text-sm font-bold">{client.contact_person || 'N/A'}</p>
                    <p className="text-slate-500 text-xs">{client.job_title}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-300 text-xs font-medium">{client.email || 'No Email'}</p>
                      <p className="text-slate-500 text-[10px] font-bold">{client.phone || ''}</p>
                      {client.email_missing && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500">
                          <MailX size={10} /> Email Missing
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${
                        client.is_active ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {client.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {/* Outstanding Balance (Sage Import) */}
                  <td className="px-6 py-5 text-right">
                    {(client.opening_balance ?? 0) !== 0 ? (
                      <p className={`font-black text-sm ${
                        (client.opening_balance || 0) < 0 ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {formatCurrency(client.opening_balance || 0)}
                      </p>
                    ) : (
                      <span className="text-slate-700 text-[10px] font-bold">—</span>
                    )}
                  </td>
                  {/* Invoice Total */}
                  <td className="px-6 py-5 text-right">
                    <p
                      className={`font-black text-sm ${
                        (client.outstanding_balance || 0) > 0 ? 'text-amber-500' : 'text-slate-600'
                      }`}
                    >
                      {formatCurrency(client.outstanding_balance || 0)}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/office/clients/${client.id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        href={`/office/clients/${client.id}/edit`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="Edit Client"
                      >
                        <Edit2 size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteClients}
        items={clientsToDelete}
        itemType="client"
      />
    </div>
  );
}

