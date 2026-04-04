'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Building2,
  MapPin,
  FileText,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Tag,
  Wallet,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import ClientContactsEditor, { createDefaultContacts, type ClientContactDraft } from '@/components/office/ClientContactsEditor';

export default function NewClientPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sameAsPhysical, setSameAsPhysical] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
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
  });

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
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.company_name) {
      setError("Please fill in the required field (Company Name).");
      setLoading(false);
      return;
    }

    if (!contacts.length || contacts.some((c) => !c.full_name.trim())) {
      setError("Please complete all contact cards (Contact Type and Full Name are required).");
      setLoading(false);
      return;
    }

    try {
      const primary = contacts.find((c) => c.is_primary) || contacts.find((c) => c.contact_type === 'Technical') || contacts[0];
      const legacyEmail = primary?.email?.trim() || contacts.find((c) => c.email.trim())?.email?.trim() || null;
      const legacyPhone = primary?.cell_number?.trim() || primary?.landline_number?.trim() || '';

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([{
          ...formData,
          contact_person: primary?.full_name || '',
          job_title: primary?.job_title || '',
          email: legacyEmail,
          phone: legacyPhone,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: contactsError } = await supabase
        .from('client_contacts')
        .insert(
          contacts.map((c) => ({
            client_id: data.id,
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

      router.push(`/office/clients/${data.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while saving the client.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {categoryOpen && (
        <div className="fixed inset-0 z-[99]" onClick={() => setCategoryOpen(false)} onWheel={(e) => e.stopPropagation()} />
      )}
      {/* Breadcrumbs / Back Link */}
      <Link
        href="/office/clients"
        className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
      >
        <ArrowLeft size={14} /> Back to Clients
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Add New Client</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl p-8">
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
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white transition-all"
                placeholder="Touch Teqniques (Pty) Ltd"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">VAT Registration Number</label>
              <input
                type="text"
                name="vat_number"
                value={formData.vat_number}
                onChange={handleInputChange}
                className="w-full bg-[#0B0F19] border border-slate-700 hover:border-slate-600 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 transition-all"
                placeholder="4000123456"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5">
                <Tag size={11} /> Category
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#151B28] ${
                    categoryOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-slate-500" />
                    <span className="text-white">{formData.category || 'No Category'}</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-500 transition-transform ${categoryOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {categoryOpen && (
                  <div 
                    className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] p-1 max-h-60 overflow-y-auto"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {[
                      { value: '', label: 'No Category' },
                      { value: 'Service Support', label: 'Service Support' },
                      { value: 'Projects', label: 'Projects' },
                      { value: 'Back up Power Supply', label: 'Back up Power Supply' },
                      { value: 'Software Support', label: 'Software Support' },
                      { value: 'Supplier', label: 'Supplier' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, category: opt.value }));
                          setCategoryOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-bold text-sm ${
                          formData.category === opt.value
                            ? 'text-orange-500 bg-[#0B0F19]'
                            : 'text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white transition-all"
              />
              <p className="text-[10px] text-slate-600 ml-1">Supports negative values. Leave at 0 if not applicable.</p>
            </div>
          </div>
        </div>

        <ClientContactsEditor value={contacts} onChange={setContacts} />

        {/* Addresses */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl p-8">
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
                placeholder="123 Industrial Way, Secunda, 2302"
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
                className={`w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white transition-all resize-none ${sameAsPhysical ? 'opacity-50' : ''}`}
                placeholder="PO Box 456, Secunda, 2302"
              />
            </div>
          </div>
        </div>

        {/* Additional */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl p-8">
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
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white transition-all resize-none"
                placeholder="Key B2B partner, long-term contractor..."
              />
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#0B0F19] rounded-lg border border-slate-800/50 w-fit">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Status:</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                className="flex items-center gap-2 group"
              >
                {formData.is_active ? (
                  <>
                    <ToggleRight size={24} className="text-green-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-green-500">Active</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft size={24} className="text-slate-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">Inactive</span>
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
            href="/office/clients"
            className="px-8 py-4 text-slate-500 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 transition-all rounded-lg overflow-hidden shadow-xl shadow-orange-500/20 py-3 px-6 disabled:opacity-50"
          >
            <Save size={18} className="text-white" />
            <span className="text-white font-black text-sm uppercase tracking-[0.2em]">
              {loading ? 'Saving Client...' : 'Save Client Record'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
