'use client';

import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2,
  Table as TableIcon,
  Download,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ParsedRow {
  id: number;
  originalData: Record<string, string>;
  mappedData: {
    date: string;
    supplierName: string;
    description: string;
    category: string;
    amountExclusive: number;
    vatAmount: number;
    amountInclusive: number;
    paymentMethod: string;
    referenceNumber: string;
  };
  errors: string[];
  isValid: boolean;
  isDuplicate: boolean;
  skipReason?: string;
}

// Column mapping configuration
const SAGE_HEADER_ALIASES: Record<string, string[]> = {
  date: ['date', 'transaction date', 'trans date', 'posting date', 'doc date'],
  supplierName: ['supplier', 'vendor', 'supplier / vendor name', 'vendor name', 'supplier name', 'account', 'name'],
  description: ['description', 'detail', 'narration', 'reference', 'memo', 'line description'],
  category: ['category', 'type', 'expense type', 'account type'],
  amountExclusive: ['amount (excl. vat)', 'amount excl vat', 'excl', 'amount exclusive', 'net amount', 'subtotal'],
  vatAmount: ['vat amount', 'vat', 'tax amount', 'input vat', 'vat amount 15%', 'tax'],
  amountInclusive: ['amount (incl. vat)', 'amount incl vat', 'incl', 'amount inclusive', 'total', 'gross amount'],
  paymentMethod: ['payment method', 'payment mode', 'method', 'payment type'],
  referenceNumber: ['reference number', 'reference', 'doc number', 'document number', 'invoice number', 'inv no', 'ref no']
};

// Category mapping
const CATEGORY_MAPPING: Record<string, string> = {
  'fuel': 'Travel',
  'diesel': 'Travel',
  'petrol': 'Travel',
  'transport': 'Travel',
  'travel': 'Travel',
  'telephone': 'Communication',
  'phone': 'Communication',
  'mobile': 'Communication',
  'internet': 'Communication',
  'data': 'Communication',
  'equipment': 'Tools & Equipment',
  'tools': 'Tools & Equipment',
  'hardware': 'Tools & Equipment',
  'software': 'Software',
  'subscription': 'Software',
  'professional': 'Professional Fees',
  'consulting': 'Professional Fees',
  'legal': 'Professional Fees',
  'accounting': 'Professional Fees',
  'materials': 'Materials',
  'supplies': 'Materials',
  'consumables': 'Materials'
};

const REQUIRED_FIELDS = ['date', 'amountInclusive'];

export default function CSVImportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skippedDuplicates: number; skippedFields: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Date': '2024-01-15',
        'Supplier / Vendor Name': 'Supplier Name',
        'Description': 'Expense description',
        'Category': 'Travel',
        'Amount (Excl. VAT)': '1000.00',
        'VAT Amount': '150.00',
        'Amount (Incl. VAT)': '1150.00',
        'Payment Method': 'Credit Card',
        'Reference Number': 'INV-001'
      }
    ];
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const detectColumn = (header: string): string | null => {
    const lower = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(SAGE_HEADER_ALIASES)) {
      if (aliases.includes(lower)) return field;
    }
    return null;
  };

  const mapCategory = (category: string): string => {
    if (!category) return 'Uncategorised';
    const lower = category.toLowerCase();
    return CATEGORY_MAPPING[lower] || 'Uncategorised';
  };

  const parseAmount = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove currency symbols, spaces, and convert comma decimals to dot
    const cleaned = value.toString().replace(/[R\s,]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseDate = (value: string): string => {
    if (!value) return '';
    // Try to parse various date formats
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    // Try DD/MM/YYYY format
    const parts = value.split(/[-/]/);
    if (parts.length === 3) {
      const [d, m, y] = parts.map(p => parseInt(p));
      if (y > 1000) {
        const parsed = new Date(y > 50 ? y : 2000 + y, m - 1, d);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
      }
    }
    return '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setErrors(['Please upload a valid .csv or .xlsx file']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);

    if (ext === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            setErrors(['This file appears to be empty']);
            return;
          }
          processRawData(results.data as Record<string, string>[]);
        },
        error: (err) => {
          setErrors(['Failed to parse CSV: ' + err.message]);
        }
      });
    } else {
      // Excel file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          if (jsonData.length < 2) {
            setErrors(['This file appears to be empty']);
            return;
          }

          // First row is headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as string[][];
          
          const parsedData = rows.map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((header, i) => {
              obj[header] = row[i]?.toString() || '';
            });
            return obj;
          }).filter(row => Object.values(row).some(v => v));

          if (parsedData.length === 0) {
            setErrors(['This file appears to be empty']);
            return;
          }
          
          processRawData(parsedData);
        } catch (err) {
          setErrors(['Failed to parse Excel file']);
        }
      };
      reader.onerror = () => setErrors(['Failed to read file']);
      reader.readAsBinaryString(selectedFile);
    }
  };

  const processRawData = (data: Record<string, string>[]) => {
    setRawData(data);
    
    // Detect columns from first row
    const headers = Object.keys(data[0] || {});
    setDetectedColumns(headers);

    // Auto-detect mapping
    const autoMapping: Record<string, string> = {};
    headers.forEach(header => {
      const detected = detectColumn(header);
      if (detected) {
        autoMapping[detected] = header;
      }
    });
    setColumnMapping(autoMapping);
    setStep('mapping');
  };

  const processMapping = () => {
    const rows: ParsedRow[] = rawData.map((row, idx) => {
      const mappedData = {
        date: parseDate(row[columnMapping.date] || ''),
        supplierName: (row[columnMapping.supplierName] || '').replace(/[0-9]/g, '').trim(),
        description: row[columnMapping.description] || '',
        category: mapCategory(row[columnMapping.category] || ''),
        amountExclusive: parseAmount(row[columnMapping.amountExclusive]),
        vatAmount: parseAmount(row[columnMapping.vatAmount]),
        amountInclusive: parseAmount(row[columnMapping.amountInclusive]),
        paymentMethod: row[columnMapping.paymentMethod] || '',
        referenceNumber: (row[columnMapping.referenceNumber] || '').trim()
      };

      const rowErrors: string[] = [];
      if (!mappedData.date) rowErrors.push('Missing date');
      if (!mappedData.amountInclusive) rowErrors.push('Missing amount');

      return {
        id: idx,
        originalData: row,
        mappedData,
        errors: rowErrors,
        isValid: rowErrors.length === 0,
        isDuplicate: false
      };
    });

    setParsedRows(rows);
    
    // Calculate totals
    const validRows = rows.filter(r => r.isValid);
    const total = validRows.reduce((sum, r) => sum + r.mappedData.amountInclusive, 0);
    const totalVat = validRows.reduce((sum, r) => sum + r.mappedData.vatAmount, 0);
    
    setStep('preview');
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid && !r.isDuplicate);
    if (validRows.length === 0) return;

    setStep('importing');
    setLoading(true);
    setErrors([]);

    try {
      // Check for duplicates based on reference number
      const referenceNumbers = validRows
        .filter(r => r.mappedData.referenceNumber)
        .map(r => r.mappedData.referenceNumber);

      let duplicateCount = 0;
      if (referenceNumbers.length > 0) {
        const { data: existing } = await supabase
          .from('expenses')
          .select('reference_number')
          .in('reference_number', referenceNumbers);

        if (existing) {
          const existingRefs = new Set(existing.map(e => e.reference_number));
          validRows.forEach(row => {
            if (existingRefs.has(row.mappedData.referenceNumber)) {
              row.isDuplicate = true;
              row.skipReason = 'Duplicate reference';
              duplicateCount++;
            }
          });
        }
      }

      const rowsToInsert = validRows
        .filter(r => !r.isDuplicate)
        .map(r => {
          const { amountExclusive, vatAmount, amountInclusive } = r.mappedData;
          // Auto-calculate VAT if missing
          const vat = vatAmount > 0 ? vatAmount : (amountInclusive - amountExclusive);
          const excl = amountExclusive > 0 ? amountExclusive : (amountInclusive - (amountInclusive * 15 / 115));
          
          return {
            expense_date: r.mappedData.date,
            supplier_name: r.mappedData.supplierName,
            description: r.mappedData.description,
            category: r.mappedData.category,
            amount_exclusive: parseFloat(excl.toFixed(2)),
            input_vat_amount: parseFloat(vat.toFixed(2)),
            amount_inclusive: parseFloat(amountInclusive.toFixed(2)),
            vat_claimable: true,
            payment_method: r.mappedData.paymentMethod,
            reference_number: r.mappedData.referenceNumber || null,
            source: 'Imported from Sage',
            notes: `Imported on ${new Date().toISOString().split('T')[0]}`
          };
        });

      if (rowsToInsert.length === 0) {
        throw new Error('No valid rows to import');
      }

      const { error } = await supabase.from('expenses').insert(rowsToInsert);
      
      if (error) {
        console.error('Import error:', error);
        throw new Error('Import failed. Please try again.');
      }

      const skippedFields = parsedRows.filter(r => !r.isValid).length;
      
      setImportResult({
        imported: rowsToInsert.length,
        skippedDuplicates: duplicateCount,
        skippedFields
      });
      setStep('complete');
      
      // Refresh the page after a delay
      setTimeout(() => {
        router.refresh();
      }, 1500);

    } catch (err: any) {
      setErrors([err.message || 'Import failed. Please try again.']);
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setRawData([]);
    setParsedRows([]);
    setColumnMapping({});
    setDetectedColumns([]);
    setErrors([]);
    setImportResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validCount = parsedRows.filter(r => r.isValid && !r.isDuplicate).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const totalExpenses = parsedRows.filter(r => r.isValid).reduce((sum, r) => sum + r.mappedData.amountInclusive, 0);
  const totalVat = parsedRows.filter(r => r.isValid).reduce((sum, r) => sum + r.mappedData.vatAmount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
      />
      
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
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-widest text-xs">Import Expenses</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                {step === 'upload' && 'Upload .csv or .xlsx file from Sage'}
                {step === 'mapping' && 'Map columns to fields'}
                {step === 'preview' && 'Review and confirm'}
                {step === 'importing' && 'Importing...'}
                {step === 'complete' && 'Import complete'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle size={16} />
              <p className="text-xs font-bold">{errors[0]}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 rounded-2xl py-20 flex flex-col items-center justify-center group hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-all mb-4">
                  <FileText size={32} />
                </div>
                <p className="text-white font-black uppercase tracking-widest text-sm mb-2">Click to select file</p>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">Accepts .csv and .xlsx files</p>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-widest hover:underline"
                >
                  <Download size={14} />
                  Download Template CSV
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">
                We've auto-detected columns from your file. Please confirm or adjust the mapping below:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  date: 'Date',
                  supplierName: 'Supplier / Vendor Name',
                  description: 'Description',
                  category: 'Category',
                  amountExclusive: 'Amount (Excl. VAT)',
                  vatAmount: 'VAT Amount',
                  amountInclusive: 'Amount (Incl. VAT)',
                  paymentMethod: 'Payment Method',
                  referenceNumber: 'Reference Number'
                }).map(([field, label]) => (
                  <div key={field} className="flex items-center gap-4">
                    <div className="w-40 text-slate-400 text-xs font-bold uppercase">{label}</div>
                    <select
                      value={columnMapping[field] || ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
                      className="flex-1 bg-[#0B0F19] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none"
                    >
                      <option value="">-- Select Column --</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={processMapping}
                  disabled={!columnMapping.date || !columnMapping.amountInclusive}
                  className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  Continue to Preview <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                  <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Ready to Import</p>
                  <p className="text-2xl font-black text-green-500">{validCount} expenses</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                  <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Will be Skipped</p>
                  <p className="text-2xl font-black text-red-500">{invalidCount} rows</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                  <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Total Spend</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(totalExpenses)}</p>
                  <p className="text-[10px] text-blue-500">VAT: {formatCurrency(totalVat)}</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-[#0B0F19] rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#0B0F19]">
                      <tr className="text-slate-500 text-[9px] uppercase font-black bg-slate-900/80 border-b border-slate-800">
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Supplier</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Amount</th>
                        <th className="px-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {parsedRows.slice(0, 10).map((row) => (
                        <tr key={row.id} className={`text-[10px] font-bold ${!row.isValid ? 'bg-red-500/5' : ''}`}>
                          <td className="px-3 py-3 text-slate-300">{row.mappedData.date || '-'}</td>
                          <td className="px-3 py-3 text-slate-300 truncate max-w-[150px]">{row.mappedData.supplierName || '-'}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              row.mappedData.category === 'Uncategorised' 
                                ? 'bg-yellow-500/20 text-yellow-500' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {row.mappedData.category}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-white">{formatCurrency(row.mappedData.amountInclusive)}</td>
                          <td className="px-3 py-3">
                            {!row.isValid ? (
                              <span className="text-red-500 flex items-center gap-1">
                                <AlertCircle size={10} /> {row.errors[0]}
                              </span>
                            ) : (
                              <span className="text-green-500 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Ready
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 10 && (
                  <div className="p-3 text-center bg-slate-900/50 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Showing first 10 of {parsedRows.length} rows
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 size={48} className="text-orange-500 animate-spin mb-6" />
              <p className="text-white font-black uppercase tracking-widest">Importing Expenses...</p>
              <p className="text-slate-500 text-sm mt-2">Please wait while we process your data</p>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && importResult && (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <p className="text-white font-black uppercase tracking-widest text-xl mb-2">Import Complete!</p>
              <div className="text-center space-y-2">
                <p className="text-green-500 font-bold">{importResult.imported} expenses imported</p>
                {importResult.skippedDuplicates > 0 && (
                  <p className="text-yellow-500 text-sm">{importResult.skippedDuplicates} skipped (duplicates)</p>
                )}
                {importResult.skippedFields > 0 && (
                  <p className="text-red-500 text-sm">{importResult.skippedFields} skipped (missing fields)</p>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-6">Redirecting to expenses...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'importing' && step !== 'complete' && (
          <div className="p-6 border-t border-slate-800 flex items-center justify-between">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {step === 'preview' && `${validCount} ready to import`}
              {step === 'mapping' && 'Review column mapping'}
              {step === 'upload' && 'Select a file to continue'}
            </p>
            <div className="flex gap-4">
              {step !== 'preview' && (
                <button 
                  onClick={handleClose}
                  className="px-6 py-3 text-slate-400 font-black uppercase text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
              {step === 'preview' && (
                <>
                  <button 
                    onClick={() => setStep('mapping')}
                    className="px-6 py-3 text-slate-400 font-black uppercase text-xs hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleImport}
                    disabled={validCount === 0 || loading}
                    className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-sm font-black text-xs uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <TableIcon size={16} />} 
                    Import {validCount} Expenses
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
