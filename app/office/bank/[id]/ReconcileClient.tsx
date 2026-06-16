'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  Sparkles,
  Link2,
  Undo2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import {
  autoMatchImport,
  confirmInvoiceMatch,
  assignInvoiceToTxn,
  matchExpenseToTxn,
  ignoreTxn,
  unmatchTxn,
} from '@/lib/bank/actions';

const formatRand = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })
    .format(Math.abs(amount) || 0)
    .replace('ZAR', 'R');

interface Txn {
  id: string;
  txn_date: string;
  description: string | null;
  reference: string | null;
  amount: number;
  direction: 'in' | 'out';
  status: 'unmatched' | 'suggested' | 'matched' | 'ignored';
  matched_type: string | null;
  matched_id: string | null;
  match_confidence: number | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  balance_due: number;
  total: number;
  clients?: { company_name: string } | null;
}

interface Expense {
  id: string;
  supplier_name: string | null;
  description: string | null;
  amount_inclusive: number;
  expense_date: string;
}

export default function ReconcileClient({
  importId,
  statementImport,
  transactions,
  openInvoices,
  expenses,
}: {
  importId: string;
  statementImport: any;
  transactions: Txn[];
  openInvoices: Invoice[];
  expenses: Expense[];
}) {
  const router = useRouter();
  const toast = useOfficeToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const invoiceById = (id: string | null) => openInvoices.find((i) => i.id === id);

  const run = async (id: string, fn: () => Promise<{ error?: string; success?: boolean } | any>, okMsg?: string) => {
    setPendingId(id);
    try {
      const res = await fn();
      if (res && 'error' in res && res.error) {
        toast.error({ title: 'Action failed', message: res.error });
        return;
      }
      if (okMsg) toast.success({ title: 'Done', message: okMsg });
      startTransition(() => router.refresh());
    } catch (err: any) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setPendingId(null);
    }
  };

  const handleAutoMatch = async () => {
    setPendingId('auto');
    try {
      const res = await autoMatchImport(importId);
      toast.success({ title: 'Auto-match complete', message: `${res.suggested} suggestions found.` });
      startTransition(() => router.refresh());
    } finally {
      setPendingId(null);
    }
  };

  const counts = {
    unmatched: transactions.filter((t) => t.status === 'unmatched').length,
    suggested: transactions.filter((t) => t.status === 'suggested').length,
    matched: transactions.filter((t) => t.status === 'matched').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/office/bank" className="text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">
              {statementImport.bank_name || 'Statement'}
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
              {statementImport.date_from && statementImport.date_to
                ? `${format(parseISO(statementImport.date_from), 'dd MMM')} – ${format(
                    parseISO(statementImport.date_to),
                    'dd MMM yyyy'
                  )}`
                : statementImport.file_name}
            </p>
          </div>
        </div>
        <button
          onClick={handleAutoMatch}
          disabled={pendingId === 'auto'}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-all font-black text-xs uppercase tracking-widest text-white px-5 py-2.5 rounded-sm"
        >
          {pendingId === 'auto' ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          Auto-match invoices
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-4">
          <p className="text-slate-500 text-[10px] font-black uppercase">Unmatched</p>
          <p className="text-2xl font-black text-white">{counts.unmatched}</p>
        </div>
        <div className="bg-[#151B28] border border-amber-500/30 rounded-xl p-4">
          <p className="text-amber-400 text-[10px] font-black uppercase">Suggested</p>
          <p className="text-2xl font-black text-amber-400">{counts.suggested}</p>
        </div>
        <div className="bg-[#151B28] border border-green-500/30 rounded-xl p-4">
          <p className="text-green-400 text-[10px] font-black uppercase">Matched</p>
          <p className="text-2xl font-black text-green-400">{counts.matched}</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
              <th className="text-left p-4 font-black">Date</th>
              <th className="text-left p-4 font-black">Description</th>
              <th className="text-right p-4 font-black">Amount</th>
              <th className="text-left p-4 font-black">Match</th>
              <th className="text-right p-4 font-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {transactions.map((txn) => {
              const busy = pendingId === txn.id;
              const suggestedInv = invoiceById(txn.matched_id);
              return (
                <tr key={txn.id} className={`hover:bg-slate-800/20 ${txn.status === 'ignored' ? 'opacity-40' : ''}`}>
                  <td className="p-4 text-slate-400 whitespace-nowrap">
                    {format(parseISO(txn.txn_date), 'dd MMM')}
                  </td>
                  <td className="p-4 text-slate-300 max-w-xs truncate">
                    {txn.description || txn.reference || '—'}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <span className={`font-bold inline-flex items-center gap-1 ${txn.direction === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                      {txn.direction === 'in' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {formatRand(txn.amount)}
                    </span>
                  </td>
                  <td className="p-4">
                    {txn.status === 'matched' ? (
                      <span className="text-[10px] px-2 py-1 rounded font-black uppercase bg-green-500/20 text-green-400">
                        {txn.matched_type === 'payment' ? 'Payment recorded' : 'Matched'}
                      </span>
                    ) : txn.status === 'ignored' ? (
                      <span className="text-[10px] px-2 py-1 rounded font-black uppercase bg-slate-700 text-slate-400">
                        Ignored
                      </span>
                    ) : txn.direction === 'in' ? (
                      <select
                        value={txn.matched_id ?? ''}
                        onChange={(e) =>
                          e.target.value && run(txn.id, () => assignInvoiceToTxn(txn.id, e.target.value))
                        }
                        className="bg-[#0B0F19] border border-slate-800 rounded px-2 py-1 text-white text-xs max-w-[220px]"
                      >
                        <option value="">
                          {txn.status === 'suggested' && suggestedInv
                            ? `Suggested: ${suggestedInv.invoice_number}`
                            : '— pick invoice —'}
                        </option>
                        {openInvoices.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoice_number} · {inv.clients?.company_name ?? ''} · {formatRand(inv.balance_due)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={txn.matched_id ?? ''}
                        onChange={(e) =>
                          e.target.value && run(txn.id, () => matchExpenseToTxn(txn.id, e.target.value), 'Linked to expense')
                        }
                        className="bg-[#0B0F19] border border-slate-800 rounded px-2 py-1 text-white text-xs max-w-[220px]"
                      >
                        <option value="">— link expense —</option>
                        {expenses.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.supplier_name || ex.description} · {formatRand(ex.amount_inclusive)}
                          </option>
                        ))}
                      </select>
                    )}
                    {txn.status === 'suggested' && txn.match_confidence != null && (
                      <span className="ml-2 text-[10px] text-slate-500">{txn.match_confidence}%</span>
                    )}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2 justify-end">
                      {busy && <Loader2 className="animate-spin text-orange-500" size={14} />}
                      {txn.status === 'matched' ? (
                        <button
                          onClick={() => run(txn.id, () => unmatchTxn(txn.id), 'Match undone')}
                          className="inline-flex items-center gap-1 text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
                          title="Undo match"
                        >
                          <Undo2 size={12} /> Undo
                        </button>
                      ) : txn.status === 'ignored' ? (
                        <button
                          onClick={() => run(txn.id, () => unmatchTxn(txn.id))}
                          className="text-xs text-slate-400 hover:text-white px-2 py-1"
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          {txn.direction === 'in' && txn.matched_id && (
                            <button
                              onClick={() =>
                                run(txn.id, () => confirmInvoiceMatch(txn.id), 'Payment recorded')
                              }
                              className="inline-flex items-center gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1 rounded"
                              title="Confirm & record payment"
                            >
                              <Check size={12} /> Confirm
                            </button>
                          )}
                          <button
                            onClick={() => run(txn.id, () => ignoreTxn(txn.id))}
                            className="inline-flex items-center gap-1 text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
                            title="Ignore"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <p className="p-8 text-center text-slate-500 text-sm">No transactions in this import.</p>
        )}
      </div>

      <p className="text-slate-600 text-xs flex items-center gap-2">
        <Link2 size={14} /> Confirming a money-in match records a payment against the invoice using the same
        safeguards as manual payments (no overpayment, no paid/cancelled invoices). Undo reverses it cleanly.
      </p>
    </div>
  );
}
