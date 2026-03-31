'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  Loader2,
  Info,
  Palette,
  Eye,
  EyeOff,
  X,
  Maximize2,
  ChevronDown,
  Download,
  Upload,
  FileCheck
} from 'lucide-react';
import { updateBusinessProfile, uploadDocumentTemplate } from '@/lib/settings/actions';
import { motion } from 'motion/react';
import InvoiceRenderer from '@/components/office/InvoiceRenderer';

export default function DocumentTemplatesTab({ profile, setProfile }: { profile: any, setProfile: (p: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [templateUpload, setTemplateUpload] = useState<{
    invoice: { loading: boolean; error: string | null; success: boolean };
    quote: { loading: boolean; error: string | null; success: boolean };
  }>({
    invoice: { loading: false, error: null, success: false },
    quote: { loading: false, error: null, success: false },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsPreviewFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const settings = profile.document_settings || {
    quote_validity_days: 30,
    quote_default_notes: 'This quotation is valid for 30 days from the date of issue. All prices exclude VAT unless otherwise stated.',
    quote_terms_conditions: '',
    invoice_payment_terms_days: 30,
    invoice_default_notes: 'Thank you for your business. Payment is due within 30 days.',
    invoice_thank_you_message: 'Thank you for your business — it was a pleasure working with you!',
    invoice_late_notice: 'Please note this invoice is overdue. Kindly arrange payment immediately.',
    invoice_terms_conditions: '',
    primary_color: '#E8500A',
    show_csd: true,
    show_website: true,
    font_family: 'Arial'
  };

  const updateSettings = (field: string, value: any) => {
    setProfile({
      ...profile,
      document_settings: { ...settings, [field]: value }
    });
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'invoice' | 'quote') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setTemplateUpload(prev => ({ ...prev, [type]: { loading: true, error: null, success: false } }));
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadDocumentTemplate(formData, type);
    if (res.success) {
      setProfile({
        ...profile,
        document_settings: {
          ...settings,
          [`${type}_template_url`]: res.url,
          [`${type}_template_name`]: res.filename,
          [`${type}_template_updated_at`]: new Date().toISOString(),
        },
      });
      setTemplateUpload(prev => ({ ...prev, [type]: { loading: false, error: null, success: true } }));
      setTimeout(() => setTemplateUpload(prev => ({ ...prev, [type]: { ...prev[type], success: false } })), 3000);
    } else {
      setTemplateUpload(prev => ({ ...prev, [type]: { loading: false, error: res.error ?? 'Upload failed', success: false } }));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateBusinessProfile(profile);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      {fontOpen && (
        <div className="fixed inset-0 z-[99]" onClick={() => setFontOpen(false)} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <form onSubmit={handleUpdate} className="space-y-8">
            {/* Quote Settings */}
            <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                     <FileText size={20} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Quotations</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Default behavior & Templates</p>
                  </div>
               </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Quote Validity (Days)</label>
                      <input 
                        type="number" 
                        value={settings.quote_validity_days}
                        onChange={e => updateSettings('quote_validity_days', parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none"
                      />
                   </div>
                   <ToggleRow
                      label="Always include VAT (15%)"
                      description="When disabled, VAT must be added manually per document"
                      enabled={settings.quote_always_include_vat !== false}
                      onToggle={() => updateSettings('quote_always_include_vat', !settings.quote_always_include_vat)}
                   />
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Default Quote Notes</label>
                      <textarea 
                        rows={3}
                        value={settings.quote_default_notes}
                        onChange={e => updateSettings('quote_default_notes', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none resize-none"
                      />
                   </div>
                </div>
            </section>

            {/* Invoice Settings */}
            <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                     <FileText size={20} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Invoices</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Payment terms & Legal notices</p>
                  </div>
               </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Terms (Days)</label>
                      <input 
                        type="number" 
                        value={settings.invoice_payment_terms_days}
                        onChange={e => updateSettings('invoice_payment_terms_days', parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none"
                      />
                   </div>
                   <ToggleRow
                      label="Always include VAT (15%)"
                      description="When disabled, VAT must be added manually per document"
                      enabled={settings.invoice_always_include_vat !== false}
                      onToggle={() => updateSettings('invoice_always_include_vat', !settings.invoice_always_include_vat)}
                   />
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Default Invoice Notes</label>
                     <textarea 
                       rows={3}
                       value={settings.invoice_default_notes}
                       onChange={e => updateSettings('invoice_default_notes', e.target.value)}
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none resize-none"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Thank You Message</label>
                     <textarea 
                       rows={2}
                       value={settings.invoice_thank_you_message}
                       onChange={e => updateSettings('invoice_thank_you_message', e.target.value)}
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none resize-none"
                     />
                  </div>
               </div>
            </section>

            {/* Appearance */}
            <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                     <Palette size={20} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Design & Branding</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Accent colors & Typography</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center gap-6">
                     <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Primary Color</label>
                        <div className="flex gap-4 items-center">
                           <input 
                             type="color" 
                             value={settings.primary_color}
                             onChange={e => updateSettings('primary_color', e.target.value)}
                             className="w-14 h-14 rounded-lg cursor-pointer bg-transparent border-none"
                           />
                           <input 
                             type="text" 
                             value={settings.primary_color}
                             onChange={e => updateSettings('primary_color', e.target.value)}
                             className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none font-mono"
                           />
                        </div>
                     </div>
                     
                      <div className="space-y-2 flex-1">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Document Font</label>
                         <div className="relative">
                            <button
                              type="button"
                              onClick={() => setFontOpen(!fontOpen)}
                              className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#0B0F19] ${
                                fontOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <span className="text-white">{settings.font_family}</span>
                              <ChevronDown size={14} className={`text-slate-500 transition-transform ${fontOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {fontOpen && (
                              <div className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] p-1">
                                {['Arial', 'Calibri', 'Times New Roman'].map(font => (
                                  <button
                                    key={font}
                                    type="button"
                                    onClick={() => {
                                      updateSettings('font_family', font);
                                      setFontOpen(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-bold text-sm ${
                                      settings.font_family === font ? 'text-orange-500' : 'text-slate-300'
                                    }`}
                                  >
                                    {font}
                                  </button>
                                ))}
                              </div>
                            )}
                         </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button
                        type="button"
                        onClick={() => updateSettings('show_csd', !settings.show_csd)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${settings.show_csd ? 'bg-orange-500/10 border-orange-500/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                     >
                        <span className="text-[10px] font-black uppercase tracking-widest">Show CSD Number</span>
                        {settings.show_csd ? <Eye size={16} /> : <EyeOff size={16} />}
                     </button>
                     <button
                        type="button"
                        onClick={() => updateSettings('show_website', !settings.show_website)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${settings.show_website ? 'bg-orange-500/10 border-orange-500/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                     >
                        <span className="text-[10px] font-black uppercase tracking-widest">Show Website</span>
                        {settings.show_website ? <Eye size={16} /> : <EyeOff size={16} />}
                     </button>
                  </div>
               </div>
            </section>

            {/* Document Templates */}
            <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center text-teal-500">
                     <FileCheck size={20} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Document Templates</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Word templates for invoices & quotes</p>
                  </div>
               </div>

               <div className="space-y-4">
                  {(['invoice', 'quote'] as const).map((type) => {
                    const label = type === 'invoice' ? 'Invoice Template' : 'Quote Template';
                    const templateUrl = settings[`${type}_template_url`];
                    const templateName = settings[`${type}_template_name`];
                    const updatedAt = settings[`${type}_template_updated_at`];
                    const state = templateUpload[type];
                    const formattedDate = updatedAt
                      ? new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(updatedAt))
                      : null;

                    return (
                      <div key={type} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black uppercase tracking-widest text-white">{label}</p>
                          {templateName ? (
                            <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                              {templateName}
                              {formattedDate && <span className="ml-2 text-slate-600">· {formattedDate}</span>}
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] font-medium text-slate-600">No template uploaded</p>
                          )}
                          {state.error && <p className="mt-1 text-[11px] font-bold text-red-400">{state.error}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {templateUrl && (
                            <a
                              href={templateUrl}
                              download
                              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:border-slate-500 hover:text-white"
                            >
                              <Download size={12} /> Download
                            </a>
                          )}
                          <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                            state.loading
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : state.success
                              ? 'bg-teal-500/20 border border-teal-500/50 text-teal-400'
                              : 'bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                          }`}>
                            {state.loading ? <Loader2 size={12} className="animate-spin" /> : state.success ? <CheckCircle2 size={12} /> : <Upload size={12} />}
                            {state.loading ? 'Uploading…' : state.success ? 'Uploaded!' : templateUrl ? 'Replace' : 'Upload'}
                            <input
                              type="file"
                              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              className="hidden"
                              disabled={state.loading}
                              onChange={(e) => handleTemplateUpload(e, type)}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
               </div>

               <p className="mt-5 text-[10px] font-medium leading-5 text-slate-500">
                  Templates use Microsoft Word format (.docx). Download the template, edit it in Word, and upload it back.
                  Changes take effect immediately on all new documents.
               </p>
            </section>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-3 bg-orange-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/40 disabled:opacity-50 w-full justify-center"
            >
               {loading ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Save size={18} />}
               {loading ? 'Saving Changes...' : success ? 'Templates Saved!' : 'Save Settings'}
            </button>
         </form>

         {/* Document Preview */}
         <div className="space-y-4 sticky top-24 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Eye size={14} /> LIVE DOCUMENT PREVIEW
              </h3>
              <button
                type="button"
                onClick={() => setIsPreviewFullscreen(true)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-orange-500 transition-colors"
              >
                <Maximize2 size={12} /> Fullscreen
              </button>
            </div>
            
            {/* Clickable preview thumbnail */}
            <div
              className="cursor-zoom-in relative group rounded-2xl overflow-hidden shadow-2xl border border-slate-700 hover:border-orange-500/50 transition-all"
              onClick={() => setIsPreviewFullscreen(true)}
              title="Click to preview fullscreen"
            >
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2">
                  <Maximize2 size={12} /> Click to expand
                </span>
              </div>
              <PreviewDocument settings={settings} profile={profile} />
            </div>
            
            <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
               <Info size={12} /> Click preview to expand. This preview now matches the exported invoice layout.
            </p>
         </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {isPreviewFullscreen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm"
          onClick={() => setIsPreviewFullscreen(false)}
        >
          <button
            onClick={() => setIsPreviewFullscreen(false)}
            className="absolute top-6 right-6 z-10 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all shadow-xl"
          >
            <X size={20} />
          </button>
          <div
            className="relative w-full h-full max-w-6xl max-h-[90vh] overflow-auto rounded-2xl shadow-2xl bg-white"
            onClick={e => e.stopPropagation()}
          >
            <PreviewDocument settings={settings} profile={profile} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PreviewDocument({ settings, profile }: { settings: any, profile: any }) {
  const previewProfile = {
    ...profile,
    document_settings: settings,
  };

  const previewInvoice = {
    invoice_number: 'INV-2026-001',
    issue_date: '2026-03-15',
    due_date: '2026-04-14',
    subtotal: 15000,
    vat_amount: 2250,
    total: 17250,
    amount_paid: 0,
    balance_due: 17250,
    notes: settings.invoice_default_notes,
    clients: {
      company_name: 'Sample Client (Pty) Ltd',
      contact_person: 'Accounts Payable',
      physical_address: '1 Sample Road, Weltevreden Park, Roodepoort, Johannesburg, 1709',
      vat_number: '4123456789',
    },
  };

  const previewLineItems = [
    {
      description: 'Software Development Services',
      quantity: 1,
      unit_price: 15000,
      line_total: 15000,
      qty_type: 'qty',
    },
  ];

  return (
    <div className="bg-slate-950/40 p-4">
      <InvoiceRenderer invoice={previewInvoice} lineItems={previewLineItems} businessProfile={previewProfile} />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  const toggleClass = (e: boolean) =>
    `h-5 w-10 rounded-full transition-all ${e ? 'bg-orange-500' : 'bg-slate-700'}`;
  const knobClass = (e: boolean) =>
    `block h-4 w-4 rounded-full bg-white transition-transform ${e ? 'translate-x-5' : 'translate-x-0.5'}`;

  return (
    <div className="flex items-center justify-between gap-6 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{description}</p>
      </div>
      <button type="button" onClick={onToggle} className={toggleClass(enabled)} aria-pressed={enabled}>
        <span className={knobClass(enabled)} />
      </button>
    </div>
  );
}
