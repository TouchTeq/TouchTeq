'use client';

import { useState, useRef, useEffect } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'success';

interface Mapping {
  invoice_number: string;
  client_name: string;
  issue_date: string;
  due_date: string;
  description: string;
  quantity: string;
  unit_price: string;
  vat_amount: string;
  total: string;
  status: string;
}

const INVOICE_FIELDS = [
  { key: 'invoice_number', label: 'Invoice Number', required: true },
  { key: 'client_name', label: 'Client Name', required: true },
  { key: 'issue_date', label: 'Invoice Date', required: false },
  { key: 'due_date', label: 'Due Date', required: false },
  { key: 'description', label: 'Line Item Description', required: false },
  { key: 'quantity', label: 'Quantity', required: false },
  { key: 'unit_price', label: 'Unit Price', required: false },
  { key: 'vat_amount', label: 'VAT Amount', required: false },
  { key: 'total', label: 'Total Amount', required: true },
  { key: 'status', label: 'Status', required: false },
];

const SAGE_MAP: Record<string, string[]> = {
  invoice_number: ['Inv No', 'Invoice Number'],
  client_name: ['Customer', 'Client', 'Customer Name'],
  issue_date: ['Inv Date', 'Date', 'Invoice Date'],
  due_date: ['Due Date', 'Payment Due'],
  description: ['Description', 'Details'],
  quantity: ['Qty', 'Quantity'],
  unit_price: ['Unit Price', 'Rate'],
  vat_amount: ['Tax', 'VAT'],
  total: ['Amount Incl', 'Total', 'Gross'],
  status: ['Status', 'Paid'],
};

export default function InvoiceImportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Mapping>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({ imported: 0, skippedDuplicates: 0, skippedInvalid: 0 });
  const [totalInvoiceValue, setTotalInvoiceValue] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      supabase.from('clients').select('id, company_name').then(({ data }) => {
        if (data) setClients(data);
      });
    }
  }, [isOpen, supabase]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setError('Please upload a valid .csv or .xlsx file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            setError('This file appears to be empty');
            setFile(null);
            return;
          }
          setRawData(results.data);
          const cols = Object.keys(results.data[0] || {});
          setHeaders(cols);
          autoMap(cols);
          setStep('mapping');
        },
        error: () => {
          setError('Failed to parse CSV file');
          setFile(null);
        }
      });
    } else if (ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json: any[] = XLSX.utils.sheet_to_json(worksheet);

          if (json.length === 0) {
            setError('This file appears to be empty');
            setFile(null);
            return;
          }

          setRawData(json);
          const cols = Object.keys(json[0] || {});
          setHeaders(cols);
          autoMap(cols);
          setStep('mapping');
        } catch (err) {
          setError('Failed to parse Excel file');
          setFile(null);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const autoMap = (cols: string[]) => {
    const newMapping: Partial<Mapping> = {};
    INVOICE_FIELDS.forEach(field => {
      const fieldKey = field.key as keyof Mapping;
      const possibleNames = SAGE_MAP[fieldKey] || [];
      const match = cols.find(c => 
        c.toLowerCase() === field.label.toLowerCase() || 
        possibleNames.some(p => c.toLowerCase() === p.toLowerCase())
      );
      if (match) {
        newMapping[fieldKey] = match;
      }
    });
    setMapping(newMapping);
  };

  const parseNumber = (val: any) => {
    if (!val) return 0;
    const num = Number(String(val).replace(/[^0-9.-]+/g,""));
    return isNaN(num) ? 0 : num;
  };

  const fuzzyMatchClient = (clientName: string) => {
    if (!clientName) return null;
    const lowerName = clientName.toLowerCase().trim();
    return clients.find(c => c.company_name?.toLowerCase().includes(lowerName)) || null;
  };

  const handleMappingConfirm = () => {
    const missingRequired = INVOICE_FIELDS.filter(f => f.required && !mapping[f.key as keyof Mapping]);
    if (missingRequired.length > 0) {
      setError(`Please map required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    let totalValue = 0;
    const uniqueInvoices = new Set();

    const processed = rawData.map((row, idx) => {
      const rowData: any = {};
      INVOICE_FIELDS.forEach(field => {
        const fileCol = mapping[field.key as keyof Mapping];
        rowData[field.key] = fileCol ? row[fileCol] : '';
      });

      const errors = [];
      const warnings = [];
      
      if (!rowData.invoice_number) errors.push('Missing Invoice Number');
      if (!rowData.client_name) errors.push('Missing Client Name');
      
      const totalNum = parseNumber(rowData.total);
      if (!totalNum && totalNum !== 0 && !rowData.total) errors.push('Missing Total Amount');

      const matchedClient = fuzzyMatchClient(rowData.client_name);
      if (!matchedClient && !errors.includes('Missing Client Name')) {
        warnings.push('Client not found — will be imported as unlinked');
      }

      if (errors.length === 0) {
        if (!uniqueInvoices.has(rowData.invoice_number)) {
            uniqueInvoices.add(rowData.invoice_number);
            totalValue += totalNum;
        }
      }

      return {
        ...rowData,
        id: idx,
        client_id: matchedClient?.id || null,
        errors,
        warnings,
        isValid: errors.length === 0,
        temp_total: totalNum
      };
    });

    setTotalInvoiceValue(totalValue);
    setPreviewData(processed);
    setStep('preview');
    setError(null);
  };

  const handleImport = async () => {
    const validRows = previewData.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Check for existing invoices
      const { data: existingInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('invoice_number');
      
      if (fetchError) throw fetchError;

      const existingInvoiceNumbers = new Set(existingInvoices?.map(c => String(c.invoice_number).toLowerCase()) || []);
      
      const invoicesToInsert = new Map();
      const lineItemsToInsert: any[] = [];
      
      let skippedDuplicates = 0;
      const today = new Date().toISOString().split("T")[0];

      // Group rows by invoice
      for (const row of validRows) {
        const key = String(row.invoice_number).toLowerCase();
        
        if (existingInvoiceNumbers.has(key)) {
            // Document already in DB, skip
            continue;
        }

        if (!invoicesToInsert.has(key)) {
            const total = parseNumber(row.total);
            let vat = parseNumber(row.vat_amount);
            
            // Auto-calculate VAT if missing (assume 15% of Subtotal. If Total is known, Subtotal = Total / 1.15)
            if (!row.vat_amount && total > 0) {
                vat = total - (total / 1.15);
            }

            const subtotal = total - vat;

            invoicesToInsert.set(key, {
                invoice_number: row.invoice_number,
                client_id: row.client_id,
                issue_date: row.issue_date || today,
                due_date: row.due_date || today,
                status: row.status || 'Draft',
                subtotal,
                vat_amount: vat,
                total,
                notes: 'Imported from Sage'
            });
        }
      }

      const rowsByInvoice = new Map();
      validRows.forEach(row => {
          const key = String(row.invoice_number).toLowerCase();
          if (invoicesToInsert.has(key)) {
              if (!rowsByInvoice.has(key)) rowsByInvoice.set(key, []);
              rowsByInvoice.get(key).push(row);
          }
      });

      skippedDuplicates = uniqueInvoiceCount(validRows) - invoicesToInsert.size;

      if (invoicesToInsert.size > 0) {
          // Because we need the generated ID to insert line items, we do it in batches or loops
          for (const [key, invoiceHeader] of invoicesToInsert) {
              const { data: insertedInv, error: insertError } = await supabase
                .from('invoices')
                .insert(invoiceHeader)
                .select('id')
                .single();
              
              if (insertError) {
                  throw insertError; // Fail loudly
              }

              const rows = rowsByInvoice.get(key) || [];
              rows.forEach((r: any, idx: number) => {
                  lineItemsToInsert.push({
                      invoice_id: insertedInv.id,
                      description: r.description || 'Imported Item',
                      quantity: parseNumber(r.quantity) || 1,
                      unit_price: parseNumber(r.unit_price) || 0,
                      sort_order: idx
                  });
              });
          }

          if (lineItemsToInsert.length > 0) {
              const { error: linesError } = await supabase.from('invoice_line_items').insert(lineItemsToInsert);
              if (linesError) console.error("Line items import error:", linesError);
          }
      }

      setSummary({
        imported: invoicesToInsert.size,
        skippedDuplicates,
        skippedInvalid: previewData.length - validRows.length
      });
      setStep('success');
      
      router.refresh();
    } catch (err: any) {
      setError('Import failed. Please try again.');
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueInvoiceCount = (rows: any[]) => {
      const s = new Set();
      rows.forEach(r => s.add(r.invoice_number));
      return s.size;
  };

  const downloadTemplate = () => {
    const csvContent = INVOICE_FIELDS.map(f => f.label).join(',') + '\n' + 
      "INV-10023,Acme Corp,2023-11-01,2023-11-30,Consulting Services,1,10000,1500,11500,Paid";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sage_invoice_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setMapping({});
    setPreviewData([]);
    setStep('upload');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }} 
        className="bg-[#151B28] border border-slate-800 w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                <FileSpreadsheet size={20} />
             </div>
             <div>
                <h3 className="text-white font-black uppercase tracking-widest text-xs">Import Sage Invoices</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                  {step === 'upload' && 'Step 1: Upload File'}
                  {step === 'mapping' && 'Step 2: Map Columns'}
                  {step === 'preview' && 'Step 3: Preview & Validate'}
                  {step === 'success' && 'Import Complete'}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

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
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Supports Sage exports (.csv, .xlsx)</p>
                <input type="file" accept=".csv, .xlsx" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors font-black text-[10px] uppercase tracking-widest"
                >
                  <Download size={14} />
                  Download Template
                </button>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <p className="text-slate-400 text-xs font-medium">Match your file columns to the dashboard fields. We've tried to auto-map them for you based on common Sage formats.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INVOICE_FIELDS.map(field => (
                  <div key={field.key} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                    </div>
                    <select
                      value={mapping[field.key as keyof Mapping] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    >
                      <option value="">-- Skip Field --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-orange-500" />
                  <div>
                    <p className="text-white font-black text-xs uppercase tracking-widest">{file?.name}</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase">
                      {uniqueInvoiceCount(previewData)} unique invoices ready to import. {previewData.length - previewData.filter(r=>r.isValid).length} rows have issues and will be skipped.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right border-r border-slate-800 pr-4 mr-2">
                        <p className="text-white font-black text-xs uppercase tracking-widest">R{totalInvoiceValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Total Invoice Value</p>
                    </div>
                   <div className="text-right">
                      <p className="text-green-500 font-black text-xs uppercase tracking-widest">{previewData.filter(r=>r.isValid).length}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Ready Rows</p>
                   </div>
                   <div className="text-right">
                      <p className="text-red-500 font-black text-xs uppercase tracking-widest">{previewData.filter(r=>!r.isValid).length}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Error Rows</p>
                   </div>
                </div>
              </div>

              {previewData.some(r => r.warnings?.length > 0) && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                  <AlertTriangle size={16} />
                  Some valid invoices have missing mapped clients and will be imported as unlinked.
                </div>
              )}

              <div className="bg-[#0B0F19] rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-500 text-[9px] uppercase font-black bg-slate-900/80 border-b border-slate-800">
                        <th className="px-4 py-3 min-w-[120px]">Inv Number</th>
                        <th className="px-4 py-3 min-w-[150px]">Client Name</th>
                        <th className="px-4 py-3 min-w-[120px]">Total Amount</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {previewData.slice(0, 10).map((row, i) => {
                          const hasWarning = row.isValid && row.warnings?.length > 0;
                          return (
                            <tr key={i} className={`text-[10px] font-bold ${row.isValid ? (hasWarning ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300') : 'bg-red-500/10 text-red-400'}`}>
                              <td className="px-4 py-3">{row.invoice_number || <span className="text-red-500/50 italic">Missing</span>}</td>
                              <td className="px-4 py-3 truncate">{row.client_name || <span className="text-red-500/50 italic">Missing</span>}</td>
                              <td className="px-4 py-3">{row.total || <span className="text-red-500/50 italic">Missing</span>}</td>
                              <td className="px-4 py-3">
                                {row.isValid ? (
                                    hasWarning ? (
                                        <span className="flex items-center gap-1">
                                          <AlertTriangle size={12} /> Unlinked Client
                                        </span>
                                    ) : (
                                        <span className="text-green-500 flex items-center gap-1">
                                          <CheckCircle2 size={12} /> Valid
                                        </span>
                                    )
                                ) : (
                                  <span className="text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} /> Invalid
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 10 && (
                  <div className="p-3 text-center bg-slate-900/50 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Showing first 10 rows...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tight text-xl mb-2">Import Successful</h4>
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-8">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <p className="text-green-500 text-xl font-black">{summary.imported}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Imported</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <p className="text-amber-500 text-xl font-black">{summary.skippedDuplicates}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Duplicates</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <p className="text-red-500 text-xl font-black">{summary.skippedInvalid}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Skipped</p>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-xs font-medium max-w-md mx-auto">
                {summary.imported} invoices have been added to your database. {summary.skippedDuplicates} duplicates were found and skipped. {summary.skippedInvalid} rows were skipped due to missing required info.
              </p>
              <button 
                onClick={onClose}
                className="bg-orange-500 hover:bg-orange-600 px-12 py-4 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl shadow-orange-500/20"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && step !== 'upload' && (
          <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-900/30">
            <button 
              onClick={() => step === 'preview' ? setStep('mapping') : reset()}
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest"
              disabled={loading}
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-3 text-slate-400 font-black uppercase text-xs hover:text-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              {step === 'mapping' && (
                <button 
                  onClick={handleMappingConfirm}
                  className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all flex items-center gap-2"
                >
                  Continue <ChevronRight size={16} />
                </button>
              )}
              {step === 'preview' && (
                <button 
                  onClick={handleImport}
                  disabled={loading || previewData.filter(r=>r.isValid).length === 0}
                  className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-orange-500/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} 
                  Confirm Import
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
