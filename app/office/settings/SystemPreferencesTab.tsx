'use client';

import { useState } from 'react';
import { 
  Settings, 
  Info, 
  Download, 
  AlertTriangle, 
  Loader2,
  CheckCircle2,
  FileJson
} from 'lucide-react';
import { exportAllData } from '@/lib/settings/actions';
import { motion } from 'motion/react';
import Papa from 'papaparse';

export default function SystemPreferencesTab({ profile }: { profile: any }) {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    if (!confirm('This will export all your business data. Keep this file secure. Proceed?')) return;
    const confirmation = window.prompt('Type EXPORT to confirm this full data export.');
    if (confirmation === null) return;

    setExporting(true);

    try {
      const result = await exportAllData(confirmation);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Export failed.');
      }

      const data = result.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TouchTeq-Backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      Object.entries(data).forEach(([key, val], index) => {
        if (Array.isArray(val)) {
          const csv = Papa.unparse(val);
          const csvBlob = new Blob([csv], { type: 'text/csv' });
          const csvUrl = URL.createObjectURL(csvBlob);
          const csvA = document.createElement('a');
          csvA.href = csvUrl;
          csvA.download = `TouchTeq-${key}.csv`;
          setTimeout(() => {
            csvA.click();
            URL.revokeObjectURL(csvUrl);
          }, 500 + index * 150);
        }
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const PREFERENCES = [
    { label: 'Default Currency', value: profile.currency || 'ZAR (South African Rand)', note: 'Fixed to primary operating currency.' },
    { label: 'VAT Rate', value: `${(profile.vat_rate * 100).toFixed(0)}%`, note: 'VAT rate is set at 15% as per SARS regulations.' },
    { label: 'VAT Period Cycle', value: 'Two-monthly', note: 'Registered with SARS. Contact accountant to change.' },
    { label: 'Financial Year Start', value: 'March', note: 'South African standard tax year.' },
    { label: 'Date Format', value: 'DD/MM/YYYY', note: 'Localized for South Africa.' },
    { label: 'Currency Format', value: 'R 0,000.00', note: 'Standard accounting format.' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
         <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-slate-500/10 rounded-lg flex items-center justify-center text-slate-400">
               <Settings size={20} />
            </div>
            <div>
               <h3 className="text-xl font-black text-white uppercase tracking-tight">System Configuration</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Application Defaults & Standards</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PREFERENCES.map((pref, idx) => (
               <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{pref.label}</span>
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-white">{pref.value}</span>
                     <div className="group relative">
                        <Info size={14} className="text-slate-700 cursor-help" />
                        <div className="absolute right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 border border-slate-700 p-2 rounded text-[8px] font-bold text-slate-400 uppercase pointer-events-none z-10">
                           {pref.note}
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-500/5 rounded-2xl border border-red-500/20 p-8 shadow-xl">
         <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
               <AlertTriangle size={20} />
            </div>
            <div>
               <h3 className="text-xl font-black text-white uppercase tracking-tight">Danger Zone</h3>
               <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-widest mt-1">Sensitive System Actions</p>
            </div>
         </div>

         <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="space-y-1">
               <h4 className="text-sm font-bold text-white uppercase">Export Complete Business Data</h4>
               <p className="text-[10px] text-slate-500 font-medium">Download a complete backup of all clients, quotes, invoices, and expenses in CSV/JSON format.</p>
            </div>
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl disabled:opacity-50"
            >
               {exporting ? <Loader2 className="animate-spin" size={16} /> : exportSuccess ? <CheckCircle2 size={16} className="text-green-500" /> : <Download size={16} />}
               {exporting ? 'Preparing Archive...' : exportSuccess ? 'Export Complete' : 'Export All Data'}
            </button>
         </div>

         <div className="mt-8 p-6 border-l-4 border-red-500/30 bg-red-500/5 rounded-r-xl">
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
               To delete your Touch Teq Office account or permanently wipe all data, please contact your system administrator. These actions are restricted to prevent accidental data loss.
            </p>
         </div>
      </section>
    </motion.div>
  );
}
