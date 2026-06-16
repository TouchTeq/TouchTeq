'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { parse as parseDate, format as formatDate, isValid } from 'date-fns';
import { Upload, Loader2, ArrowLeft, ArrowRight, AlertTriangle, FileText, FileCode, ClipboardPaste } from 'lucide-react';
import Link from 'next/link';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { createImport, type ParsedRow } from '@/lib/bank/actions';
import { parseAmount, parseOfx, parseStatementText } from '@/lib/bank/parsers';

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

type Mode = 'csv' | 'ofx' | 'paste';

export default function ImportClient() {
  const router = useRouter();
  const toast = useOfficeToast();

  const [mode, setMode] = useState<Mode>('csv');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bankName, setBankName] = useState('FNB');
  const [dateFmt, setDateFmt] = useState(DATE_FORMATS[0].fmt);

  // CSV state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [amountMode, setAmountMode] = useState<'single' | 'split'>('single');
  const [dateCol, setDateCol] = useState('');
  const [descCol, setDescCol] = useState('');
  const [refCol, setRefCol] = useState(NONE);
  const [amountCol, setAmountCol] = useState('');
  const [debitCol, setDebitCol] = useState('');
  const [creditCol, setCreditCol] = useState('');
  const [balanceCol, setBalanceCol] = useState(NONE);

  // OFX / paste state
  const [ofxRows, setOfxRows] = useState<ParsedRow[]>([]);
  const [pasteText, setPasteText] = useState('');

  const resetAll = () => {
    setFileName('');
    setHeaders([]);
    setRows([]);
    setOfxRows([]);
    setPasteText('');
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    resetAll();
  };

  const handleCsvFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const hdrs = (result.meta.fields ?? []).filter(Boolean);
        setHeaders(hdrs);
        setRows(result.data);
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

  const handleOfxFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseOfx(String(reader.result));
        if (parsed.length === 0) {
          toast.error({ title: 'No transactions', message: 'No OFX transactions found in that file.' });
        }
        setOfxRows(parsed);
      } catch {
        toast.error({ title: 'Parse failed', message: 'Could not read that OFX file.' });
      }
    };
    reader.readAsText(file);
  };

  const csvParsed = useMemo(() => {
    if (mode !== 'csv') return { parsed: [] as ParsedRow[], invalidCount: 0 };
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
  }, [mode, rows, dateCol, descCol, refCol, amountCol, debitCol, creditCol, balanceCol, amountMode, dateFmt]);

  const pasteParsed = useMemo(
    () => (mode === 'paste' && pasteText.trim() ? parseStatementText(pasteText, dateFmt) : []),
    [mode, pasteText, dateFmt]
  );

  const parsed: ParsedRow[] =
    mode === 'csv' ? csvParsed.parsed : mode === 'ofx' ? ofxRows : pasteParsed;
  const invalidCount = mode === 'csv' ? csvParsed.invalidCount : 0;

  const canSubmit =
    parsed.length > 0 &&
    (mode !== 'csv' || (!!dateCol && (amountMode === 'single' ? !!amountCol : !!debitCol && !!creditCol)));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await createImport(parsed, { source: mode === 'ofx' ? 'ofx' : 'csv', bank_name: bankName, file_name: fileName || `${mode} import` });
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

  const hasInput = mode === 'csv' ? headers.length > 0 : parsed.length > 0 || (mode === 'paste' && pasteText.length > 0);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/office/bank" className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Import Statement</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">CSV, OFX/QFX, or pasted text</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { m: 'csv' as Mode, label: 'CSV file', Icon: FileText },
          { m: 'ofx' as Mode, label: 'OFX / QFX file', Icon: FileCode },
          { m: 'paste' as Mode, label: 'Paste text (PDF)', Icon: ClipboardPaste },
        ]).map(({ m, label, Icon }) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              mode === m ? 'bg-orange-500 text-white' : 'bg-[#151B28] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Bank selector (shared) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Bank</label>
          <select className={selectClass} value={bankName} onChange={(e) => setBankName(e.target.value)}>
            {BANKS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        {(mode === 'csv' || mode === 'paste') && (
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Date format</label>
            <select className={selectClass} value={dateFmt} onChange={(e) => setDateFmt(e.target.value)}>
              {DATE_FORMATS.map((d) => (
                <option key={d.fmt} value={d.fmt}>{d.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── CSV ─────────────────────────────────────────────── */}
      {mode === 'csv' && headers.length === 0 && (
        <label className="block bg-[#151B28] border-2 border-dashed border-slate-700 hover:border-orange-500/50 rounded-xl p-12 text-center cursor-pointer transition-colors">
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />
          <Upload size={40} className="text-slate-500 mx-auto mb-4" />
          <p className="text-white font-black uppercase">Choose a CSV file</p>
          <p className="text-slate-500 text-sm mt-1">FNB, Standard Bank, ABSA, Nedbank, Capitec &amp; more</p>
        </label>
      )}

      {mode === 'csv' && headers.length > 0 && (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black uppercase text-sm">Map columns — {fileName}</h2>
            <button onClick={resetAll} className="text-slate-400 hover:text-white text-xs font-bold uppercase">Change file</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Amount style</label>
              <select className={selectClass} value={amountMode} onChange={(e) => setAmountMode(e.target.value as 'single' | 'split')}>
                <option value="single">Single signed amount column</option>
                <option value="split">Separate debit / credit columns</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Date column *</label>
              <select className={selectClass} value={dateCol} onChange={(e) => setDateCol(e.target.value)}>
                <option value="">— select —</option>
                {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Description column</label>
              <select className={selectClass} value={descCol} onChange={(e) => setDescCol(e.target.value)}>
                <option value="">— select —</option>
                {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Reference column</label>
              <select className={selectClass} value={refCol} onChange={(e) => setRefCol(e.target.value)}>
                <option value={NONE}>— none —</option>
                {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
              </select>
            </div>
            {amountMode === 'single' ? (
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Amount column *</label>
                <select className={selectClass} value={amountCol} onChange={(e) => setAmountCol(e.target.value)}>
                  <option value="">— select —</option>
                  {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Debit (out) *</label>
                  <select className={selectClass} value={debitCol} onChange={(e) => setDebitCol(e.target.value)}>
                    <option value="">— select —</option>
                    {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Credit (in) *</label>
                  <select className={selectClass} value={creditCol} onChange={(e) => setCreditCol(e.target.value)}>
                    <option value="">— select —</option>
                    {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Balance column</label>
              <select className={selectClass} value={balanceCol} onChange={(e) => setBalanceCol(e.target.value)}>
                <option value={NONE}>— none —</option>
                {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── OFX ─────────────────────────────────────────────── */}
      {mode === 'ofx' && ofxRows.length === 0 && (
        <label className="block bg-[#151B28] border-2 border-dashed border-slate-700 hover:border-orange-500/50 rounded-xl p-12 text-center cursor-pointer transition-colors">
          <input type="file" accept=".ofx,.qfx,text/xml,application/x-ofx" className="hidden" onChange={(e) => e.target.files?.[0] && handleOfxFile(e.target.files[0])} />
          <Upload size={40} className="text-slate-500 mx-auto mb-4" />
          <p className="text-white font-black uppercase">Choose an OFX / QFX file</p>
          <p className="text-slate-500 text-sm mt-1">Structured bank export — no column mapping needed</p>
        </label>
      )}

      {/* ── Paste ───────────────────────────────────────────── */}
      {mode === 'paste' && (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-3">
          <p className="text-amber-400/80 text-xs flex items-center gap-2">
            <AlertTriangle size={14} /> Best-effort parsing — paste rows from your PDF/email statement, then check every line in the preview before importing.
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'27/03/2026  EFT PAYMENT - ACME LTD  1,234.56  10,250.00\n28/03/2026  CARD PURCHASE FUEL  -850.00  9,400.00'}
            rows={10}
            className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-orange-500 outline-none"
          />
        </div>
      )}

      {/* ── Shared preview + submit ─────────────────────────── */}
      {hasInput && (
        <>
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
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
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${p.amount >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
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
