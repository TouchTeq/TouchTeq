'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Loader2, FileSpreadsheet, Download, Info } from 'lucide-react';
import { getVatHistoryReport } from '@/lib/reports/actions';
import Papa from 'papaparse';
import { format, parseISO } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BaseReportPDF } from '@/components/office/ReportPDFs';

export default function VatHistoryReport() {
  const [data, setData] = useState<{ periods: any[], totals: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getVatHistoryReport();
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
    const csvData = data.periods.map(p => ({
      'Period Start': format(parseISO(p.period_start), 'dd/MM/yyyy'),
      'Period End': format(parseISO(p.period_end), 'dd/MM/yyyy'),
      'Output VAT': Number(p.output_vat).toFixed(2),
      'Input VAT': Number(p.input_vat).toFixed(2),
      'Net Payable': Number(p.net_vat_payable).toFixed(2),
      Status: p.status
    }));
    
    const csv = Papa.unparse([
      ['Report Name', 'VAT History Report'],
      ['Generated At', new Date().toLocaleString()],
      [],
      ...Papa.parse(Papa.unparse(csvData)).data as any[][]
    ]);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `VAT_History_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Retrieving Records...</p>
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.periods.map(p => ({
    name: format(parseISO(p.period_start), 'MMM yy'),
    payable: p.net_vat_payable
  }));

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/50">
        <div>
           <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500">VAT History</h2>
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
                 title="VAT History Report" 
                 subtitle="Historical Tax Periods"
                 summary={[
                   { label: 'Total Output VAT', value: data.totals.output },
                   { label: 'Total Input VAT', value: data.totals.input, color: '#10b981' },
                   { label: 'Cumulative Payable', value: data.totals.payable, color: '#f97316' }
                 ]}
                 tableHeaders={['Period Range', 'Output VAT', 'Input VAT', 'Net Payable', 'Status']}
                 tableData={data.periods.map(p => [
                   `${format(parseISO(p.period_start), 'dd MMM yy')} - ${format(parseISO(p.period_end), 'dd MMM yy')}`,
                   formatCurrency(p.output_vat),
                   formatCurrency(p.input_vat),
                   formatCurrency(p.net_vat_payable),
                   p.status
                 ])}
                 columnWidths={[30, 20, 20, 20, 10]}
               />
             }
             fileName={`VAT_History_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
             className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
           >
              {({ loading }: any) => loading ? 'Generating...' : <><Download size={14} /> Export PDF</>}
           </PDFDownloadLink>
        </div>
      </div>

      <div className="bg-[#0B0F19] p-8 rounded-2xl border border-slate-800/50">
         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8">VAT Liability Trend</h3>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `R${val/1000}k`}
                  />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                     itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                     formatter={(val: any) => [formatCurrency(Number(val ?? 0)), 'Net Payable']}
                  />
                  <Line type="monotone" dataKey="payable" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981' }} activeDot={{ r: 8 }} />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="space-y-6">
         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Full Record Table</h3>
         <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 overflow-hidden shadow-2xl">
            <table className="w-full text-left font-sans">
               <thead>
                  <tr className="bg-slate-800/20 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                     <th className="px-6 py-5">Period Range</th>
                     <th className="px-6 py-5 text-right">Output VAT</th>
                     <th className="px-6 py-5 text-right">Input VAT</th>
                     <th className="px-6 py-5 text-right">Net Payable</th>
                     <th className="px-6 py-5 text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                  {data.periods.map(p => (
                     <tr key={p.id} className="hover:bg-green-500/5 transition-colors group">
                        <td className="px-6 py-5">
                           <div className="font-black text-white">
                              {format(parseISO(p.period_start), 'dd MMM')} — {format(parseISO(p.period_end), 'dd MMM yyyy')}
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right text-slate-300 font-medium">{formatCurrency(p.output_vat)}</td>
                        <td className="px-6 py-5 text-right text-green-500/80 font-medium">{formatCurrency(p.input_vat)}</td>
                        <td className="px-6 py-5 text-right font-black text-white">{formatCurrency(p.net_vat_payable)}</td>
                        <td className="px-6 py-5 text-right">
                           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                              p.status === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                           }`}>
                              {p.status}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
