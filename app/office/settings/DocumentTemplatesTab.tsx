'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  CheckCircle2, 
  Loader2,
  Info,
  Type,
  Palette,
  Eye,
  EyeOff,
  X,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { updateBusinessProfile } from '@/lib/settings/actions';
import { motion } from 'motion/react';

export default function DocumentTemplatesTab({ profile, setProfile }: { profile: any, setProfile: (p: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);

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
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Default Invoice Notes</label>
                     <textarea 
                       rows={3}
                       value={settings.invoice_default_notes}
                       onChange={e => updateSettings('invoice_default_notes', e.target.value)}
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
                              className={`w-full flex items-center justify-between px-5 py-4 border rounded-xl transition-all font-medium bg-slate-900 ${
                                fontOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <span className="text-white">{settings.font_family}</span>
                              <ChevronDown size={14} className={`text-slate-500 transition-transform ${fontOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {fontOpen && (
                              <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50">
                                {['Arial', 'Calibri', 'Times New Roman'].map(font => (
                                  <button
                                    key={font}
                                    type="button"
                                    onClick={() => {
                                      updateSettings('font_family', font);
                                      setFontOpen(false);
                                    }}
                                    className={`w-full px-5 py-3 text-left hover:bg-slate-800 transition-colors font-medium ${
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
               <Info size={12} /> Click preview to expand. Actual documents may vary slightly.
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
  return (
    <div className="bg-white text-slate-900" style={{ fontFamily: settings.font_family }}>
      <div className="h-4 w-full" style={{ backgroundColor: settings.primary_color }} />
      <div className="p-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            {profile.logo_url ? (
              <img src={profile.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <h2 className="text-xl font-black text-slate-900 uppercase">{profile.trading_name || 'TouchTeq'}</h2>
            )}
            <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Tax Invoice</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[8px] font-bold text-slate-400 uppercase">Contact</p>
            <p className="text-[10px] font-bold">{profile.email}</p>
            {settings.show_website && profile.website && <p className="text-[10px] font-bold">{profile.website}</p>}
          </div>
        </div>

        <div className="flex justify-between mb-10">
          <div className="space-y-3 opacity-20">
            <div className="w-24 h-4 bg-slate-200 rounded" />
            <div className="w-32 h-3 bg-slate-100 rounded" />
            <div className="w-28 h-3 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2 text-right">
            <div className="inline-block px-3 py-1 rounded-sm text-white text-[10px] font-black uppercase" style={{ backgroundColor: settings.primary_color }}>
              INV-2026-001
            </div>
            <p className="text-[8px] font-bold text-slate-400">Due: 15 March 2026</p>
          </div>
        </div>

        <div className="mb-10">
          <div className="grid grid-cols-4 border-b-2 border-slate-900 pb-2 mb-2">
            <span className="text-[8px] font-black uppercase col-span-2">Description</span>
            <span className="text-[8px] font-black uppercase text-right">Qty</span>
            <span className="text-[8px] font-black uppercase text-right">Total</span>
          </div>
          <div className="grid grid-cols-4 pt-2">
            <span className="text-[10px] font-bold col-span-2">Software Development Services</span>
            <span className="text-[10px] font-bold text-right italic">1.0</span>
            <span className="text-[10px] font-bold text-right italic">R 15,000.00</span>
          </div>
        </div>

        {/* Fix 5: Total row — properly spaced, no overflow */}
        <div className="flex justify-end mb-10">
          <div className="w-48 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-400">VAT (15%)</span>
              <span>R 2,250.00</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 gap-4">
              <span className="text-sm font-black text-slate-900 uppercase tracking-wide whitespace-nowrap">Total</span>
              <span className="text-lg font-black tabular-nums" style={{ color: settings.primary_color }}>R 17,250.00</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-8 border-t border-slate-100">
          <div>
            <h5 className="text-[8px] font-black uppercase text-slate-400 mb-1">Notes</h5>
            <p className="text-[10px] leading-relaxed text-slate-600">{settings.invoice_default_notes}</p>
          </div>
          {profile.banking_details && (
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
              <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Payment Reference</p>
              <p className="text-[10px] font-bold">INV-2026-001</p>
            </div>
          )}
          <div className="text-[7px] text-slate-400 leading-tight">
            {profile.legal_name} • Reg: {profile.registration_number} • VAT: {profile.vat_number}
            {settings.show_csd && ` • CSD: ${profile.csd_number}`}
          </div>
        </div>
      </div>
    </div>
  );
}
