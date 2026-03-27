'use client';

import React, { useState } from 'react';
import { 
  XCircle, 
  Calendar, 
  FileText, 
  Mail, 
  TrendingUp, 
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { getStatementData } from '@/lib/clients/statementActions';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { StatementPDF } from '../../lib/clients/StatementPDF';
import { logCommunication } from '@/lib/clients/commsActions';
import { sendDocumentEmail } from '@/lib/office/outbound-email';
import { createClient } from '@/lib/supabase/client';

interface GenerateStatementModalProps {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateStatementModal({ 
  clientId, 
  clientName, 
  clientEmail,
  isOpen, 
  onClose 
}: GenerateStatementModalProps) {
  const toast = useOfficeToast();
  const [range, setRange] = useState('current_month');
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setStatementData(null);
    try {
      const data = await getStatementData(clientId, range, customStart, customEnd);
      setStatementData(data);
    } catch (error) {
      toast.error({ title: 'Statement Error', message: 'Failed to aggregate statement data' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailStatement = async () => {
    if (!clientEmail) {
      toast.error({ title: 'Missing Email', message: 'Client has no email address configured' });
      return;
    }
    
    setSendingEmail(true);
    const supabase = createClient();
    try {
      // Generate PDF Base64
      const blob = await pdf(<StatementPDF data={statementData} />).toBlob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
      });
      reader.readAsDataURL(blob);
      const base64 = await base64Promise;

      // Send via unified email service
      const success = await sendDocumentEmail({
        supabase,
        documentType: 'statement',
        documentId: clientId, // For statements, we use client_id
        attachmentBase64: base64,
        recipientEmail: clientEmail,
        recipientName: clientName,
        subjectOverride: `Statement of Account - ${clientName}`,
        documentReference: `STMT-${format(new Date(), 'yyyyMMdd')}`
      });

      if (success) {
        toast.success({ title: 'Statement Sent', message: 'Statement emailed successfully' });
        onClose();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast.error({ title: 'Email Failed', message: 'Failed to email statement' });
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#151B28] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Generate Client Statement</h2>
              <p className="text-xs text-slate-500 font-medium">{clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Period Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Select Statement Period
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'current_month', label: 'Current Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'current_quarter', label: 'Current Quarter' },
                { id: 'full_tax_year', label: 'Full Tax Year' },
                { id: 'custom', label: 'Custom Range' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRange(p.id)}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                    range === p.id 
                      ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' 
                      : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {range === 'custom' && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Start Date</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">End Date</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="flex items-center justify-center py-4">
             {!statementData && !loading && (
               <button
                 onClick={fetchData}
                 className="group bg-slate-100 hover:bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl"
               >
                 Preview Statement <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
             )}
             {loading && (
               <div className="flex flex-col items-center gap-3">
                 <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculating balances...</p>
               </div>
             )}
          </div>

          {/* Preview / Results */}
          {statementData && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-3 gap-1 px-1">
                 <div className="bg-[#0F172A] p-4 rounded-l-xl border-y border-l border-slate-800">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Opening</p>
                   <p className="text-lg font-black text-slate-300">R {statementData.openingBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                 </div>
                 <div className="bg-[#0F172A] p-4 border-y border-x border-slate-800">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Trans. Count</p>
                   <p className="text-lg font-black text-slate-300">{statementData.transactions.length}</p>
                 </div>
                 <div className="bg-[#0F172A] p-4 rounded-r-xl border-y border-r border-slate-800">
                   <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Closing Due</p>
                   <p className="text-lg font-black text-orange-500">R {statementData.closingBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                 <PDFDownloadLink
                   document={<StatementPDF data={statementData} />}
                   fileName={`Statement_${clientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`}
                   className="flex-1 flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-slate-700 shadow-lg"
                 >
                   {({ loading }) => (
                     loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Download PDF</>
                   )}
                 </PDFDownloadLink>

                 <button
                   onClick={handleEmailStatement}
                   disabled={sendingEmail}
                   className="flex-1 flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-900/20"
                 >
                   {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Email to Client</>}
                 </button>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#0F172A]/80 border-t border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-2 text-slate-500">
             <Info className="w-4 h-4" />
             <p className="text-[10px] font-medium uppercase tracking-wider italic">Balances include static opening balance of R {(statementData?.client?.opening_balance || 0).toFixed(2)}</p>
           </div>
           <button
             onClick={onClose}
             className="px-6 py-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
}
