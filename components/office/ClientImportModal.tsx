'use client';

import { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  MailX,
  Wallet,
  Tag,
} from 'lucide-react';
import { motion } from 'motion/react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'success';

interface Mapping {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  physical_address: string;
  vat_number: string;
  category: string;
  opening_balance: string;
  is_active: string;
}

interface ImportSummary {
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  missingEmail: number;
  totalBalance: number;
  clientsWithBalance: Array<{ name: string; balance: number }>;
}

const DASHBOARD_FIELDS = [
  { key: 'company_name',    label: 'Company Name',    required: true  },
  { key: 'contact_person',  label: 'Contact Person',  required: false },
  { key: 'email',           label: 'Email',           required: false },
  { key: 'phone',           label: 'Phone',           required: false },
  { key: 'physical_address',label: 'Physical Address',required: false },
  { key: 'vat_number',      label: 'VAT Number',      required: false },
  { key: 'category',        label: 'Category',        required: false },
  { key: 'opening_balance', label: 'Opening Balance', required: false },
  { key: 'is_active',       label: 'Active Status',   required: false },
];

// Sage column name → internal field key
const SAGE_MAP: Record<string, string[]> = {
  company_name:     ['Name', 'Customer Name', 'Company', 'Organization', 'Account Name'],
  contact_person:   ['Contact Name', 'Contact', 'Attn', 'Buyer', 'Primary Contact', 'Contact Person'],
  email:            ['Email', 'Email Address', 'Contact Email', 'Mail'],
  phone:            ['Telephone', 'Tel', 'Mobile', 'Contact Number', 'Phone'],
  physical_address: ['Address', 'Address Line 1', 'Street', 'Location', 'Physical Address'],
  vat_number:       ['VAT', 'Tax', 'Tax Number', 'VAT Registration Number'],
  category:         ['Category', 'Client Category', 'Type'],
  opening_balance:  ['Balance', 'Opening Balance', 'Amount Due', 'Current Balance'],
  is_active:        ['Active', 'Status', 'Is Active'],
};

const CATEGORY_COLORS: Record<string, string> = {
  'Service Support':      'bg-blue-500/10 text-blue-400',
  'Projects':             'bg-orange-500/10 text-orange-400',
  'Back up Power Supply': 'bg-green-500/10 text-green-400',
  'Software Support':     'bg-purple-500/10 text-purple-400',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 })
    .format(amount)
    .replace('ZAR', 'R');

/** Strip Sage's 3-row header block and return the data rows + detected column names */
function stripSageHeaders(rawRows: any[]): { cleaned: any[]; isSageFormat: boolean } {
  if (!rawRows || rawRows.length === 0) return { cleaned: rawRows, isSageFormat: false };

  const SAGE_KNOWN_COLS = new Set(['name', 'category', 'active', 'contact name', 'telephone', 'balance']);
  const firstKeys = Object.keys(rawRows[0] || {}).map(k => k.toLowerCase().trim());
  const isSageFormat = firstKeys.some(k => SAGE_KNOWN_COLS.has(k));

  if (isSageFormat) return { cleaned: rawRows, isSageFormat: true };

  // Look for the real header row (scan first 6 rows)
  const scan = rawRows.slice(0, 6);
  for (let i = 0; i < scan.length; i++) {
    const vals = Object.values(scan[i] || {}).map((v: any) => String(v).toLowerCase().trim());
    if (vals.some(v => SAGE_KNOWN_COLS.has(v))) {
      // Row i's VALUES are the real headers — skip rows 0..i, re-key with row i
      const headerRow = scan[i];
      const headerKeys = Object.values(headerRow) as string[];
      const dataRows = rawRows.slice(i + 1).map(row => {
        const srcVals = Object.values(row) as any[];
        const mapped: Record<string, any> = {};
        headerKeys.forEach((hk, idx) => {
          if (hk) mapped[hk] = srcVals[idx];
        });
        return mapped;
      });
      return { cleaned: dataRows.filter(r => Object.values(r).some(v => v !== '' && v != null)), isSageFormat: true };
    }
  }

  return { cleaned: rawRows, isSageFormat: false };
}

/** For Sage CSV parsed without header:true – parse raw text and skip first 3 rows */
function parseSageRaw(csvText: string): { rows: any[]; headers: string[] } {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
  // Find the line whose values match Sage column names
  let headerLineIdx = -1;
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const vals = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').toLowerCase().trim());
    if (vals.includes('name') && (vals.includes('category') || vals.includes('balance'))) {
      headerLineIdx = i;
      break;
    }
  }

  if (headerLineIdx === -1) return { rows: [], headers: [] };

  const headerText = lines[headerLineIdx];
  const dataText = lines.slice(headerLineIdx + 1).join('\n');
  const result = Papa.parse(headerText + '\n' + dataText, { header: true, skipEmptyLines: true });
  return {
    rows: result.data as any[],
    headers: Object.keys((result.data[0] as any) || {}),
  };
}

export default function ClientImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (summary: ImportSummary) => void;
}) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Mapping>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary>({
    imported: 0, skippedDuplicates: 0, skippedInvalid: 0,
    missingEmail: 0, totalBalance: 0, clientsWithBalance: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // ── File parsing ────────────────────────────────────────────────────────────
  const processData = (rows: any[], cols: string[]) => {
    setRawData(rows);
    setHeaders(cols);
    autoMap(cols);
    setStep('mapping');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setError('Please upload a valid .csv or .xlsx file');
      return;
    }
    setFile(f);
    setError(null);
    parseFile(f);
  };

  const parseFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      // First pass: raw text to detect and skip Sage header block
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const { rows, headers: hdrs } = parseSageRaw(text);
        if (rows.length > 0 && hdrs.length > 0) {
          processData(rows, hdrs);
          return;
        }
        // Fallback: normal CSV
        Papa.parse(f, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            if (res.data.length === 0) { setError('This file appears to be empty'); setFile(null); return; }
            const { cleaned } = stripSageHeaders(res.data);
            const cols = Object.keys(cleaned[0] || {});
            processData(cleaned, cols);
          },
          error: () => { setError('Failed to parse CSV file'); setFile(null); },
        });
      };
      reader.readAsText(f);
    } else if (ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws);
          if (json.length === 0) { setError('This file appears to be empty'); setFile(null); return; }
          const { cleaned } = stripSageHeaders(json);
          processData(cleaned, Object.keys(cleaned[0] || {}));
        } catch { setError('Failed to parse Excel file'); setFile(null); }
      };
      reader.readAsArrayBuffer(f);
    }
  };

  // ── Auto-mapping ────────────────────────────────────────────────────────────
  const autoMap = (cols: string[]) => {
    const newMap: Partial<Mapping> = {};
    DASHBOARD_FIELDS.forEach(field => {
      const possible = SAGE_MAP[field.key] || [];
      const match = cols.find(c =>
        c.toLowerCase().trim() === field.label.toLowerCase() ||
        possible.some(p => c.toLowerCase().trim() === p.toLowerCase())
      );
      if (match) newMap[field.key as keyof Mapping] = match;
    });
    setMapping(newMap);
  };

  // ── Mapping confirmed → build preview ──────────────────────────────────────
  const handleMappingConfirm = () => {
    const missingRequired = DASHBOARD_FIELDS.filter(f => f.required && !mapping[f.key as keyof Mapping]);
    if (missingRequired.length > 0) {
      setError(`Please map required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    const processed = rawData.map((row, idx) => {
      const client: any = {};
      DASHBOARD_FIELDS.forEach(field => {
        const col = mapping[field.key as keyof Mapping];
        client[field.key] = col ? row[col] : '';
      });

      // Normalise opening_balance
      const rawBal = client.opening_balance;
      client.opening_balance = rawBal !== '' && rawBal != null
        ? parseFloat(String(rawBal).replace(/[^0-9.\-]/g, '')) || 0
        : 0;

      // Normalise is_active
      const rawActive = String(client.is_active || '').toLowerCase().trim();
      client.is_active = rawActive === 'no' || rawActive === 'false' || rawActive === '0' ? false : true;

      // email_missing flag
      client.email_missing = !client.email || String(client.email).trim() === '';

      const errors: string[] = [];
      if (!client.company_name?.trim()) errors.push('Missing Company Name');
      const noContact = !client.email?.trim() && !client.phone?.trim();

      return { ...client, _rowId: idx, errors, isValid: errors.length === 0, noContact };
    });

    setPreviewData(processed);
    setStep('preview');
    setError(null);
  };

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    const validRows = previewData.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Duplicate check by company_name (since email is now optional)
      const { data: existing, error: fetchErr } = await supabase
        .from('clients')
        .select('company_name, email');
      if (fetchErr) throw fetchErr;

      const existingNames = new Set(existing?.map(c => c.company_name?.toLowerCase()) || []);
      const existingEmails = new Set(existing?.map(c => c.email?.toLowerCase()).filter(Boolean) || []);

      const toImport: any[] = [];
      let skippedDuplicates = 0;

      for (const row of validRows) {
        const nameLower = row.company_name?.toLowerCase();
        const emailLower = row.email?.toLowerCase();
        const isDuplicate =
          existingNames.has(nameLower) ||
          (emailLower && existingEmails.has(emailLower));

        if (isDuplicate) {
          skippedDuplicates++;
        } else {
          toImport.push({
            company_name:    row.company_name?.trim(),
            contact_person:  row.contact_person?.trim() || null,
            email:           row.email?.trim() || null,
            phone:           row.phone?.trim() || null,
            physical_address:row.physical_address?.trim() || null,
            vat_number:      row.vat_number?.trim() || null,
            category:        row.category?.trim() || null,
            opening_balance: row.opening_balance || 0,
            is_active:       row.is_active,
            email_missing:   row.email_missing,
          });
          existingNames.add(nameLower);
          if (emailLower) existingEmails.add(emailLower);
        }
      }

      if (toImport.length > 0) {
        const { data: insertedClients, error: insertErr } = await supabase
          .from('clients')
          .insert(toImport)
          .select('id, company_name, contact_person, phone');
        if (insertErr) throw insertErr;

        const contactRows = (insertedClients || [])
          .filter((c: any) => {
            const name = c.contact_person?.trim();
            return name && name !== '' && name.toUpperCase() !== 'N/A';
          })
          .map((c: any) => ({
            client_id: c.id,
            contact_type: 'General',
            full_name: c.contact_person.trim(),
            cell_number: c.phone?.trim() || null,
            is_primary: true,
          }));

        if (contactRows.length > 0) {
          const { error: contactErr } = await supabase.from('client_contacts').insert(contactRows);
          if (contactErr) {
            console.error('Failed to create contact records:', contactErr);
          }
        }
      }

      const missingEmail = toImport.filter(r => r.email_missing).length;
      const totalBalance = toImport.reduce((s, r) => s + (r.opening_balance || 0), 0);
      const clientsWithBalance = toImport
        .filter(r => r.opening_balance !== 0)
        .map(r => ({ name: r.company_name, balance: r.opening_balance }))
        .sort((a, b) => b.balance - a.balance);

      const importSummary: ImportSummary = {
        imported: toImport.length,
        skippedDuplicates,
        skippedInvalid: previewData.length - validRows.length,
        missingEmail,
        totalBalance,
        clientsWithBalance,
      };

      setSummary(importSummary);
      setStep('success');
      onImportComplete?.(importSummary);
      router.refresh();
    } catch (err: any) {
      setError('Import failed. Please try again.');
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const header = 'Company Name,Contact Person,Email,Phone,Physical Address,VAT Number,Category,Opening Balance,Active Status';
    const row = 'Acme Corp,John Doe,john@acme.com,0111234567,123 Main St,4940295068,Service Support,0.00,Yes';
    const blob = new Blob([header + '\n' + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null); setRawData([]); setHeaders([]);
    setMapping({}); setPreviewData([]); setStep('upload'); setError(null);
  };

  // ── Preview computed values ─────────────────────────────────────────────────
  const previewTotal = previewData.reduce((s, r) => s + (r.opening_balance || 0), 0);
  const previewMissingEmail = previewData.filter(r => r.email_missing).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#151B28] border border-slate-800 w-full max-w-5xl max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-widest text-xs">Import Clients</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                {step === 'upload'  && 'Step 1: Upload File'}
                {step === 'mapping' && 'Step 2: Map Columns'}
                {step === 'preview' && 'Step 3: Preview & Validate'}
                {step === 'success' && 'Import Complete'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1"><X size={22} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 pb-10 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest">
              <AlertCircle size={18} />{error}
            </div>
          )}

          {/* ── STEP: UPLOAD ─────────────────────────────────────────────── */}
          {step === 'upload' && (
            <div className="space-y-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 rounded-2xl py-20 flex flex-col items-center justify-center group hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-all mb-4">
                  <FileText size={32} />
                </div>
                <p className="text-white font-black uppercase tracking-widest text-sm mb-2">Click to select CSV or Excel</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Supports .csv and .xlsx — Sage exports detected automatically</p>
                <input type="file" accept=".csv,.xlsx" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              </div>

              {/* Sage format info */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 space-y-2">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> Sage Export Format Detected Automatically
                </p>
                <p className="text-slate-400 text-xs font-medium">
                  The importer automatically skips Sage's 3-row header block and maps: <span className="text-white font-black">Name → Company, Category, Active, Contact Name → Contact Person, Telephone → Phone, Balance → Opening Balance.</span>
                </p>
              </div>

              <div className="flex justify-center">
                <button onClick={downloadTemplate} className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors font-black text-[10px] uppercase tracking-widest">
                  <Download size={14} /> Download CSV Template
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: MAPPING ────────────────────────────────────────────── */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <p className="text-slate-400 text-xs font-medium">
                Match your file columns to the dashboard fields. Columns detected from the Sage export have been auto-mapped. Email is <span className="text-amber-400 font-black">optional</span> — missing emails will be flagged for follow-up.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DASHBOARD_FIELDS.map(field => (
                  <div key={field.key} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                      {field.key === 'email' && <span className="text-amber-500/70 ml-1">(optional)</span>}
                    </label>
                    <select
                      value={mapping[field.key as keyof Mapping] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    >
                      <option value="">-- Skip Field --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    {mapping[field.key as keyof Mapping] && (
                      <p className="text-[9px] text-green-500 font-bold">✓ Mapped to: {mapping[field.key as keyof Mapping]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: PREVIEW ────────────────────────────────────────────── */}
          {step === 'preview' && (
            <div className="space-y-5">
              {/* Summary bar */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-orange-500" />
                  <div>
                    <p className="text-white font-black text-xs uppercase tracking-widest">{file?.name}</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase">{previewData.length} total rows</p>
                  </div>
                </div>
                <div className="flex gap-6 ml-auto">
                  <div className="text-right">
                    <p className="text-green-500 font-black text-sm">{previewData.filter(r => r.isValid).length}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Ready</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-500 font-black text-sm">{previewData.filter(r => !r.isValid).length}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Invalid</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-500 font-black text-sm">{previewMissingEmail}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">No Email</p>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {previewData.filter(r => !r.isValid).length > 0 && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest">
                  <AlertCircle size={16} />
                  {previewData.filter(r => !r.isValid).length} rows are missing Company Name and will be skipped.
                </div>
              )}
              {previewMissingEmail > 0 && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  <MailX size={16} className="shrink-0 mt-0.5" />
                  <span>{previewMissingEmail} client{previewMissingEmail !== 1 ? 's' : ''} imported without an email address — please update these records manually after import.</span>
                </div>
              )}
              {previewData.filter(r => r.noContact).length > 0 && (
                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex items-center gap-3 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                  <AlertTriangle size={16} />
                  {previewData.filter(r => r.noContact).length} rows have neither email nor phone — these are highlighted in the table below.
                </div>
              )}

              {/* Preview table */}
              <div className="bg-[#0B0F19] rounded-xl border border-slate-800 overflow-hidden isolate">
                <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-500 text-[9px] uppercase font-black bg-slate-900/80 border-b border-slate-800">
                        <th className="px-4 py-3 min-w-[160px]">Company Name</th>
                        <th className="px-4 py-3 min-w-[120px]">Category</th>
                        <th className="px-4 py-3 min-w-[160px]">Contact / Email</th>
                        <th className="px-4 py-3 min-w-[100px] text-right">Balance</th>
                        <th className="px-4 py-3">Active</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {previewData.slice(0, 10).map((row, i) => {
                        const rowBg = !row.isValid
                          ? 'bg-red-500/10 text-red-400'
                          : row.noContact
                          ? 'bg-orange-500/5 text-slate-300'
                          : 'text-slate-300';
                        const catColor = CATEGORY_COLORS[row.category] || 'bg-slate-800/50 text-slate-500';
                        return (
                          <tr key={i} className={`text-[10px] font-bold ${rowBg}`}>
                            <td className="px-4 py-3 truncate max-w-[160px]">
                              {row.company_name || <span className="text-red-500/50 italic">Missing</span>}
                            </td>
                            <td className="px-4 py-3">
                              {row.category
                                ? <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${catColor}`}>{row.category}</span>
                                : <span className="text-slate-700">—</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-0.5">
                                <p>{row.contact_person || <span className="text-slate-600 italic">No contact</span>}</p>
                                {row.email_missing
                                  ? <p className="text-amber-500 flex items-center gap-1 text-[9px]"><MailX size={9} /> No email</p>
                                  : <p className="text-slate-500 text-[9px]">{row.email}</p>
                                }
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-right font-black ${row.opening_balance < 0 ? 'text-red-400' : row.opening_balance > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                              {row.opening_balance !== 0 ? formatCurrency(row.opening_balance) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${row.is_active ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                                {row.is_active ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {row.isValid
                                ? <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> Valid</span>
                                : <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {row.errors[0]}</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 10 && (
                  <div className="p-3 text-center bg-slate-900/50 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Showing first 10 of {previewData.length} rows</p>
                  </div>
                )}
              </div>

              {/* Balance total */}
              {previewTotal !== 0 && (
                <div className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                  <Wallet size={16} className="text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-400 font-medium">
                    Total opening balance across all clients:{' '}
                    <span className={`font-black ${previewTotal < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatCurrency(previewTotal)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: SUCCESS ─────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="space-y-8 py-4">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto">
                  <CheckCircle2 size={48} />
                </div>
                <h4 className="text-white font-black uppercase tracking-tight text-xl">Import Successful</h4>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-green-500 text-2xl font-black">{summary.imported}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Imported</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-amber-500 text-2xl font-black">{summary.skippedDuplicates}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Duplicates</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-red-500 text-2xl font-black">{summary.skippedInvalid}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Skipped</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                  <p className="text-amber-400 text-2xl font-black">{summary.missingEmail}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">No Email</p>
                </div>
              </div>

              {/* Balance summary */}
              {summary.totalBalance !== 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-amber-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Total Outstanding Balance:{' '}
                      <span className={`${summary.totalBalance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                        {formatCurrency(summary.totalBalance)}
                      </span>{' '}
                      across {summary.clientsWithBalance.length} client{summary.clientsWithBalance.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {summary.clientsWithBalance.length > 0 && (
                    <div className="max-h-40 overflow-y-auto min-h-0 space-y-1.5 custom-scrollbar pr-2 leading-relaxed">
                      {summary.clientsWithBalance.slice(0, 15).map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate">{c.name}</span>
                          <span className={`font-black ml-4 shrink-0 ${c.balance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                            {formatCurrency(c.balance)}
                          </span>
                        </div>
                      ))}
                      {summary.clientsWithBalance.length > 15 && (
                        <p className="text-[10px] text-slate-600 font-bold">+{summary.clientsWithBalance.length - 15} more…</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Missing email notice */}
              {summary.missingEmail > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <MailX size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400 font-medium">
                    <span className="font-black">{summary.missingEmail} client{summary.missingEmail !== 1 ? 's' : ''}</span> imported without an email address — please update these records manually. They are flagged with a yellow badge on the client list.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={reset}
                  className="px-6 py-3 border border-slate-700 rounded-sm font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                >
                  Import Another File
                </button>
                <button
                  onClick={onClose}
                  className="bg-orange-500 hover:bg-orange-600 px-10 py-3 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl shadow-orange-500/20"
                >
                  View Clients
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step !== 'success' && step !== 'upload' && (
          <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/30 shrink-0">
            <button
              onClick={() => step === 'preview' ? setStep('mapping') : reset()}
              disabled={loading}
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {step === 'mapping' && (
                <button
                  onClick={handleMappingConfirm}
                  className="bg-orange-500 hover:bg-orange-600 px-7 py-2.5 rounded-sm font-black text-[10px] uppercase tracking-widest text-white transition-all flex items-center gap-2"
                >
                  Continue <ChevronRight size={14} />
                </button>
              )}
              {step === 'preview' && (
                <button
                  onClick={handleImport}
                  disabled={loading || previewData.filter(r => r.isValid).length === 0}
                  className="bg-orange-500 hover:bg-orange-600 px-7 py-2.5 rounded-sm font-black text-[10px] uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                  Confirm Import ({previewData.filter(r => r.isValid).length})
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
