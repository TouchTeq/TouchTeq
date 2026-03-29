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
  Cell
} from 'recharts';
import { Loader2, Download, Users, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { getClientRevenueReport } from '@/lib/reports/actions';
import Papa from 'papaparse';
import Link from 'next/link';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BaseReportPDF } from '@/components/office/ReportPDFs';

export default function ClientRevenueReport() {
  const [range, setRange] = useState('This Year');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getClientRevenueReport(range);
      setData(res);
      setLoading(false);
    }
    load();
  }, [range]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const exportCSV = () => {
    const csvData = data.map((c, idx) => ({
      Rank: idx + 1,
      Client: c.clientName,
      'Total Invoiced': c.totalInvoiced.toFixed(2),
      'Total Collected': c.totalCollected.toFixed(2),
      'Outstanding Balance': c.outstandingBalance.toFixed(2),
      'Invoice Count': c.invoiceCount,
      'Avg Invoice Value': c.avgInvoiceValue.toFixed(2)
    }));
    
    const csv = Papa.unparse([
      ['Report Name', 'Client Revenue Report'],
      ['Range', range],
      ['Generated At', new Date().toLocaleString()],
      [],
      ...Papa.parse(Papa.unparse(csvData)).data as any[][]
    ]);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `Client_Revenue_${range.replace(' ', '_')}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Analyzing Client Data...</p>
      </div>
    );
  }

  const chartData = data.slice(0, 10).map(c => ({
    name: c.clientName,
    value: c.totalInvoiced
  }));

  const totals = data.reduce((acc, c) => {
    acc.rev += c.totalInvoiced;
    acc.out += c.outstandingBalance;
    return acc;
  }, { rev: 0, out: 0 });

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
           <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
             {['This Month', 'This Quarter', 'This Year', 'All Time'].map(r => (
               <button
                 key={r}
                 onClick={() => setRange(r)}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${range === r ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-500 hover:text-white'}`}
               >
                 {r}
               </button>
             ))}
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
                 title="Client Revenue Report" 
                 subtitle={`Range: ${range}`}
                 summary={[
                   { label: 'Total Clients', value: data.length },
                   { label: 'Total Revenue', value: totals.rev, color: '#10b981' },
                   { label: 'Total Outstanding', value: totals.out, color: '#f97316' }
                 ]}
                 tableHeaders={['Rank', 'Client Name', 'Total Invoiced', 'Outstanding', 'Qty']}
                 tableData={data.map((c, i) => [
                   `#${i + 1}`,
                   c.clientName,
                   formatCurrency(c.totalInvoiced),
                   formatCurrency(c.outstandingBalance),
                   c.invoiceCount
                 ])}
                 columnWidths={[10, 40, 20, 20, 10]}
               />
             }
             fileName={`Client_Revenue_${range.replace(' ', '_')}.pdf`}
             className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
           >
              {({ loading }: any) => loading ? 'Generating...' : <><Download size={14} /> Export PDF</>}
           </PDFDownloadLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Total Clients Invoiced</p>
            <h4 className="text-2xl font-black text-white">{data.length}</h4>
         </div>
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Total Revenue</p>
            <h4 className="text-2xl font-black text-green-500">{formatCurrency(totals.rev)}</h4>
         </div>
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Total Outstanding</p>
            <h4 className="text-2xl font-black text-orange-500">{formatCurrency(totals.out)}</h4>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="bg-[#0B0F19] p-8 rounded-2xl border border-slate-800/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8 flex items-center gap-3">
               <Users size={16} className="text-orange-500" /> Top 10 Clients by Revenue
            </h3>
            <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                     <XAxis type="number" hide />
                     <YAxis 
                       dataKey="name" 
                       type="category" 
                       stroke="#64748b" 
                       fontSize={10} 
                       width={100}
                       tickLine={false} 
                       axisLine={false} 
                     />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                        formatter={(val: any) => [formatCurrency(Number(val || 0)), '']}
                     />
                     <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 overflow-hidden">
            <table className="w-full text-left font-sans">
               <thead>
                  <tr className="bg-slate-800/20 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                     <th className="px-6 py-4">Rank</th>
                     <th className="px-6 py-4">Client</th>
                     <th className="px-6 py-4 text-right">Invoiced</th>
                     <th className="px-6 py-4 text-right">Balance</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                  {data.map((c, i) => (
                    <tr key={c.clientId} className="hover:bg-slate-800/10 text-sm">
                       <td className="px-6 py-4 font-black text-slate-600">#{i + 1}</td>
                       <td className="px-6 py-4">
                          <Link href={`/office/clients/${c.clientId}`} className="text-white font-black hover:text-orange-500 transition-colors flex items-center gap-2">
                             {c.clientName} <ExternalLink size={12} className="opacity-50" />
                          </Link>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{c.invoiceCount} Invoices</p>
                       </td>
                       <td className="px-6 py-4 text-right text-white font-black">{formatCurrency(c.totalInvoiced)}</td>
                       <td className={`px-6 py-4 text-right font-bold ${c.outstandingBalance > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                          {formatCurrency(c.outstandingBalance)}
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
