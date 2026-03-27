'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  User, 
  MapPin, 
  FileText, 
  Check, 
  AlertCircle,
  UserMinus,
  Tag,
  Wallet,
  MailX,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import ClientContactsEditor, { createDefaultContacts, type ClientContactDraft } from '@/components/office/ClientContactsEditor';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sameAsPhysical, setSameAsPhysical] = useState(false);
  const [contacts, setContacts] = useState<ClientContactDraft[]>(createDefaultContacts());

  const [formData, setFormData] = useState({
    company_name: '',
    physical_address: '',
    postal_address: '',
    vat_number: '',
    notes: '',
    is_active: true,
    category: '' as string,
    opening_balance: 0 as number,
    email_missing: false,
  });

  useEffect(() => {
    async function fetchClient() {
      try {
        const [{ data, error }, { data: contactsData, error: contactsError }] = await Promise.all([
          supabase.from('clients').select('*').eq('id', id).single(),
          supabase.from('client_contacts').select('*').eq('client_id', id).order('created_at', { ascending: true }),
        ]);

        if (error) throw error;
        if (data) {
          setFormData({
            company_name: data.company_name,
            physical_address: data.physical_address || '',
            postal_address: data.postal_address || '',
            vat_number: data.vat_number || '',
            notes: data.notes || '',
            is_active: data.is_active ?? true,
            category: data.category || '',
            opening_balance: data.opening_balance ?? 0,
            email_missing: data.email_missing ?? false,
          });
          
          if (data.physical_address && data.physical_address === data.postal_address) {
            setSameAsPhysical(true);
          }
        }

        if (!contactsError && contactsData && contactsData.length > 0) {
          setContacts(
            contactsData.map((c: any) => ({
              localId: String(c.id),
              contact_type: c.contact_type,
              full_name: c.full_name || '',
              job_title: c.job_title || '',
              email: c.email || '',
              cell_number: c.cell_number || '',
              landline_number: c.landline_number || '',
              extension: c.extension || '',
              notes: c.notes || '',
              is_primary: !!c.is_primary,
            }))
          );
        } else if (!contactsError) {
          setContacts(createDefaultContacts());
        }
      } catch (err: any) {
        setError("Failed to load client data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [id, supabase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'physical_address' && sameAsPhysical) {
        newData.postal_address = value;
      }
      return newData;
    });
  };

  const toggleSameAsPhysical = () => {
    const newState = !sameAsPhysical;
    setSameAsPhysical(newState);
    if (newState) {
      setFormData(prev => ({ ...prev, postal_address: prev.physical_address }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!formData.company_name) {
        setError('Please fill in the required field (Company Name).');
        setSaving(false);
        return;
      }
      if (!contacts.length || contacts.some((c) => !c.full_name.trim())) {
        setError('Please complete all contact cards (Contact Type and Full Name are required).');
        setSaving(false);
        return;
      }

      const primary = contacts.find((c) => c.is_primary) || contacts.find((c) => c.contact_type === 'Technical') || contacts[0];
      const legacyEmail = primary?.email?.trim() || contacts.find((c) => c.email.trim())?.email?.trim() || null;
      const legacyPhone = primary?.cell_number?.trim() || primary?.landline_number?.trim() || '';

      const { error: updateError } = await supabase
        .from('clients')
        .update({
          ...formData,
          contact_person: primary?.full_name || '',
          job_title: primary?.job_title || '',
          email: legacyEmail,
          phone: legacyPhone,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await supabase.from('client_contacts').delete().eq('client_id', id);
      const { error: contactsError } = await supabase.from('client_contacts').insert(
        contacts.map((c) => ({
          client_id: id,
          contact_type: c.contact_type,
          full_name: c.full_name,
          job_title: c.job_title || null,
          email: c.email || null,
          cell_number: c.cell_number || null,
          landline_number: c.landline_number || null,
          extension: c.landline_number ? (c.extension || null) : null,
          is_primary: !!c.is_primary,
          notes: c.notes || null,
        }))
      );
      if (contactsError) throw contactsError;

      router.push(`/office/clients/${id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while updating the client.");
      setSaving(false);
    }
  };

  const setStatus = async (active: boolean) => {
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ is_active: active })
        .eq('id', id);

      if (updateError) throw updateError;
      setFormData(prev => ({ ...prev, is_active: active }));
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-black uppercase tracking-widest text-slate-500">Loading Client Record...</div>;

  return (
    <div className="w-full space-y-8">
      {/* Breadcrumbs / Back Link */}
      <Link 
        href={`/office/clients/${id}`}
        className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
      >
        <ArrowLeft size={14} /> Back to Detail View
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Edit Client <span className="text-orange-500">/</span> {formData.company_name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-800/50 pb-4">
            <Building2 className="text-orange-500" size={20} />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Company Name *</label>
              <input 
                name="company_name"
                required
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">VAT Registration Number</label>
              <input 
                name="vat_number"
                value={formData.vat_number}
                onChange={handleInputChange}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5">
                <Tag size={11} /> Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm"
              >
                <option value="">— No Category —</option>
                <option value="Service Support">Service Support</option>
                <option value="Projects">Projects</option>
                <option value="Back up Power Supply">Back up Power Supply</option>
                <option value="Software Support">Software Support</option>
              </select>
            </div>

            {/* Opening Balance */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5">
                <Wallet size={11} /> Opening Balance (Sage Import)
              </label>
              <input
                type="number"
                step="0.01"
                name="opening_balance"
                value={formData.opening_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, opening_balance: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm"
              />
              <p className="text-[10px] text-slate-600 ml-1">Supports negative values. This is the balance imported from Sage.</p>
            </div>
          </div>

          {/* Email Missing Flag */}
          {formData.email_missing && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <MailX size={16} className="text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Email Missing</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">This client was imported without an email address.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, email_missing: false }))}
                className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors px-3 py-1.5 border border-slate-700 rounded"
              >
                Mark Resolved
              </button>
            </div>
          )}
        </div>

        <ClientContactsEditor value={contacts} onChange={setContacts} />

        {/* Addresses */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-800/50 pb-4">
            <MapPin className="text-orange-500" size={20} />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">Location Details</h2>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Physical Address</label>
              <textarea 
                name="physical_address"
                rows={3}
                value={formData.physical_address}
                onChange={handleInputChange}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm resize-none"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Postal Address</label>
                <button 
                  type="button"
                  onClick={toggleSameAsPhysical}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-white transition-colors"
                >
                  <div className={`w-4 h-4 border flex items-center justify-center transition-all ${sameAsPhysical ? 'bg-orange-500 border-orange-500' : 'border-slate-800'}`}>
                    {sameAsPhysical && <Check size={10} className="text-white" />}
                  </div>
                  Same as Physical
                </button>
              </div>
              <textarea 
                name="postal_address"
                rows={3}
                disabled={sameAsPhysical}
                value={formData.postal_address}
                onChange={handleInputChange}
                className={`w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm resize-none ${sameAsPhysical ? 'opacity-50' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Additional */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-800/50 pb-4">
            <FileText className="text-orange-500" size={20} />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">Notes & Status</h2>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Internal Notes</label>
              <textarea 
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm resize-none"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-black/20 rounded-lg border border-slate-800/50">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Client Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <p className={`text-sm font-black uppercase tracking-widest ${formData.is_active ? 'text-green-500' : 'text-slate-500'}`}>
                    {formData.is_active ? 'Account Active' : 'Account Inactive'}
                  </p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => setStatus(!formData.is_active)}
                className={`flex items-center gap-3 px-6 py-2 rounded font-black text-[10px] uppercase tracking-[0.2em] border transition-all ${
                  formData.is_active 
                    ? 'border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5' 
                    : 'border-green-500/50 text-green-500 hover:bg-green-500/10'
                }`}
              >
                {formData.is_active ? (
                  <>
                    <UserMinus size={16} /> Deactivate Client
                  </>
                ) : (
                  <>
                    <User size={16} /> Reactivate Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-3 font-bold text-sm"
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 pb-20">
          <Link 
            href={`/office/clients/${id}`}
            className="px-8 py-4 text-slate-500 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 transition-all rounded-sm overflow-hidden shadow-xl shadow-orange-500/20 py-4 px-10 disabled:opacity-50"
          >
            <Save size={18} className="text-white" />
            <span className="text-white font-black text-sm uppercase tracking-[0.2em]">
              {saving ? 'Updating...' : 'Update Client Record'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
