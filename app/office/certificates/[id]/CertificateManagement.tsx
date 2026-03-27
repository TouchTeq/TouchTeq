'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  Download, 
  CheckCircle2, 
  Shield,
  ShieldCheck,
  Mail,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  X,
  Plus,
  Printer,
  History,
  Maximize2,
  ChevronDown,
  FileDown,
  ExternalLink,
  Zap,
  ClipboardList,
  Wrench,
  HardHat,
  Stethoscope,
  FileText,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { CertificatePDF } from '@/lib/certificates/CertificatePDF';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';
import { useOfficeToast } from '@/components/office/OfficeToastContext';

export default function CertificateManagement({ certificate, businessProfile }: any) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useOfficeToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(certificate.clients?.email || '');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-slate-800 text-slate-400 border-slate-700/50';
      case 'Issued': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Superseded': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700/50';
    }
  };

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      commissioning: 'Commissioning Certificate',
      hac: 'Hazardous Area Classification',
      sat: 'Site Acceptance Test (SAT)',
      as_built: 'As-Built Certificate',
      installation: 'Equipment Installation',
      maintenance: 'Maintenance & Inspection',
      sil: 'SIL Verification Report',
    };
    return types[type] || 'Compliance Certificate';
  };

  const handleDownloadPDF = async () => {
    setLoading('pdf');
    try {
      const blob = await pdf(<CertificatePDF certificate={certificate} businessProfile={businessProfile} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TouchTeq-${certificate.certificate_number}-${certificate.clients?.company_name.replace(/\s+/g, '')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Failed to generate PDF.");
    } finally {
      setLoading(null);
    }
  };

  const handleIssue = async () => {
    if (certificate.status !== 'Draft') return;
    if (!confirm("Are you sure you want to officially issue this certificate? This will lock it from further edits.")) return;
    
    setLoading('issue');
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ status: 'Issued' })
        .eq('id', certificate.id);
      
      if (error) throw error;
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F97316', '#FFFFFF', '#22C55E']
      });
      
      toast.success({ title: 'Certificate Issued', message: 'Document has been officially localized.' });
      router.refresh();
    } catch (e: any) {
      toast.error({ title: 'Issue Failed', message: e.message });
    } finally {
      setLoading(null);
    }
  };

  const handleSendEmail = async () => {
    setLoading('email');
    setError(null);
    try {
      const blob = await pdf(<CertificatePDF certificate={certificate} businessProfile={businessProfile} />).toBlob();
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result?.toString().split(',')[1]);
        reader.readAsDataURL(blob);
      });
      const base64Content = await base64Promise;

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          subject: `${getTypeName(certificate.certificate_type)}: ${certificate.certificate_number}`,
          message: emailMessage,
          attachment: {
            content: base64Content,
            filename: `${certificate.certificate_number}.pdf`,
            type: 'application/pdf'
          }
        })
      });

      if (!response.ok) throw new Error('Email sending failed.');

      setShowEmailModal(false);
      toast.success({ title: 'Email Sent', message: 'Certificate has been emailed to the client.' });
      
      // Auto-issue if it's still draft?
      if (certificate.status === 'Draft') {
        await supabase.from('certificates').update({ status: 'Issued' }).eq('id', certificate.id);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
      toast.error({ title: 'Email Failed', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  const deleteCertificate = async () => {
    if (!confirm(`Are you sure you want to delete certificate ${certificate.certificate_number}?`)) return;
    
    setLoading('delete');
    try {
      const { error } = await supabase.from('certificates').delete().eq('id', certificate.id);
      if (error) throw error;
      toast.success({ title: 'Deleted', message: 'Certificate removed.' });
      router.push('/office/certificates');
    } catch (e: any) {
      toast.error({ title: 'Delete Failed', message: e.message });
    } finally {
      setLoading(null);
    }
  };

  const supersedeCertificate = () => {
    router.push(`/office/certificates/new?supersedeId=${certificate.id}`);
  };

  return (
    <div className="space-y-10">
      {/* Management Toolbar */}
      <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link href="/office/certificates" className="p-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="h-10 w-px bg-slate-800" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Compliance Management</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getStatusColor(certificate.status)}`}>
                {certificate.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {certificate.status === 'Draft' && (
            <>
              <Link 
                href={`/office/certificates/${certificate.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-all"
              >
                <Edit2 size={14} /> Edit
              </Link>
              <button 
                onClick={handleIssue}
                disabled={loading === 'issue'}
                className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest bg-green-500 text-white hover:bg-green-600 rounded border border-green-600/20 shadow-xl shadow-green-500/10 transition-all"
              >
                <CheckCircle2 size={14} /> Issue Certificate
              </button>
            </>
          )}

          <button 
            onClick={handleDownloadPDF}
            disabled={loading === 'pdf'}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-all"
          >
            <Download size={14} /> PDF
          </button>

          <button 
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded border border-blue-600/20 transition-all"
          >
            <Send size={14} /> Issue & Email
          </button>

          {certificate.status === 'Issued' && (
            <button 
              onClick={supersedeCertificate}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-orange-600 text-white hover:bg-orange-700 rounded border border-orange-700/20 shadow-xl shadow-orange-500/10 transition-all"
            >
              <RotateCcw size={14} /> Supersede
            </button>
          )}

          {certificate.status === 'Draft' && (
            <button 
              onClick={deleteCertificate}
              disabled={loading === 'delete'}
              className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Document Preview */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6 px-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Professional Compliance Output</p>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-orange-500 transition-colors"
            >
              <Maximize2 size={12} /> Fullscreen
            </button>
          </div>
          
          <div
            className="w-full bg-white text-slate-900 shadow-2xl rounded-sm p-12 min-h-[1000px] flex flex-col cursor-zoom-in relative group"
            onClick={() => setShowPreviewModal(true)}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-all z-10 pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2">
                <Maximize2 size={12} /> Click to expand
              </span>
            </div>

            {/* Branded Header */}
            <div className="flex justify-between items-start mb-12 border-b-2 border-orange-500 pb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center font-black text-white italic text-xl">T</div>
                <div>
                  <span className="font-black text-xl uppercase tracking-tighter">Touch<span className="text-orange-500">Teq</span></span>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Engineering Services</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">{getTypeName(certificate.certificate_type)}</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No: {certificate.certificate_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div className="space-y-4">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Client Information:</h3>
                <div className="space-y-1">
                  <p className="font-black text-sm uppercase">{certificate.clients?.company_name}</p>
                  <p className="text-xs font-bold text-slate-700">Attn: {certificate.clients?.contact_person}</p>
                  <p className="text-xs text-slate-500 font-medium">{certificate.site_name}</p>
                  <p className="text-xs text-slate-400 font-medium">{certificate.site_address}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Technical Details:</h3>
                <div className="grid grid-cols-2 gap-y-3">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date of Inspection</p>
                    <p className="text-xs font-bold">{format(new Date(certificate.inspection_date), 'dd MMMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Project Reference</p>
                    <p className="text-xs font-bold">{certificate.project_reference || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lead Engineer</p>
                    <p className="text-xs font-bold">{certificate.engineer_name}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Registration No</p>
                    <p className="text-xs font-bold">{certificate.engineer_registration || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pass Fail Result */}
            <div className={`p-6 rounded border-2 border-dashed flex flex-col items-center justify-center mb-10 ${
              certificate.pass_fail_status ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
            }`}>
              <h4 className={`text-xl font-black uppercase tracking-[0.2em] ${
                certificate.pass_fail_status ? 'text-green-700' : 'text-red-700'
              }`}>
                STATUS: {certificate.pass_fail_status ? 'COMPLIANT / PASSED' : 'NON-COMPLIANT / FAILED'}
              </h4>
            </div>

            {/* Remarks Section */}
            <div className="bg-slate-50 p-8 rounded border border-slate-100 mb-10 min-h-[200px]">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 border-b pb-2">Professional Remarks & Technical Findings</h4>
              <p className="text-slate-700 text-sm leading-relaxed font-medium">{certificate.notes || 'No additional remarks provided.'}</p>
            </div>

            {/* Standards */}
            <div className="mb-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Standards Referenced: <span className="text-slate-600">{certificate.standards_referenced || 'General Engineering Best Practices'}</span>
            </div>

            <div className="mt-auto pt-10 border-t border-slate-100 flex justify-between items-end">
              <div className="w-48 border-t border-slate-400 pt-2 text-center">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Authorized Signature</p>
                <p className="font-bold text-xs uppercase mt-2">{certificate.engineer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                  {businessProfile.legal_name} • {businessProfile.vat_number}
                </p>
                <p className="text-[7px] font-medium text-slate-300 uppercase tracking-tight">
                  {businessProfile.email} • {businessProfile.website}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10"><Shield size={80} /></div>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2 relative z-10">
               Compliance Artifact
             </h3>
             <div className="space-y-4 relative z-10">
               <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase">Certificate Number</p>
                 <p className="text-lg font-black text-white">{certificate.certificate_number}</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase">Next Inspection Date</p>
                 <p className="text-sm font-black text-orange-500 uppercase tracking-tight">
                   {certificate.next_inspection_date ? format(new Date(certificate.next_inspection_date), 'dd MMM yyyy') : 'No date set'}
                 </p>
               </div>
             </div>
          </div>

          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-5 bg-slate-900 icon-glow border-b border-slate-800/50">
               <h3 className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <History size={14} className="text-orange-500" /> Document Log
               </h3>
            </div>
            <div className="p-6">
               <div className="flex items-start gap-4">
                  <div className="w-px bg-slate-800 h-12 relative">
                    <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  </div>
                  <div>
                    <p className="text-white text-[11px] font-bold uppercase tracking-tight">Document Created</p>
                    <p className="text-slate-500 text-[10px] font-medium">{format(new Date(certificate.created_at), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowEmailModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-[#151B28] border border-slate-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative z-10">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-black uppercase tracking-widest text-xs">Issue & Send Certificate</h3>
                <button onClick={() => setShowEmailModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Recipient Email</label>
                  <input 
                    type="email" 
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded p-4 text-white text-sm outline-none focus:border-orange-500 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Personal Message (Optional)</label>
                  <textarea 
                    rows={4}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Type a brief message to the client..."
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded p-4 text-white text-sm outline-none focus:border-orange-500"
                  />
                </div>
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-relaxed">
                    Clicking 'Issue & Send' will officially mark this certificate as Issued and email the PDF attachment to the client.
                  </p>
                </div>
                <button 
                  onClick={handleSendEmail}
                  disabled={loading === 'email' || !recipientEmail}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20"
                >
                  {loading === 'email' ? 'Generating & Sending...' : (<><Send size={16} /> Issue & Send Now</>)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm" onClick={() => setShowPreviewModal(false)}>
            <button onClick={() => setShowPreviewModal(false)} className="absolute top-6 right-6 z-10 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all shadow-xl"><X size={20} /></button>
            <div className="w-full h-full max-w-4xl bg-white rounded-sm overflow-auto" onClick={e => e.stopPropagation()}>
               {/* Embed the same preview UI here but larger */}
               <div className="p-12 text-slate-900">
                  {/* ... same as above content ... */}
                  <h1 className="text-center font-black uppercase text-2xl mb-8">Full Document Preview</h1>
                  {/* Reuse Certificate PDF content simplified or just standard preview layout */}
                  <div className="border border-slate-200 p-12"><h2>Document Content Rendered Here</h2></div>
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
