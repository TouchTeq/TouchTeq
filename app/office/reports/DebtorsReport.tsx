'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, FileSpreadsheet, Download } from 'lucide-react';
import { getDebtorsReport } from '@/lib/reports/actions';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BaseReportPDF } from '@/components/office/ReportPDFs';

export default function DebtorsReport() {
  const [data, setData] = useState<{ ageing: any[], details: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getDebtorsReport();
      setData(res);
      setLoading(false);
    }
    load();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const exportCSV = () => {
    if (!data) return;
    const csvData = data.ageing.map(a => ({
      Client: a.clientName,
      Current: a.current.toFixed(2),
      '1-30 Days': a.age30.toFixed(2),
      '31-60 Days': a.age60.toFixed(2),
      '61-90 Days': a.age90.toFixed(2),
      '90+ Days': a.agePlus.toFixed(2),
      Total: a.total.toFixed(2)
    }));
    
    const csv = Papa.unparse([
      ['Report Name', 'Outstanding Debtors Report'],
      ['Generated At', new Date().toLocaleString()],
      [],
      ...Papa.parse(Papa.unparse(csvData)).data as any[][]
    ]);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `Debtors_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-red-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Calculating Debt Ageing...</p>
      </div>
    );
  }

  if (!data) return null;

  const totalOutstanding = data.ageing.reduce((sum, a) => sum + a.total, 0);
  const totalOverdue = data.ageing.reduce((sum, a) => sum + a.age30 + a.age60 + a.age90 + a.agePlus, 0);
  const oldestInvoice = data.details[0];

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/50">
        <div>
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 flex items-center gap-2">
              <AlertCircle size={14} /> Critical Cash Flow Analysis
           </h2>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={exportCSV}
             className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
           >
              <FileSpreadsheet size={14} /> Export CSV
           </button>
           
           <PDFDownloadLink
             document={
               <BaseReportPDF 
                 title="Outstanding Debtors Report" 
                 subtitle="Ageing Analysis Statement"
                 summary={[
                   { label: 'Total Debt', value: totalOutstanding },
                   { label: 'Total Overdue', value: totalOverdue, color: '#ef4444' },
                   { label: 'Oldest Debt', value: oldestInvoice ? `${oldestInvoice.daysOverdue} Days` : '0 Days', color: '#f97316' }
                 ]}
                 tableHeaders={['Client Name', 'Current', '30 Days', '60 Days', '90 Days+', 'Total']}
                 tableData={data.ageing.map(a => [
                   a.clientName,
                   formatCurrency(a.current),
                   formatCurrency(a.age30),
                   formatCurrency(a.age60),
                   formatCurrency(a.age90 + a.agePlus),
                   formatCurrency(a.total),
                 ])}
                 columnWidths={[30, 14, 14, 14, 14, 14]}
               />
             }
             fileName={`Debtors_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
             className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
           >
              {({ loading }: any) => loading ? 'Generating...' : <><Download size={14} /> Export PDF</>}
           </PDFDownloadLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl overflow-hidden group">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">Total Outstanding</p>
            <h4 className="text-4xl font-black text-white">{formatCurrency(totalOutstanding)}</h4>
         </div>
         <div className="bg-red-500/10 p-8 rounded-2xl border border-red-500/20 shadow-xl overflow-hidden group">
            <p className="text-[10px] font-black uppercase text-red-500/70 tracking-widest mb-3">Total Overdue</p>
            <h4 className="text-4xl font-black text-red-500 animate-pulse">{formatCurrency(totalOverdue)}</h4>
         </div>
         <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl overflow-hidden group">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">Oldest Unpaid Invoice</p>
            {oldestInvoice ? (
               <div>
                  <h4 className="text-xl font-black text-white mb-1">{oldestInvoice.clients?.company_name}</h4>
                  <span className="text-xs font-bold text-red-500 uppercase">{oldestInvoice.daysOverdue} Days Overdue</span>
               </div>
            ) : (
               <h4 className="text-2xl font-black text-slate-700">None</h4>
            )}
         </div>
      </div>

      <div className="space-y-6">
         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Debtors Ageing Analysis</h3>
         <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead>
                     <tr className="bg-slate-800/20 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                        <th className="px-6 py-5">Client Name</th>
                        <th className="px-6 py-5 text-right">Current</th>
                        <th className="px-6 py-5 text-right">1-30 Days</th>
                        <th className="px-6 py-5 text-right">31-60 Days</th>
                        <th className="px-6 py-5 text-right">61-90 Days</th>
                        <th className="px-6 py-5 text-right">90+ Days</th>
                        <th className="px-6 py-5 text-right">Total</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                     {data.ageing.map(a => (
                        <tr key={a.clientId} className="hover:bg-red-500/5 transition-colors group">
                           <td className="px-6 py-5 font-black text-white">{a.clientName}</td>
                           <td className="px-6 py-5 text-right text-slate-400 font-medium">{formatCurrency(a.current)}</td>
                           <td className={`px-6 py-5 text-right font-black ${a.age30 > 0 ? 'text-amber-500' : 'text-slate-600'}`}>{formatCurrency(a.age30)}</td>
                           <td className={`px-6 py-5 text-right font-black ${a.age60 > 0 ? 'text-amber-500' : 'text-slate-600'}`}>{formatCurrency(a.age60)}</td>
                           <td className={`px-6 py-5 text-right font-black ${a.age90 > 0 ? 'text-red-500 border-l border-red-500/20' : 'text-slate-600'}`}>{formatCurrency(a.age90)}</td>
                           <td className={`px-6 py-5 text-right font-black ${a.agePlus > 0 ? 'text-red-500' : 'text-slate-600'}`}>{formatCurrency(a.agePlus)}</td>
                           <td className="px-6 py-5 text-right font-black text-white text-base">{formatCurrency(a.total)}</td>
                        </tr>
                     ))}
                  </tbody>
                  <tfoot className="bg-slate-800/20 border-t border-slate-800">
                     <tr className="font-black text-white uppercase text-[10px] tracking-widest">
                        <td className="px-6 py-6">Totals</td>
                        <td className="px-6 py-6 text-right">{formatCurrency(data.ageing.reduce((s, a) => s + a.current, 0))}</td>
                        <td className="px-6 py-6 text-right">{formatCurrency(data.ageing.reduce((s, a) => s + a.age30, 0))}</td>
                        <td className="px-6 py-6 text-right">{formatCurrency(data.ageing.reduce((s, a) => s + a.age60, 0))}</td>
                        <td className="px-6 py-6 text-right">{formatCurrency(data.ageing.reduce((s, a) => s + a.age90, 0))}</td>
                        <td className="px-6 py-6 text-right">{formatCurrency(data.ageing.reduce((s, a) => s + a.agePlus, 0))}</td>
                        <td className="px-6 py-6 text-right text-lg text-red-500">{formatCurrency(totalOutstanding)}</td>
                     </tr>
                  </tfoot>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
