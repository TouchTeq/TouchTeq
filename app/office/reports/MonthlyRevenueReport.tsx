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
import { Loader2, FileSpreadsheet, Download, ChevronRight, ChevronDown, Users as UsersIcon, Receipt } from 'lucide-react';
import { getMonthlyRevenueReport, getSingleMonthRevenueReport } from '@/lib/reports/actions';
import Papa from 'papaparse';
import { format, parseISO } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BaseReportPDF } from '@/components/office/ReportPDFs';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyRevenueReport() {
  const [view, setView] = useState<'year' | 'month'>('year');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (view === 'year') {
        const res = await getMonthlyRevenueReport(year);
        setData(res);
      } else {
        const res = await getSingleMonthRevenueReport(year, month);
        setData(res);
      }
      setLoading(false);
    }
    load();
  }, [year, month, view]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const exportCSV = () => {
    if (!data) return;
    let csvData = [];
    if (view === 'year') {
      csvData = data.map((m: any) => ({
        Month: m.fullMonth,
        Invoiced: m.invoiced.toFixed(2),
        Collected: m.collected.toFixed(2),
        Outstanding: m.outstanding.toFixed(2)
      }));
    } else {
      csvData = data.clientBreakdown.map((c: any) => ({
        Client: c.name,
        Invoiced: c.invoiced.toFixed(2),
        Collected: c.collected.toFixed(2)
      }));
    }
    
    const csv = Papa.unparse([
      ['Report Name', 'Monthly Revenue Report'],
      ['View', view === 'year' ? 'Full Year' : 'Single Month'],
      ['Period', view === 'year' ? year : `${MONTHS[month-1]} ${year}`],
      ['Generated At', new Date().toLocaleString()],
      [],
      ...Papa.parse(Papa.unparse(csvData)).data as any[][]
    ]);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `Revenue_Report_${year}${view === 'month' ? '_' + month : ''}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing Financial Data...</p>
      </div>
    );
  }

  const yearTotals = view === 'year' ? data.reduce((acc: any, m: any) => {
    acc.invoiced += m.invoiced;
    acc.collected += m.collected;
    return acc;
  }, { invoiced: 0, collected: 0 }) : data.totals;

  return (
    <div className="space-y-10">
      {(yearOpen || monthOpen) && (
        <div className="fixed inset-0 z-[99]" onClick={() => { setYearOpen(false); setMonthOpen(false); }} />
      )}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-800/50">
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
             <button
               onClick={() => setView('year')}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'year' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
             >
               Full Year
             </button>
             <button
               onClick={() => setView('month')}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'month' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
             >
               Single Month
             </button>
           </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setYearOpen(!yearOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
                  yearOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <span className="text-white">{year}</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${yearOpen ? 'rotate-180' : ''}`} />
              </button>
              {yearOpen && (
                <div className="absolute top-full left-0 mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] p-1">
                  {[2024, 2025, 2026].map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => { setYear(y); setYearOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-bold text-sm ${
                        year === y ? 'text-orange-500' : 'text-slate-300'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {view === 'month' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMonthOpen(!monthOpen)}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
                    monthOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span className="text-white">{MONTHS[month - 1]}</span>
                  <ChevronDown size={14} className={`text-slate-500 transition-transform ${monthOpen ? 'rotate-180' : ''}`} />
                </button>
                {monthOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-1">
                    {MONTHS.map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setMonth(idx + 1); setMonthOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-bold text-sm ${
                          month === idx + 1 ? 'text-orange-500' : 'text-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                 title="Monthly Revenue Report" 
                 subtitle={view === 'year' ? `Yearly Overview: ${year}` : `${MONTHS[month-1]} ${year} Breakdown`}
                 summary={[
                   { label: 'Total Invoiced', value: yearTotals.invoiced },
                   { label: 'Total Collected', value: yearTotals.collected, color: '#10b981' },
                   { label: 'Variance', value: yearTotals.invoiced - yearTotals.collected, color: '#f97316' },
                   { label: 'Ratio', value: yearTotals.invoiced > 0 ? `${((yearTotals.collected / yearTotals.invoiced) * 100).toFixed(1)}%` : '0%' }
                 ]}
                 tableHeaders={view === 'year' ? ['Month', 'Invoiced', 'Collected', 'Balance'] : ['Client Name', 'Invoiced', 'Collected']}
                 tableData={view === 'year' 
                   ? data.map((m: any) => [m.fullMonth, formatCurrency(m.invoiced), formatCurrency(m.collected), formatCurrency(m.outstanding)])
                   : data.clientBreakdown.map((c: any) => [c.name, formatCurrency(c.invoiced), formatCurrency(c.collected)])
                 }
                 columnWidths={view === 'year' ? [25, 25, 25, 25] : [50, 25, 25]}
               />
             }
             fileName={`Revenue_Report_${year}_${view}.pdf`}
             className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
           >
              {({ loading }: any) => loading ? 'Generating...' : <><Download size={14} /> Export PDF</>}
           </PDFDownloadLink>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Total Invoiced</p>
            <h4 className="text-2xl font-black text-white">{formatCurrency(yearTotals.invoiced)}</h4>
         </div>
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Total Collected</p>
            <h4 className="text-2xl font-black text-green-500">{formatCurrency(yearTotals.collected)}</h4>
         </div>
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Total Outstanding</p>
            <h4 className="text-2xl font-black text-orange-500">{formatCurrency(yearTotals.invoiced - yearTotals.collected)}</h4>
         </div>
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Collection Rate</p>
            <h4 className="text-2xl font-black text-blue-500">
              {yearTotals.invoiced > 0 ? ((yearTotals.collected / yearTotals.invoiced) * 100).toFixed(1) : 0}%
            </h4>
         </div>
      </div>

      {view === 'year' ? (
        <>
          <div className="bg-[#0B0F19] p-8 rounded-2xl border border-slate-800/50">
            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `R${val/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(val: any) => [formatCurrency(Number(val ?? 0)), '']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }} />
                    <Bar name="Invoiced" dataKey="invoiced" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar name="Collected" dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0B0F19] rounded-xl border border-slate-800/50 overflow-hidden">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest bg-slate-800/20">
                     <th className="px-6 py-4">Month</th>
                     <th className="px-6 py-4 text-right">Invoiced</th>
                     <th className="px-6 py-4 text-right">Collected</th>
                     <th className="px-6 py-4 text-right">Outstanding</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                  {data.map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/10 text-sm">
                       <td className="px-6 py-4 text-white font-black">{m.fullMonth}</td>
                       <td className="px-6 py-4 text-right text-slate-300">{formatCurrency(m.invoiced)}</td>
                       <td className="px-6 py-4 text-right text-green-500 font-medium">{formatCurrency(m.collected)}</td>
                       <td className="px-6 py-4 text-right text-orange-500">{formatCurrency(m.outstanding)}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                 <UsersIcon size={16} className="text-orange-500" /> Client Revenue Breakdown
              </h3>
              <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 overflow-hidden">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-800/20 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          <th className="px-6 py-4">Client</th>
                          <th className="px-6 py-4 text-right">Invoiced</th>
                          <th className="px-6 py-4 text-right">Collected</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                       {data.clientBreakdown.map((c: any) => (
                         <tr key={c.name} className="hover:bg-slate-800/10 text-sm">
                            <td className="px-6 py-4 text-white font-black">{c.name}</td>
                            <td className="px-6 py-4 text-right text-white">{formatCurrency(c.invoiced)}</td>
                            <td className="px-6 py-4 text-right text-green-500">{formatCurrency(c.collected)}</td>
                         </tr>
                       ))}
                       {data.clientBreakdown.length === 0 && (
                         <tr>
                            <td colSpan={3} className="px-6 py-10 text-center text-slate-500 font-bold uppercase text-[10px]">No activity for this month</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="bg-[#0B0F19] p-8 rounded-2xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-6">
                 <Receipt size={32} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Monthly Analysis</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                 Showing breakdown of {data.invoices.length} invoices and {data.payments.length} payments recorded in {MONTHS[month-1]} {year}.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full">
                 <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Invoices</p>
                    <p className="text-white font-black">{data.invoices.length}</p>
                 </div>
                 <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Payments</p>
                    <p className="text-white font-black">{data.payments.length}</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
