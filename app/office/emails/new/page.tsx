'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  ArrowLeft, 
  Mail, 
  User, 
  Plus, 
  Trash2, 
  Sparkles,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { useAiDraft } from '@/components/office/AiDraftContext';

export default function NewEmailPage() {
  const router = useRouter();
  const toast = useOfficeToast();
  const { draft, clearAiDraft } = useAiDraft();
  const [loading, setLoading] = useState(false);

  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    if (draft && draft.type === 'email') {
      const { to, subject, body } = draft.data;
      setEmailData({
        to: to || '',
        subject: subject || '',
        body: body || ''
      });
      toast.success({ 
          title: "AI Draft Loaded", 
          message: "Email details pre-populated." 
      });
      clearAiDraft();
    }
  }, [draft, clearAiDraft, toast]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailData.to || !emailData.subject || !emailData.body) {
      toast.error({ title: "Form Incomplete", message: "Please fill in all fields." });
      return;
    }

    setLoading(true);
    // Future: Mock sending or use Brevo via actions
    setTimeout(() => {
      setLoading(false);
      toast.success({ title: "Email Sent", message: `Successfully sent to ${emailData.to}` });
      router.push('/office/dashboard');
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link 
          href="/office/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Compose Email</h1>
          <div className="px-3 py-1 bg-blue-500/10 text-blue-400 font-black text-[10px] uppercase tracking-widest rounded border border-blue-500/20 flex items-center gap-2">
            <Sparkles size={12} /> AI Powered
          </div>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        <div className="bg-[#151B28] border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Recipient */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Recipient Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-orange-500" size={18} />
                <input 
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                  placeholder="client@example.com"
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 pl-12 text-white transition-all font-medium rounded-xl shadow-inner"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Subject Line</label>
              <input 
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                placeholder="re: Quotation [QT-0001] for Touch Teq"
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-xl shadow-inner"
              />
            </div>

            {/* Body */}
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Message Body</label>
               <textarea 
                  rows={12}
                  value={emailData.body}
                  onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                  placeholder="Dear client, please find the attached..."
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-6 text-white transition-all font-medium rounded-xl resize-none shadow-inner leading-relaxed"
               />
            </div>
          </div>

          <div className="p-8 bg-[#0B0F19]/50 border-t border-slate-800/50 flex items-center justify-between">
            <button
               type="button"
               onClick={() => router.back()}
               className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Cancel Draft
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-500/20 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Send size={18} /> Send Message
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
