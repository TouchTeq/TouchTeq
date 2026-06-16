import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  Landmark,
  ArrowRight,
} from 'lucide-react';
import { getImports } from '@/lib/bank/actions';

export default async function BankPage() {
  const res = await getImports();
  const imports = ('data' in res ? res.data : []) ?? [];

  const totalImports = imports.length;
  const reconciled = imports.filter((i: any) => i.status === 'reconciled').length;
  const inProgress = imports.filter((i: any) => i.status !== 'reconciled').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Bank &amp; Reconcile</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Import statements &amp; match transactions to invoices
          </p>
        </div>
        <Link
          href="/office/bank/import"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm shadow-xl shadow-orange-500/20 w-fit"
        >
          <Upload size={16} />
          Import Statement
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Imports</p>
              <p className="text-2xl font-black text-white">{totalImports}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">In Progress</p>
              <p className="text-2xl font-black text-white">{inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Reconciled</p>
              <p className="text-2xl font-black text-white">{reconciled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Imports list */}
      {imports.length === 0 ? (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-12 text-center">
          <Landmark size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-black uppercase mb-2">No Statements Imported</h3>
          <p className="text-slate-500 text-sm mb-6">
            Upload a bank-statement CSV to auto-match payments to your invoices.
          </p>
          <Link
            href="/office/bank/import"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-bold text-sm uppercase tracking-widest"
          >
            Import your first statement <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
                <th className="text-left p-4 font-black">Statement</th>
                <th className="text-left p-4 font-black">Period</th>
                <th className="text-right p-4 font-black">Lines</th>
                <th className="text-right p-4 font-black">Matched</th>
                <th className="text-left p-4 font-black">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {imports.map((imp: any) => (
                <tr key={imp.id} className="hover:bg-slate-800/20">
                  <td className="p-4">
                    <p className="text-white font-bold">{imp.bank_name || 'Statement'}</p>
                    <p className="text-slate-500 text-xs">{imp.file_name || imp.account_label || '—'}</p>
                  </td>
                  <td className="p-4 text-slate-400">
                    {imp.date_from && imp.date_to
                      ? `${format(parseISO(imp.date_from), 'dd MMM')} – ${format(parseISO(imp.date_to), 'dd MMM yyyy')}`
                      : '—'}
                  </td>
                  <td className="p-4 text-right text-white">{imp.row_count}</td>
                  <td className="p-4 text-right text-white">{imp.matched_count}</td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] px-2 py-1 rounded font-black uppercase ${
                        imp.status === 'reconciled'
                          ? 'bg-green-500/20 text-green-400'
                          : imp.status === 'reconciling'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {imp.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/office/bank/${imp.id}`}
                      className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-400 font-bold text-xs uppercase tracking-widest"
                    >
                      Reconcile <ArrowRight size={14} />
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
