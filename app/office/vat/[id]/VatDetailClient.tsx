'use client';

import { useState } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  FileText, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Download,
  AlertCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import VATReportPDF from '@/components/office/VATReportPDF';

export default function VatDetailClient({ period, invoices, expenses, businessProfile }: any) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'summary'>('summary');
  const [search, setSearch] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const filteredInvoices = invoices.filter((i: any) => 
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    i.clients?.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExpenses = expenses.filter((e: any) => 
    e.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/office/vat"
            className="w-10 h-10 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
             <h1 className="text-3xl font-black text-white uppercase tracking-tight">Period Details</h1>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
               {format(parseISO(period.period_start), 'dd MMMM yyyy')} — {format(parseISO(period.period_end), 'dd MMMM yyyy')}
             </p>
          </div>
        </div>

        <PDFDownloadLink 
           document={<VATReportPDF period={period} invoices={invoices} expenses={expenses} businessProfile={businessProfile} />}
           fileName={`TouchTeq-VAT-${period.id.slice(0, 8)}.pdf`}
           className="bg-white hover:bg-orange-500 text-black hover:text-white px-8 py-3 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
        >
           {({ loading }: any) => (
             <span className="flex items-center gap-2">
               {loading ? 'Preparing...' : <><Download size={14} /> Download PDF Working Paper</>}
             </span>
           )}
        </PDFDownloadLink>
      </div>

      {/* Summary Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="p-8 border-b border-slate-800/50 bg-[#151B28]">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Total Output VAT</p>
                   <h3 className="text-3xl font-black text-white">{formatCurrency(period.output_vat)}</h3>
                   <p className="text-[10px] text-slate-600 font-bold uppercase">{invoices.length} Invoices Captured</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Total Input VAT</p>
                   <h3 className="text-3xl font-black text-white">{formatCurrency(period.input_vat)}</h3>
                   <p className="text-[10px] text-slate-600 font-bold uppercase">{expenses.length} Claimable Expenses</p>
                </div>
                <div className="bg-orange-500/10 p-6 rounded-xl border border-orange-500/20 space-y-1">
                   <p className="text-[9px] font-black uppercase text-orange-500 tracking-[0.3em] mb-2">Net VAT Payable</p>
                   <h3 className="text-4xl font-black text-orange-500">{formatCurrency(period.net_vat_payable)}</h3>
                   <p className="text-[10px] text-orange-500/60 font-medium uppercase tracking-tighter">Amount due to SARS</p>
                </div>
             </div>
          </div>
          
          <div className="flex border-b border-slate-800">
             <button 
               onClick={() => setActiveTab('summary')}
               className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'summary' ? 'bg-orange-500 text-white shadow-[inset_0_-4px_0_rgba(255,255,255,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
             >
                Summary
             </button>
             <button 
               onClick={() => setActiveTab('invoices')}
               className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'invoices' ? 'bg-orange-500 text-white shadow-[inset_0_-4px_0_rgba(255,255,255,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
             >
                Invoices ({invoices.length})
             </button>
             <button 
               onClick={() => setActiveTab('expenses')}
               className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'expenses' ? 'bg-orange-500 text-white shadow-[inset_0_-4px_0_rgba(255,255,255,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
             >
                Expenses ({expenses.length})
             </button>
          </div>

          <div className="p-8 min-h-[400px]">
             {activeTab === 'summary' && (
                <div className="space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                            <TrendingUp size={16} className="text-red-500" /> Output VAT (Payable)
                         </h4>
                         <div className="space-y-3 bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
                            <div className="flex justify-between text-sm">
                               <span className="text-slate-500 font-medium">Invoiced Total (Excl VAT)</span>
                               <span className="text-white font-black">{formatCurrency(invoices.reduce((s: number, i: any) => s + Number(i.subtotal), 0))}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-3 border-t border-slate-800/50">
                               <span className="text-slate-500 font-medium">VAT Total (Output)</span>
                               <span className="text-red-500 font-black">{formatCurrency(period.output_vat)}</span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                            <TrendingDown size={16} className="text-green-500" /> Input VAT (Claimable)
                         </h4>
                         <div className="space-y-3 bg-[#0B0F19] p-6 rounded-xl border border-slate-800">
                            <div className="flex justify-between text-sm">
                               <span className="text-slate-500 font-medium">Expense Total (Excl VAT)</span>
                               <span className="text-white font-black">{formatCurrency(expenses.reduce((s: number, e: any) => s + Number(e.amount_exclusive), 0))}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-3 border-t border-slate-800/50">
                               <span className="text-slate-500 font-medium">VAT Total (Input)</span>
                               <span className="text-green-500 font-black">{formatCurrency(period.input_vat)}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-[#0B0F19]/50 p-10 rounded-2xl border border-slate-800 text-center space-y-4">
                      <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-2">
                         <Calculator size={32} />
                      </div>
                      <h4 className="text-white font-black text-xl uppercase tracking-tighter">Reconciliation Statement</h4>
                      <p className="text-slate-400 font-medium text-sm max-w-lg mx-auto">
                        Based on your records for this period, you owe SARS <span className="text-orange-500 font-black">{formatCurrency(period.net_vat_payable)}</span> in VAT. 
                        This figure should be entered on your <span className="text-white font-bold italic">VAT201 return</span> on eFiling.
                      </p>
                      
                      <div className="flex items-center justify-center gap-6 pt-6">
                         <div className="text-left">
                            <p className="text-[9px] font-black uppercase text-slate-500">Submission Date</p>
                            <p className="text-sm font-black text-white uppercase">{period.submission_date ? format(parseISO(period.submission_date), 'dd MMM yyyy') : 'NOT SUBMITTED'}</p>
                         </div>
                         <div className="w-px h-10 bg-slate-800" />
                         <div className="text-left">
                            <p className="text-[9px] font-black uppercase text-slate-500">Payment Status</p>
                            <p className="text-sm font-black text-white uppercase">{period.payment_date ? format(parseISO(period.payment_date), 'dd MMM yyyy') : period.status}</p>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {(activeTab === 'invoices' || activeTab === 'expenses') && (
                <div className="space-y-6">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none pl-12 pr-4 py-4 text-sm text-white font-medium rounded-xl transition-all"
                      />
                   </div>

                   <div className="border border-slate-800/50 rounded-xl overflow-hidden">
                      <table className="w-full text-left bg-slate-900/40">
                         <thead>
                            <tr className="bg-[#0B0F19]/50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                               <th className="px-6 py-4">{activeTab === 'invoices' ? 'Invoice #' : 'Date'}</th>
                               <th className="px-6 py-4">{activeTab === 'invoices' ? 'Client' : 'Supplier'}</th>
                               <th className="px-6 py-4">{activeTab === 'invoices' ? 'Issue Date' : 'Category'}</th>
                               <th className="px-6 py-4 text-right">Exclusive</th>
                               <th className="px-6 py-4 text-right">VAT Amount</th>
                               <th className="px-6 py-4 text-right">Inclusive</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800/30">
                            {activeTab === 'invoices' ? (
                               filteredInvoices.map((inv: any) => (
                                  <tr key={inv.id} className="text-sm hover:bg-slate-800/20 transition-colors">
                                     <td className="px-6 py-4 text-white font-black">{inv.invoice_number}</td>
                                     <td className="px-6 py-4 text-slate-300 font-medium">{inv.clients?.company_name}</td>
                                     <td className="px-6 py-4 text-slate-500">{format(parseISO(inv.issue_date), 'dd MMM yyyy')}</td>
                                     <td className="px-6 py-4 text-right text-slate-300">{formatCurrency(Number(inv.subtotal))}</td>
                                     <td className="px-6 py-4 text-right text-red-500 font-bold">{formatCurrency(Number(inv.vat_amount))}</td>
                                     <td className="px-6 py-4 text-right text-white font-black">{formatCurrency(Number(inv.total_amount))}</td>
                                  </tr>
                               ))
                            ) : (
                               filteredExpenses.map((ex: any) => (
                                  <tr key={ex.id} className="text-sm hover:bg-slate-800/20 transition-colors">
                                     <td className="px-6 py-4 text-white font-black">{format(parseISO(ex.expense_date), 'dd MMM yyyy')}</td>
                                     <td className="px-6 py-4 text-slate-300 font-medium">{ex.supplier_name}</td>
                                     <td className="px-6 py-4 text-slate-500 uppercase text-[10px] font-bold">{ex.category}</td>
                                     <td className="px-6 py-4 text-right text-slate-300">{formatCurrency(Number(ex.amount_exclusive))}</td>
                                     <td className="px-6 py-4 text-right text-green-500 font-bold">{formatCurrency(Number(ex.input_vat_amount))}</td>
                                     <td className="px-6 py-4 text-right text-white font-black">{formatCurrency(Number(ex.amount_inclusive))}</td>
                                  </tr>
                               ))
                            )}
                         </tbody>
                         <tfoot className="bg-[#0B0F19]/50 border-t border-slate-800">
                            <tr className="font-black text-white text-xs uppercase tracking-tight">
                               <td colSpan={3} className="px-6 py-5">Subtotals</td>
                               <td className="px-6 py-5 text-right">
                                  {formatCurrency(
                                    activeTab === 'invoices' 
                                      ? filteredInvoices.reduce((s: number, i: any) => s + Number(i.subtotal), 0)
                                      : filteredExpenses.reduce((s: number, e: any) => s + Number(e.amount_exclusive), 0)
                                  )}
                               </td>
                               <td className={`px-6 py-5 text-right ${activeTab === 'invoices' ? 'text-red-500' : 'text-green-500'}`}>
                                  {formatCurrency(
                                    activeTab === 'invoices' 
                                      ? filteredInvoices.reduce((s: number, i: any) => s + Number(i.vat_amount), 0)
                                      : filteredExpenses.reduce((s: number, e: any) => s + Number(e.input_vat_amount), 0)
                                  )}
                               </td>
                               <td className="px-6 py-5 text-right">
                                  {formatCurrency(
                                    activeTab === 'invoices' 
                                      ? filteredInvoices.reduce((s: number, i: any) => s + Number(i.total_amount), 0)
                                      : filteredExpenses.reduce((s: number, e: any) => s + Number(e.amount_inclusive), 0)
                                  )}
                               </td>
                            </tr>
                         </tfoot>
                      </table>
                   </div>
                </div>
             )}
          </div>
      </section>
    </div>
  );
}
