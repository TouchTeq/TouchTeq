'use client';

import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { Loader2, FileSpreadsheet, Download, ShoppingCart } from 'lucide-react';
import { getExpenseReport } from '@/lib/reports/actions';
import Papa from 'papaparse';
import { format, parseISO } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BaseReportPDF } from '@/components/office/ReportPDFs';

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f59e0b'];

export default function ExpenseSummaryReport() {
  const [range, setRange] = useState('This Year');
  const [category, setCategory] = useState('All');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getExpenseReport(range, category);
      setData(res);
      setLoading(false);
    }
    load();
  }, [range, category]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const exportCSV = () => {
    if (!data) return;
    const csvData = data.details.map((ex: any) => ({
      Date: format(parseISO(ex.expense_date), 'dd/MM/yyyy'),
      Supplier: ex.supplier_name,
      Description: ex.description,
      Category: ex.category,
      'Amount Inclusive': Number(ex.amount_inclusive).toFixed(2),
      'Input VAT': Number(ex.input_vat_amount).toFixed(2),
      'Amount Exclusive': Number(ex.amount_exclusive).toFixed(2)
    }));
    
    const csv = Papa.unparse([
      ['Report Name', 'Expense Summary Report'],
      ['Range', range],
      ['Generated At', new Date().toLocaleString()],
      [],
      ...Papa.parse(Papa.unparse(csvData)).data as any[][]
    ]);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `Expense_Report_${range.replace(' ', '_')}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing Expenses...</p>
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.summary.map((s: any) => ({
    name: s.category,
    value: s.spent
  }));

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/50">
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
             {['This Month', 'This Quarter', 'This Year', 'All Time'].map(r => (
               <button
                 key={r}
                 onClick={() => setRange(r)}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${range === r ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}
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
                 title="Expense Summary Report" 
                 subtitle={`Range: ${range}`}
                 summary={[
                   { label: 'Total Spent', value: data.totalSpent },
                   { label: 'Input VAT', value: data.totalInputVat, color: '#10b981' },
                   { label: 'Net Cost', value: data.totalSpent - data.totalInputVat, color: '#f97316' }
                 ]}
                 tableHeaders={['Date', 'Supplier', 'Category', 'Amount (Inc)', 'VAT']}
                 tableData={data.details.map((ex: any) => [
                   format(parseISO(ex.expense_date), 'dd MMM yy'),
                   ex.supplier_name,
                   ex.category,
                   formatCurrency(ex.amount_inclusive),
                   formatCurrency(ex.input_vat_amount)
                 ])}
                 columnWidths={[15, 30, 20, 20, 15]}
               />
             }
             fileName={`Expense_Report_${range.replace(' ', '_')}.pdf`}
             className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
           >
              {({ loading }: any) => loading ? 'Generating...' : <><Download size={14} /> Export PDF</>}
           </PDFDownloadLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Total Spent</p>
            <h4 className="text-2xl font-black text-white">{formatCurrency(data.totalSpent)}</h4>
         </div>
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Total Input VAT</p>
            <h4 className="text-2xl font-black text-green-500">{formatCurrency(data.totalInputVat)}</h4>
         </div>
         <div className="bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Net Business Cost</p>
            <h4 className="text-2xl font-black text-orange-500">{formatCurrency(data.totalSpent - data.totalInputVat)}</h4>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="bg-[#0B0F19] p-8 rounded-2xl border border-slate-800/50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8 flex items-center gap-3">
               <ShoppingCart size={16} className="text-purple-500" /> Category Breakdown
            </h3>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {chartData.map((_: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        formatter={(val: any) => [formatCurrency(Number(val ?? 0)), 'Spent']}
                     />
                     <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', bottom: 0 }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 overflow-hidden self-start">
            <table className="w-full text-left font-sans">
               <thead>
                  <tr className="bg-slate-800/20 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                     <th className="px-6 py-5">Category</th>
                     <th className="px-6 py-5 text-right">Total Spent</th>
                     <th className="px-6 py-5 text-right">%</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                  {data.summary.map((s: any, i: number) => (
                     <tr key={s.category} className="hover:bg-purple-500/5 transition-colors">
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="font-black text-white">{s.category}</span>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right text-white font-medium">{formatCurrency(s.spent)}</td>
                        <td className="px-6 py-5 text-right font-black text-slate-500">
                           {s.percentage.toFixed(1)}%
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
