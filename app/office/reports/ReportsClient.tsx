'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  AlertCircle, 
  Receipt, 
  PieChart, 
  Calendar, 
  ChevronRight, 
  FileText, 
  Download,
  ArrowLeft,
  Loader2,
  TrendingUp,
  Search,
  Filter,
  CreditCard,
  Target,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MonthlyRevenueReport from './MonthlyRevenueReport';
import ClientRevenueReport from './ClientRevenueReport';
import DebtorsReport from './DebtorsReport';
import ExpenseSummaryReport from './ExpenseSummaryReport';
import VatHistoryReport from './VatHistoryReport';
import AnnualIncomeSummary from './AnnualIncomeSummary';
import ProfitLossReport from './ProfitLossReport';

const REPORTS = [
  { id: '1', title: 'Monthly Revenue', description: 'Monthly invoiced vs collected revenue tracking.', icon: TrendingUp, color: 'text-blue-500' },
  { id: '2', title: 'Client Revenue', description: 'Revenue breakdown by client and collection rank.', icon: Users, color: 'text-orange-500' },
  { id: '3', title: 'Outstanding Debtors', description: 'Ageing analysis of unpaid invoices and collection status.', icon: AlertCircle, color: 'text-red-500' },
  { id: '4', title: 'Expense Summary', description: 'Categorized spending analysis and VAT claim history.', icon: CreditCard, color: 'text-purple-500' },
  { id: '5', title: 'VAT History', description: 'Complete record of Output and Input VAT per period.', icon: PieChart, color: 'text-green-500' },
  { id: '6', title: 'Annual Income', description: 'Full year financial health and gross profit estimate.', icon: Target, color: 'text-amber-500' },
  { id: '7', title: 'Profit & Loss', description: 'Income statement with revenue, expenses, and net profit analysis.', icon: Wallet, color: 'text-cyan-500' },
];

export default function ReportsClient() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const renderReport = () => {
    switch (activeReport) {
      case '1': return <MonthlyRevenueReport />;
      case '2': return <ClientRevenueReport />;
      case '3': return <DebtorsReport />;
      case '4': return <ExpenseSummaryReport />;
      case '5': return <VatHistoryReport />;
      case '6': return <AnnualIncomeSummary />;
      case '7': return <ProfitLossReport />;
      default: return null;
    }
  };

  return (
    <div className="w-full space-y-12">
      <AnimatePresence mode="wait">
        {!activeReport ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {REPORTS.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className="bg-[#151B28] border border-slate-800/50 p-8 rounded-2xl text-left hover:border-orange-500/50 hover:bg-slate-800/30 transition-all group relative overflow-hidden active:scale-95"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                   <report.icon size={120} />
                </div>
                
                <div className={`w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center ${report.color} mb-6 border border-slate-800 group-hover:bg-slate-800 transition-all`}>
                   <report.icon size={28} />
                </div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 flex items-center justify-between">
                   {report.title}
                   <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                   {report.description}
                </p>
                
                <div className="mt-8 pt-6 border-t border-slate-800/50">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <FileText size={12} /> Generate Report
                   </span>
                </div>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="report"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setActiveReport(null)}
                 className="w-10 h-10 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
               >
                 <ArrowLeft size={20} />
               </button>
               <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                    {REPORTS.find(r => r.id === activeReport)?.title}
                  </h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Financial Reporting System
                  </p>
               </div>
            </div>

            <div className="bg-[#151B28] border border-slate-800/50 rounded-2xl p-8 lg:p-12 shadow-2xl overflow-hidden min-h-[600px]">
               {renderReport()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
