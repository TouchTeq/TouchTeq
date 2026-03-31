'use client';

import { useState, useMemo } from 'react';
import { 
  Mail, 
  Save, 
  CheckCircle2, 
  Loader2,
  Info,
  Send,
  RotateCcw,
  Zap,
  Tag
} from 'lucide-react';
import { updateBusinessProfile, sendTestEmail } from '@/lib/settings/actions';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_PERSONAL_SIGNATURE = `Kind regards,
Thabo Matona | Pr Tech Eng (Elec)
Founder & Principal Engineer
Touch Teqniques Engineering Services
T: +27 72 552 2110
E: sales@touchteq.co.za
W: www.touchteq.co.za
SAQCC Fire Reg: DGS15/0130 | B-BBEE Level 1`;

const DEFAULT_ACCOUNTS_SIGNATURE = `Kind regards,
Touch Teq Accounts
Touch Teqniques Engineering Services
T: +27 72 552 2110
E: accounts@touchteq.co.za
W: www.touchteq.co.za`;

const EMAIL_TYPES = [
  { id: 'quote', label: 'Quotation Email', icon: Zap },
  { id: 'invoice', label: 'Tax Invoice Email', icon: Zap },
  { id: 'reminder_1', label: '1st Overdue Reminder', icon: Zap },
  { id: 'reminder_2', label: '2nd Overdue Reminder', icon: Zap },
  { id: 'final_notice', label: 'Final Notice', icon: Zap },
];

const MERGE_TAGS = [
  '[INV-XXXX]',
  '[QT-XXXX]',
  '[Client Name]',
  '[Amount]',
  '[Due Date]',
];

export default function EmailSettingsTab({ profile, setProfile }: { profile: any, setProfile?: (p: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeType, setActiveType] = useState('quote');
  const [templates, setTemplates] = useState(profile.email_templates || {});
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState('');

  const initialEmailSettings = useMemo(() => profile.email_settings || {}, [profile.email_settings]);
  const [personalSignature, setPersonalSignature] = useState(initialEmailSettings.personal_email_signature || DEFAULT_PERSONAL_SIGNATURE);
  const [accountsSignature, setAccountsSignature] = useState(initialEmailSettings.accounts_email_signature || DEFAULT_ACCOUNTS_SIGNATURE);
  const [savingSignatures, setSavingSignatures] = useState(false);
  const [signaturesSaved, setSignaturesSaved] = useState(false);

  const currentTemplate = templates[activeType] || {
    subject: '',
    body: ''
  };

  const updateTemplate = (field: string, value: string) => {
    setTemplates({
      ...templates,
      [activeType]: { ...currentTemplate, [field]: value }
    });
  };

  const handleUpdate = async () => {
    setLoading(true);
    const res = await updateBusinessProfile({ ...profile, email_templates: templates });
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSendingTest(true);
    setTestError('');
    const res = await sendTestEmail(testEmail, currentTemplate);
    if (res.success) {
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } else {
      setTestError(res.error || 'Test email could not be sent.');
    }
    setSendingTest(false);
  };

  const handleSaveSignatures = async () => {
    setSavingSignatures(true);
    const nextProfile = {
      ...profile,
      email_settings: {
        ...(profile.email_settings || {}),
        personal_email_signature: personalSignature || DEFAULT_PERSONAL_SIGNATURE,
        accounts_email_signature: accountsSignature || DEFAULT_ACCOUNTS_SIGNATURE,
      },
    };
    const res = await updateBusinessProfile(nextProfile);
    if (res.success) {
      if (setProfile) setProfile(nextProfile);
      window.localStorage.setItem(
        'touchteq_assistant_settings',
        JSON.stringify({
          document_settings: nextProfile.document_settings,
          email_settings: nextProfile.email_settings,
        })
      );
      window.dispatchEvent(new Event('touchteq-settings-change'));
      setSignaturesSaved(true);
      setTimeout(() => setSignaturesSaved(false), 2500);
    }
    setSavingSignatures(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      {/* Email Signatures Section */}
      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-orange-500" />
          <h3 className="text-white font-black uppercase tracking-[0.15em] text-sm">Email Signatures</h3>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Personal Signature (sales@)</label>
          <textarea
            rows={6}
            value={personalSignature}
            onChange={(e) => setPersonalSignature(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-medium focus:border-orange-500 outline-none resize-none"
          />
          <p className="text-[10px] text-slate-500">Used for emails sent from sales@touchteq.co.za</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Accounts Signature (accounts@)</label>
          <textarea
            rows={6}
            value={accountsSignature}
            onChange={(e) => setAccountsSignature(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-medium focus:border-orange-500 outline-none resize-none"
          />
          <p className="text-[10px] text-slate-500">Used for emails sent from accounts@touchteq.co.za</p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveSignatures}
            disabled={savingSignatures}
            className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {savingSignatures ? <Loader2 size={14} className="animate-spin" /> : signaturesSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {savingSignatures ? 'Saving...' : signaturesSaved ? 'Saved' : 'Save Signatures'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Sidebar: Email Types */}
         <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
               <Mail size={14} /> Outgoing Emails
            </h3>
            <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-2 shadow-xl">
               {EMAIL_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setActiveType(type.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === type.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
                  >
                     <type.icon size={16} />
                     {type.label}
                  </button>
               ))}
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 space-y-4">
               <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-2">
                  <Tag size={12} /> Available Merge Tags
               </h4>
               <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Use these tags in your subject or body. They will be replaced with real data automatically.
               </p>
               <div className="flex flex-wrap gap-2">
                  {MERGE_TAGS.map(tag => (
                     <code key={tag} className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[10px] text-orange-400 font-mono font-bold">
                        {tag}
                     </code>
                  ))}
               </div>
            </div>
         </div>

         {/* Main Editor */}
         <div className="lg:col-span-2 space-y-8">
            <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl space-y-8">
               <div className="flex items-center justify-between">
                  <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        {EMAIL_TYPES.find(t => t.id === activeType)?.label}
                     </h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure your email template</p>
                  </div>
                  <button 
                    onClick={() => {/* Reset logic */}}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all"
                  >
                     <RotateCcw size={14} /> Reset to Default
                  </button>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subject Line</label>
                     <input 
                       type="text" 
                       value={currentTemplate.subject}
                       onChange={e => updateTemplate('subject', e.target.value)}
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none shadow-inner"
                       placeholder="e.g. Quotation [QT-XXXX] from TouchTeq"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Body</label>
                     <textarea 
                       rows={12}
                       value={currentTemplate.body}
                       onChange={e => updateTemplate('body', e.target.value)}
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none resize-none shadow-inner font-medium leading-relaxed"
                       placeholder="Write your email content here..."
                     />
                  </div>
               </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-6 flex items-center gap-4">
                  <input 
                    type="email" 
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    placeholder="Test Email Address"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-orange-500 outline-none"
                  />
                  <button 
                    onClick={handleSendTest}
                    disabled={sendingTest || !testEmail}
                    className="bg-slate-800 text-white p-3 rounded-xl hover:bg-slate-700 transition-all disabled:opacity-50"
                  >
                     {sendingTest ? <Loader2 className="animate-spin" size={18} /> : testSuccess ? <CheckCircle2 size={18} className="text-green-500" /> : <Send size={18} />}
                  </button>
                </div>

                <button 
                 onClick={handleUpdate}
                 disabled={loading}
                 className="flex items-center gap-3 bg-orange-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/40 disabled:opacity-50 flex-1 justify-center"
               >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Save size={18} />}
                  {loading ? 'Saving Changes...' : success ? 'Templates Saved!' : 'Save Email Settings'}
               </button>
             </div>
             {testError && (
               <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                 {testError}
               </p>
             )}
          </div>
       </div>
    </motion.div>
  );
}
