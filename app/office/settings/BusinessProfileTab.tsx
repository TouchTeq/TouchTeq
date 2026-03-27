'use client';

import { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save
} from 'lucide-react';
import { updateBusinessProfile, uploadFile } from '@/lib/settings/actions';
import { motion } from 'motion/react';
import { useOfficeBranding } from '@/components/office/OfficeBrandingContext';
import { DatePicker } from '@/components/ui/DatePicker';

export default function BusinessProfileTab({ profile, setProfile }: { profile: any, setProfile: (p: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { setLogoUrl } = useOfficeBranding();

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await uploadFile(formData, 'logos', `logo-${Date.now()}.${file.name.split('.').pop()}`);
    if (res.success && res.url) {
      const updated = { ...profile, logo_url: res.url };
      await updateBusinessProfile(updated);
      setProfile(updated);
      setLogoUrl(res.url);
    }
    setUploading(false);
  };

  const addCredential = () => {
    const updated = {
      ...profile,
      credentials: [...(profile.credentials || []), { type: '', number: '', expiry: '' }]
    };
    setProfile(updated);
  };

  const updateCredential = (index: number, field: string, value: string) => {
    const newCreds = [...profile.credentials];
    newCreds[index] = { ...newCreds[index], [field]: value };
    setProfile({ ...profile, credentials: newCreds });
  };

  const removeCredential = (index: number) => {
    const newCreds = profile.credentials.filter((_: any, i: number) => i !== index);
    setProfile({ ...profile, credentials: newCreds });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <form onSubmit={handleUpdate} className="space-y-10">
        {/* Core Profile */}
        <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Business Profile</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Core Identity & Contact Details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trading Name</label>
              <input 
                type="text" 
                value={profile.trading_name || ''}
                onChange={e => setProfile({ ...profile, trading_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none"
                placeholder="e.g. TouchTeq"
              />
            </div>

            <div className="space-y-2 relative group">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Entity Name</label>
              <input 
                type="text" 
                value={profile.legal_name || ''}
                readOnly
                className="w-full bg-slate-800/50 border border-slate-800 rounded-xl px-5 py-4 text-slate-500 cursor-not-allowed outline-none"
              />
              <div className="absolute right-4 top-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-lg pointer-events-none">
                 <AlertCircle size={12} className="text-orange-500" />
                 <span className="text-[8px] font-bold text-slate-500 uppercase whitespace-nowrap">Contact admin to update legal name</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">VAT Number</label>
              <input 
                type="text" 
                value={profile.vat_number || ''}
                readOnly
                className="w-full bg-slate-800/50 border border-slate-800 rounded-xl px-5 py-4 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registration Number</label>
              <input 
                type="text" 
                value={profile.registration_number || ''}
                readOnly
                className="w-full bg-slate-800/50 border border-slate-800 rounded-xl px-5 py-4 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Physical Address</label>
              <textarea 
                rows={3}
                value={profile.physical_address || ''}
                onChange={e => setProfile({ ...profile, physical_address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Postal Address</label>
                 <button 
                   type="button" 
                   onClick={() => setProfile({ ...profile, postal_address: profile.physical_address })}
                   className="text-[9px] font-black text-orange-500 uppercase tracking-widest hover:underline"
                 >
                    Same as physical
                 </button>
              </div>
              <textarea 
                rows={3}
                value={profile.postal_address || ''}
                onChange={e => setProfile({ ...profile, postal_address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Support Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={profile.email || ''}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-5 py-4 text-white focus:border-orange-500 transition-all outline-none"
                />
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={profile.phone || ''}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-5 py-4 text-white focus:border-orange-500 transition-all outline-none"
                />
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Website</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={profile.website || ''}
                  onChange={e => setProfile({ ...profile, website: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-5 py-4 text-white focus:border-orange-500 transition-all outline-none"
                />
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              </div>
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
           <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Branding</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Logo & Visual Assets</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10">
             <div className="w-64 h-32 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="Logo" className="max-w-[80%] max-h-[80%] object-contain" />
                ) : (
                  <Building2 size={40} className="text-slate-800" />
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                     <Loader2 className="animate-spin text-orange-500" />
                  </div>
                )}
             </div>

             <div className="flex-1 space-y-4">
                <label className="inline-flex items-center gap-3 bg-white text-black px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-slate-200 transition-all shadow-xl shadow-white/5">
                   <Upload size={16} /> {profile.logo_url ? 'Replace Logo' : 'Upload Logo'}
                   <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                </label>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                   Recommended minimum 300x100px. Transparent backgrounds (PNG/SVG) look best on documentation.
                </p>
             </div>
          </div>
        </section>

        {/* Credentials */}
        <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Credentials & Certifications</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">B-BBEE, Professional Memberships, etc.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={addCredential}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
              >
                 <Plus size={14} /> Add Credential
              </button>
           </div>

           <div className="space-y-4">
              {profile.credentials?.map((cred: any, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 items-end">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Type</label>
                      <input 
                        type="text" 
                        value={cred.type} 
                        onChange={e => updateCredential(idx, 'type', e.target.value)}
                        placeholder="e.g. B-BBEE Level 1"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm outline-none"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Number</label>
                      <input 
                        type="text" 
                        value={cred.number}
                        onChange={e => updateCredential(idx, 'number', e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm outline-none"
                      />
                   </div>
                   <DatePicker 
                     label="Expiry"
                     value={cred.expiry}
                     onChange={(val) => updateCredential(idx, 'expiry', val)}
                   />
                   <button 
                     type="button" 
                     onClick={() => removeCredential(idx)}
                     className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-3 rounded-lg transition-all w-fit"
                   >
                      <Trash2 size={18} />
                   </button>
                </div>
              ))}
              {(!profile.credentials || profile.credentials.length === 0) && (
                <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl">
                   <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">No credentials added yet</p>
                </div>
              )}
           </div>
        </section>

        {/* Floating Actions */}
        <div className="flex items-center justify-end sticky bottom-8 pt-4 pointer-events-none">
           <button 
             type="submit"
             disabled={loading}
             className="pointer-events-auto flex items-center gap-3 bg-orange-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/40 disabled:opacity-50"
           >
              {loading ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {loading ? 'Saving Changes...' : success ? 'Settings Saved!' : 'Save Profile'}
           </button>
        </div>
      </form>
    </motion.div>
  );
}
