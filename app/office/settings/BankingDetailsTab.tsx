'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Save, 
  CheckCircle2, 
  Loader2,
  Info,
  ChevronDown
} from 'lucide-react';
import { updateBusinessProfile } from '@/lib/settings/actions';
import { motion } from 'motion/react';

export default function BankingDetailsTab({ profile, setProfile }: { profile: any, setProfile: (p: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);

  const banking = profile.banking_details || {
    bank_name: '',
    account_holder: profile.legal_name,
    account_number: '',
    branch_code: '',
    account_type: 'Cheque',
    payment_instructions: 'Please use your invoice number as payment reference'
  };

  const updateBanking = (field: string, value: string) => {
    setProfile({
      ...profile,
      banking_details: { ...banking, [field]: value }
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
         {/* Form Section */}
         <form onSubmit={handleUpdate} className="space-y-8">
            <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                     <CreditCard size={20} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Banking Details</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Payment Information for Invoices</p>
                  </div>
               </div>

               <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Bank Name</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setBankOpen(!bankOpen)}
                          className={`w-full flex items-center justify-between px-5 py-4 border rounded-xl transition-all font-medium bg-slate-900 ${
                            bankOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <span className={banking.bank_name ? 'text-white' : 'text-slate-500'}>
                            {banking.bank_name || 'Select Bank'}
                          </span>
                          <ChevronDown size={14} className={`text-slate-500 transition-transform ${bankOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {bankOpen && (
                          <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50">
                            {['FNB', 'Standard Bank', 'ABSA', 'Nedbank', 'Capitec', 'Other'].map(b => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => {
                                  updateBanking('bank_name', b);
                                  setBankOpen(false);
                                }}
                                className={`w-full px-5 py-3 text-left hover:bg-slate-800 transition-colors font-medium ${
                                  banking.bank_name === b ? 'text-orange-500' : 'text-slate-300'
                                }`}
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                   </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Account Holder Name</label>
                     <input 
                       type="text" 
                       value={banking.account_holder}
                       onChange={e => updateBanking('account_holder', e.target.value)}
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none"
                       placeholder="Legal Business Name"
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Account Number</label>
                        <input 
                          type="text" 
                          value={banking.account_number}
                          onChange={e => updateBanking('account_number', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Branch Code</label>
                        <input 
                          type="text" 
                          value={banking.branch_code}
                          onChange={e => updateBanking('branch_code', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Account Type</label>
                     <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                        {['Cheque', 'Savings', 'Current'].map(type => (
                           <button
                             key={type}
                             type="button"
                             onClick={() => updateBanking('account_type', type)}
                             className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${banking.account_type === type ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-white'}`}
                           >
                              {type}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Instructions</label>
                     <textarea 
                       rows={3}
                       value={banking.payment_instructions}
                       onChange={e => updateBanking('payment_instructions', e.target.value)}
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-white focus:border-orange-500 transition-all outline-none resize-none"
                       placeholder="e.g. Please use your invoice number as reference"
                     />
                  </div>
               </div>
            </section>

            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-3 bg-orange-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/40 disabled:opacity-50 w-full justify-center"
            >
               {loading ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Save size={18} />}
               {loading ? 'Saving Changes...' : success ? 'Banking Details Saved!' : 'Save Banking Details'}
            </button>
         </form>

         {/* Preview Section */}
         <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
               <Info size={14} /> LIVE INVOICE PREVIEW
            </h3>
            
            <div className="bg-white rounded-3xl p-10 text-slate-900 shadow-2xl border border-slate-200">
               <div className="flex justify-between items-start mb-16 opacity-30">
                  <div className="w-24 h-12 bg-slate-200 rounded" />
                  <div className="space-y-2">
                     <div className="w-20 h-4 bg-slate-200 rounded" />
                     <div className="w-32 h-6 bg-slate-200 rounded" />
                  </div>
               </div>

               <div className="space-y-4 mb-16 opacity-30">
                  <div className="w-full h-8 bg-slate-100 rounded" />
                  <div className="w-full h-8 bg-slate-100 rounded" />
                  <div className="w-full h-8 bg-slate-100 rounded" />
               </div>

               {/* The active part of the preview */}
               <div className="border-t-2 border-slate-900 pt-8 mt-10">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Banking Details & Payment</h4>
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-3">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black uppercase text-slate-400 opacity-60">Bank Name</span>
                           <span className="text-sm font-bold">{banking.bank_name || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black uppercase text-slate-400 opacity-60">Account Holder</span>
                           <span className="text-sm font-bold">{banking.account_holder || '—'}</span>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black uppercase text-slate-400 opacity-60">Account Number</span>
                           <span className="text-sm font-bold">{banking.account_number || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black uppercase text-slate-400 opacity-60">Account Type</span>
                           <span className="text-sm font-bold">{banking.account_type || '—'} ({banking.branch_code || '—'})</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                     <p className="text-[9px] font-medium text-slate-600 leading-relaxed italic">
                        {banking.payment_instructions || 'Please refer to the above banking details for payment.'}
                     </p>
                  </div>
               </div>
               
               <p className="text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-12 opacity-50">
                  Generated by Touch Teq Office
               </p>
            </div>
            
            <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
               Actual document formatting will adjust to fit.
            </p>
         </div>
      </div>
    </motion.div>
  );
}
