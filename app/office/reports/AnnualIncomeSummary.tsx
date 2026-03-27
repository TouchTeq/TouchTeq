'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Loader2, FileSpreadsheet, Download, ShieldAlert, ChevronDown } from 'lucide-react';
import { getAnnualSummary } from '@/lib/reports/actions';
import Papa from 'papaparse';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BaseReportPDF } from '@/components/office/ReportPDFs';

export default function AnnualIncomeSummary() {
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 1);
  const [taxYearOpen, setTaxYearOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getAnnualSummary(startYear);
      setData(res);
      setLoading(false);
    }
    load();
  }, [startYear]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const exportCSV = () => {
    if (!data) return;
    const csvData = data.monthlyBreakdown.map((m: any) => ({
      Month: m.month,
      Revenue: m.revenue.toFixed(2),
      Expenses: m.expenses.toFixed(2),
      'Net Profit': m.net.toFixed(2)
    }));
    
    const csv = Papa.unparse([
      ['Report Name', 'Annual Income Summary'],
      ['Tax Year', `Mar ${startYear} - Feb ${startYear + 1}`],
      ['Generated At', new Date().toLocaleString()],
      [],
      ...Papa.parse(Papa.unparse(csvData)).data as any[][]
    ]);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `Annual_Summary_${startYear}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing Data...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
           <div className="relative">
             <button
               type="button"
               onClick={() => setTaxYearOpen(!taxYearOpen)}
               className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-all font-black text-[10px] uppercase tracking-widest bg-[#0B0F19] ${
                 taxYearOpen ? 'border-amber-500' : 'border-slate-700 hover:border-slate-600'
               }`}
             >
               <span className="text-white">Tax Year Mar {startYear} - Feb {startYear + 1}</span>
               <ChevronDown size={14} className={`text-slate-500 transition-transform ${taxYearOpen ? 'rotate-180' : ''}`} />
             </button>
             {taxYearOpen && (
               <div className="absolute top-full left-0 mt-2 bg-[#0B0F19] border border-slate-700 rounded-xl shadow-xl z-50">
                 {[2024, 2025, 2026].map(y => (
                   <button
                     key={y}
                     type="button"
                     onClick={() => { setStartYear(y); setTaxYearOpen(false); }}
                     className={`w-full px-4 py-3 text-left hover:bg-[#151B28] transition-colors font-black text-[10px] uppercase tracking-widest ${
                       startYear === y ? 'text-amber-500' : 'text-slate-300'
                     }`}
                   >
                     Tax Year Mar {y} - Feb {y + 1}
                   </button>
                 ))}
               </div>
             )}
           </div>
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
                 title="Annual Income Summary" 
                 subtitle={`South African Tax Year: Mar ${startYear} - Feb ${startYear + 1}`}
                 summary={[
                   { label: 'Annual Revenue', value: data.totalRevenue },
                   { label: 'Annual Expenses', value: data.totalExpenses, color: '#f97316' },
                   { label: 'Est. Gross Profit', value: data.totalRevenue - data.totalExpenses, color: '#10b981' }
                 ]}
                 tableHeaders={['Month', 'Revenue', 'Expenses', 'Net Profit']}
                 tableData={data.monthlyBreakdown.map((m: any) => [
                   m.month,
                   formatCurrency(m.revenue),
                   formatCurrency(m.expenses),
                   formatCurrency(m.net)
                 ])}
                 columnWidths={[25, 25, 25, 25]}
               />
             }
             fileName={`Annual_Summary_Report_${startYear}.pdf`}
             className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
           >
              {({ loading }: any) => loading ? 'Generating...' : <><Download size={14} /> Export PDF</>}
           </PDFDownloadLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">Annual Revenue</p>
            <h4 className="text-2xl font-black text-white">{formatCurrency(data.totalRevenue)}</h4>
         </div>
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">Total Expenses</p>
            <h4 className="text-2xl font-black text-slate-300">{formatCurrency(data.totalExpenses)}</h4>
         </div>
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[9px] font-black uppercase text-green-500/70 tracking-widest mb-2">Est. Gross Profit</p>
            <h4 className="text-2xl font-black text-green-500">{formatCurrency(data.totalRevenue - data.totalExpenses)}</h4>
         </div>
      </div>

      <div className="bg-[#0B0F19] p-8 rounded-2xl border border-slate-800/50">
         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8">Monthly Trend Analysis</h3>
         <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
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
                     formatter={(val: any) => [formatCurrency(Number(val ?? 0)), '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar name="Revenue" dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar name="Expenses" dataKey="expenses" fill="#475569" radius={[4, 4, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 overflow-hidden shadow-2xl">
         <table className="w-full text-left font-sans">
            <thead>
               <tr className="bg-slate-800/20 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                  <th className="px-6 py-5">Month</th>
                  <th className="px-6 py-5 text-right">Revenue</th>
                  <th className="px-6 py-5 text-right">Expenses</th>
                  <th className="px-6 py-5 text-right">Net Profit</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
               {data.monthlyBreakdown.map((m: any, i: number) => (
                  <tr key={i} className="hover:bg-amber-500/5 transition-colors font-sans">
                     <td className="px-6 py-5 font-black text-white">{m.month}</td>
                     <td className="px-6 py-5 text-right text-white font-medium">{formatCurrency(m.revenue)}</td>
                     <td className="px-6 py-5 text-right text-slate-400">{formatCurrency(m.expenses)}</td>
                     <td className={`px-6 py-5 text-right font-black ${m.net > 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(m.net)}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
