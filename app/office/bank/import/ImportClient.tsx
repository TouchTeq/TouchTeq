'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { parse as parseDate, format as formatDate, isValid } from 'date-fns';
import { Upload, Loader2, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { createImport, type ParsedRow } from '@/lib/bank/actions';

const DATE_FORMATS: { label: string; fmt: string }[] = [
  { label: '2026/03/27 (yyyy/mm/dd)', fmt: 'yyyy/MM/dd' },
  { label: '2026-03-27 (yyyy-mm-dd)', fmt: 'yyyy-MM-dd' },
  { label: '27/03/2026 (dd/mm/yyyy)', fmt: 'dd/MM/yyyy' },
  { label: '27-03-2026 (dd-mm-yyyy)', fmt: 'dd-MM-yyyy' },
  { label: '03/27/2026 (mm/dd/yyyy)', fmt: 'MM/dd/yyyy' },
  { label: '27 Mar 2026 (dd MMM yyyy)', fmt: 'dd MMM yyyy' },
];

const BANKS = ['FNB', 'Standard Bank', 'ABSA', 'Nedbank', 'Capitec', 'Investec', 'TymeBank', 'Other'];

const NONE = '__none__';

function parseAmount(raw: unknown): number {
  if (raw == null) return NaN;
  let s = String(raw).trim();
  if (!s) return NaN;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[^\d.,-]/g, '');
  if (s.includes('-')) {
    if (s.trimStart().startsWith('-')) negative = true;
    s = s.replace(/-/g, '');
  }
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasComma) {
    const after = s.split(',').pop() ?? '';
    if (after.length <= 2) s = s.replace(/,/g, '.');
    else s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  if (isNaN(n)) return NaN;
  return negative ? -n : n;
}

export default function ImportClient() {
  const router = useRouter();
  const toast = useOfficeToast();

  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // mapping
  const [bankName, setBankName] = useState('FNB');
  const [dateFmt, setDateFmt] = useState(DATE_FORMATS[0].fmt);
  const [amountMode, setAmountMode] = useState<'single' | 'split'>('single');
  const [dateCol, setDateCol] = useState('');
  const [descCol, setDescCol] = useState('');
  const [refCol, setRefCol] = useState(NONE);
  const [amountCol, setAmountCol] = useState('');
  const [debitCol, setDebitCol] = useState('');
  const [creditCol, setCreditCol] = useState('');
  const [balanceCol, setBalanceCol] = useState(NONE);

  const handleFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const hdrs = (result.meta.fields ?? []).filter(Boolean);
        setHeaders(hdrs);
        setRows(result.data);
        // best-effort auto-mapping by header name
        const find = (...needles: string[]) =>
          hdrs.find((h) => needles.some((n) => h.toLowerCase().includes(n))) ?? '';
        setDateCol(find('date'));
        setDescCol(find('description', 'narrative', 'detail', 'reference', 'memo'));
        setRefCol(find('reference', 'ref') || NONE);
        setAmountCol(find('amount'));
        setDebitCol(find('debit'));
        setCreditCol(find('credit'));
        setBalanceCol(find('balance') || NONE);
        if (find('debit') && find('credit')) setAmountMode('split');
      },
      error: () => toast.error({ title: 'Parse failed', message: 'Could not read that CSV file.' }),
    });
  };

  const { parsed, invalidCount } = useMemo(() => {
    if (!dateCol || (!descCol && refCol === NONE)) return { parsed: [] as ParsedRow[], invalidCount: 0 };
    const out: ParsedRow[] = [];
    let invalid = 0;
    for (const r of rows) {
      const dRaw = (r[dateCol] ?? '').trim();
      const d = parseDate(dRaw, dateFmt, new Date());
      if (!dRaw || !isValid(d)) {
        invalid += 1;
        continue;
      }
      let amount: number;
      if (amountMode === 'single') {
        amount = parseAmount(r[amountCol]);
      } else {
        const credit = parseAmount(r[creditCol]);
        const debit = parseAmount(r[debitCol]);
        const c = isNaN(credit) ? 0 : Math.abs(credit);
        const db = isNaN(debit) ? 0 : Math.abs(debit);
        amount = c - db;
      }
      if (isNaN(amount) || amount === 0) {
        invalid += 1;
        continue;
      }
      const bal = balanceCol !== NONE ? parseAmount(r[balanceCol]) : NaN;
      out.push({
        txn_date: formatDate(d, 'yyyy-MM-dd'),
        description: descCol ? (r[descCol] ?? '').trim() : '',
        reference: refCol !== NONE ? (r[refCol] ?? '').trim() : null,
        amount: Math.round(amount * 100) / 100,
        running_balance: isNaN(bal) ? null : bal,
      });
    }
    return { parsed: out, invalidCount: invalid };
  }, [rows, dateCol, descCol, refCol, amountCol, debitCol, creditCol, balanceCol, amountMode, dateFmt]);

  const canSubmit = parsed.length > 0 && !!dateCol && (amountMode === 'single' ? !!amountCol : !!debitCol && !!creditCol);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await createImport(parsed, { source: 'csv', bank_name: bankName, file_name: fileName });
      if ('error' in res && res.error) {
        toast.error({ title: 'Import failed', message: res.error });
        return;
      }
      const r = res as { importId: string; inserted: number; skipped: number };
      toast.success({
        title: 'Imported',
        message: `${r.inserted} transactions added${r.skipped ? `, ${r.skipped} duplicates skipped` : ''}.`,
      });
      router.push(`/office/bank/${r.importId}`);
    } catch (err: any) {
      toast.error({ title: 'Error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    'w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none';

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/office/bank" className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Import Statement</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Upload a CSV exported from your bank
          </p>
        </div>
      </div>

      {/* Step 1: file */}
      {headers.length === 0 ? (
        <label className="block bg-[#151B28] border-2 border-dashed border-slate-700 hover:border-orange-500/50 rounded-xl p-12 text-center cursor-pointer transition-colors">
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Upload size={40} className="text-slate-500 mx-auto mb-4" />
          <p className="text-white font-black uppercase">Choose a CSV file</p>
          <p className="text-slate-500 text-sm mt-1">FNB, Standard Bank, ABSA, Nedbank, Capitec &amp; more</p>
        </label>
      ) : (
        <>
          {/* Step 2: mapping */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black uppercase text-sm">Map columns — {fileName}</h2>
              <button
                onClick={() => {
                  setHeaders([]);
                  setRows([]);
                  setFileName('');
                }}
                className="text-slate-400 hover:text-white text-xs font-bold uppercase"
              >
                Change file
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Bank</label>
                <select className={selectClass} value={bankName} onChange={(e) => setBankName(e.target.value)}>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Date format</label>
                <select className={selectClass} value={dateFmt} onChange={(e) => setDateFmt(e.target.value)}>
                  {DATE_FORMATS.map((d) => (
                    <option key={d.fmt} value={d.fmt}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Amount style</label>
                <select
                  className={selectClass}
                  value={amountMode}
                  onChange={(e) => setAmountMode(e.target.value as 'single' | 'split')}
                >
                  <option value="single">Single signed amount column</option>
                  <option value="split">Separate debit / credit columns</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Date column *</label>
                <select className={selectClass} value={dateCol} onChange={(e) => setDateCol(e.target.value)}>
                  <option value="">— select —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Description column</label>
                <select className={selectClass} value={descCol} onChange={(e) => setDescCol(e.target.value)}>
                  <option value="">— select —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Reference column</label>
                <select className={selectClass} value={refCol} onChange={(e) => setRefCol(e.target.value)}>
                  <option value={NONE}>— none —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {amountMode === 'single' ? (
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Amount column *</label>
                  <select className={selectClass} value={amountCol} onChange={(e) => setAmountCol(e.target.value)}>
                    <option value="">— select —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Debit (out) *</label>
                    <select className={selectClass} value={debitCol} onChange={(e) => setDebitCol(e.target.value)}>
                      <option value="">— select —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Credit (in) *</label>
                    <select className={selectClass} value={creditCol} onChange={(e) => setCreditCol(e.target.value)}>
                      <option value="">— select —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Balance column</label>
                <select className={selectClass} value={balanceCol} onChange={(e) => setBalanceCol(e.target.value)}>
                  <option value={NONE}>— none —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {balanceCol === NONE && (
              <p className="text-amber-400/80 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> Without a balance column, two identical transactions on the same day
                may be treated as duplicates. Map it if your statement has one.
              </p>
            )}
          </div>

          {/* Step 3: preview */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-black uppercase text-sm">
                Preview — {parsed.length} valid{invalidCount > 0 ? `, ${invalidCount} skipped` : ''}
              </h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#151B28]">
                  <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
                    <th className="text-left p-3 font-black">Date</th>
                    <th className="text-left p-3 font-black">Description</th>
                    <th className="text-right p-3 font-black">Amount</th>
                    <th className="text-left p-3 font-black">Dir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {parsed.slice(0, 25).map((p, i) => (
                    <tr key={i}>
                      <td className="p-3 text-slate-300">{p.txn_date}</td>
                      <td className="p-3 text-slate-400 truncate max-w-md">{p.description || p.reference}</td>
                      <td className={`p-3 text-right font-bold ${p.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2 }).format(p.amount)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                            p.amount >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {p.amount >= 0 ? 'In' : 'Out'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
              Import {parsed.length} transactions
            </button>
          </div>
        </>
      )}
    </div>
  );
}
