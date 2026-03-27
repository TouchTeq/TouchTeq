'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  AlertCircle,
  Search,
  X,
  Hash,
  FileText,
  ChevronDown,
  CheckCircle2,
  MapPin,
  ClipboardList,
  Wrench,
  Zap,
  HardHat,
  Stethoscope
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { DatePicker } from '@/components/ui/DatePicker';
import { useActiveDocument } from '@/components/office/ActiveDocumentContext';

const CERTIFICATE_TYPES = [
  { id: 'commissioning', label: 'Commissioning Certificate', icon: CheckCircle2, code: 'COM' },
  { id: 'hac', label: 'Hazardous Area Classification', icon: Zap, code: 'HAC' },
  { id: 'sat', label: 'Site Acceptance Test (SAT)', icon: ClipboardList, code: 'SAT' },
  { id: 'as_built', label: 'As-Built Certificate', icon: FileText, code: 'ASB' },
  { id: 'installation', label: 'Equipment Installation', icon: Wrench, code: 'INS' },
  { id: 'maintenance', label: 'Maintenance & Inspection', icon: HardHat, code: 'MNT' },
  { id: 'sil', label: 'SIL Verification Report', icon: Stethoscope, code: 'SIL' },
];

export default function NewCertificatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading certificate builder...</div>}>
      <NewCertificateContent />
    </Suspense>
  );
}

function NewCertificateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supersedeId = searchParams.get('supersedeId');
  const supabase = createClient();
  const toast = useOfficeToast();
  const { registerDocumentSession, clearDocumentSession, updateField } = useActiveDocument();

  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [certType, setCertType] = useState<string>('');
  const [certNumber, setCertNumber] = useState('CERT-....');
  
  const [formData, setFormData] = useState({
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    project_reference: '',
    site_name: '',
    site_address: '',
    inspection_date: format(new Date(), 'yyyy-MM-dd'),
    engineer_name: 'Thabo Matona',
    engineer_registration: '',
    standards_referenced: '',
    pass_fail_status: true,
    notes: '',
    next_inspection_date: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
    document_data: {} as Record<string, any>
  });

  // Load clients
  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('company_name');
      setClients(data || []);
      setFetchingClients(false);
    }
    fetchClients();
  }, [supabase]);

  // Load parent certificate if superseding
  useEffect(() => {
    if (!supersedeId) return;

    async function fetchParent() {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', supersedeId)
        .single();
      
      if (!error && data) {
        setCertType(data.certificate_type);
        setFormData(prev => ({
          ...prev,
          project_reference: data.project_reference || '',
          site_name: data.site_name || '',
          site_address: data.site_address || '',
          engineer_name: data.engineer_name || 'Thabo Matona',
          engineer_registration: data.engineer_registration || '',
          standards_referenced: data.standards_referenced || '',
          document_data: data.document_data || {}
        }));
        
        // Match client
        if (data.client_id) {
          const clientData = clients.find(c => c.id === data.client_id);
          if (clientData) {
            setSelectedClient(clientData);
          } else {
            // If clients list isn't loaded yet, we'll wait or fetch specifically
            setFetchingClients(true);
            const { data: cData } = await supabase.from('clients').select('*').eq('id', data.client_id).single();
            if (cData) setSelectedClient(cData);
            setFetchingClients(false);
          }
        }
        
        toast.info({ title: 'Superseding', message: `Replacing Certificate ${data.certificate_number}. Form pre-filled.` });
      }
    }
    fetchParent();
  }, [supersedeId, clients, supabase, toast]);

  // Generate certificate number when type changes
  useEffect(() => {
    if (!certType) {
      setCertNumber('CERT-....');
      return;
    }
    
    async function fetchNextNumber() {
      const { data, error } = await supabase.rpc('get_next_certificate_number', { cert_type: certType });
      if (!error && data) {
        setCertNumber(data);
      }
    }
    fetchNextNumber();
  }, [certType, supabase]);

  // Sync with AI Assistant context
  useEffect(() => {
    if (certType) {
      registerDocumentSession({
        documentType: 'certificate' as any,
        documentId: 'new',
        documentData: {
          ...formData,
          certificate_type: certType,
          certificate_number: certNumber,
          client_id: selectedClient?.id
        },
        isOpen: true
      });
    }
    return () => clearDocumentSession();
  }, [certType, certNumber, formData, selectedClient, registerDocumentSession, clearDocumentSession]);

  const handleCreate = async () => {
    if (!certType) {
      toast.error({ title: 'Type Required', message: 'Please select a certificate type.' });
      return;
    }
    if (!selectedClient) {
      toast.error({ title: 'Client Required', message: 'Please select a client.' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificates')
        .insert({
          certificate_number: certNumber,
          certificate_type: certType,
          client_id: selectedClient.id,
          project_reference: formData.project_reference,
          site_name: formData.site_name,
          site_address: formData.site_address,
          inspection_date: formData.inspection_date,
          issue_date: formData.issue_date,
          status: 'Draft',
          engineer_name: formData.engineer_name,
          engineer_registration: formData.engineer_registration,
          standards_referenced: formData.standards_referenced,
          pass_fail_status: formData.pass_fail_status,
          notes: formData.notes,
          next_inspection_date: formData.next_inspection_date,
          document_data: formData.document_data,
          supersedes_certificate_id: supersedeId || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success({ title: 'Certificate Created', message: `${certNumber} has been saved as a draft.` });
      router.push(`/office/certificates/${data.id}`);
    } catch (e: any) {
      toast.error({ title: 'Creation Failed', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(c => 
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/office/certificates"
            className="p-3 bg-[#151B28] border border-slate-800/50 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">New Certificate</h1>
            <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Shield size={12} /> {certNumber}
            </p>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-all font-black text-xs uppercase tracking-widest text-white px-8 py-4 rounded-sm shadow-xl shadow-orange-500/20"
        >
          {loading ? 'Creating...' : (<><Save size={16} /> Save Draft</>)}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Certificate Type Selection */}
          {!certType ? (
            <div className="bg-[#151B28] border border-slate-800/50 rounded-2xl p-8">
              <h2 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <ChevronDown size={16} className="text-orange-500" /> Select Certificate Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CERTIFICATE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setCertType(type.id)}
                    className="p-6 bg-[#0B0F19] border border-slate-800 rounded-xl hover:border-orange-500/50 hover:bg-slate-800/40 transition-all text-left flex items-start gap-4 group"
                  >
                    <div className="p-3 bg-slate-800 rounded-lg text-slate-400 group-hover:text-orange-500 transition-colors shadow-inner">
                      <type.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm mb-1">{type.label}</h3>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{type.code} Standard</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Common Details Card */}
              <div className="bg-[#151B28] border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-[#0B0F19]/30">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                        {(() => {
                          const Icon = CERTIFICATE_TYPES.find(t => t.id === certType)?.icon || Shield;
                          return <Icon size={18} />;
                        })()}
                      </div>
                      <h2 className="text-white font-black uppercase tracking-widest text-xs">
                        {CERTIFICATE_TYPES.find(t => t.id === certType)?.label} Details
                      </h2>
                   </div>
                   <button 
                    onClick={() => setCertType('')}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-500 transition-colors"
                   >
                     Change Type
                   </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Site Info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Project Reference</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        <input
                          type="text"
                          placeholder="e.g. PJ-2025-042"
                          value={formData.project_reference}
                          onChange={(e) => setFormData({...formData, project_reference: e.target.value})}
                          className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 text-sm focus:border-orange-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Site / Facility Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        <input
                          type="text"
                          placeholder="Facility or Site Name"
                          value={formData.site_name}
                          onChange={(e) => setFormData({...formData, site_name: e.target.value})}
                          className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 text-sm focus:border-orange-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Site Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-600" size={14} />
                        <textarea
                          placeholder="Physical Address of the site"
                          rows={3}
                          value={formData.site_address}
                          onChange={(e) => setFormData({...formData, site_address: e.target.value})}
                          className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 text-sm focus:border-orange-500 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dates & Results */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <DatePicker 
                        label="Inspection Date"
                        value={formData.inspection_date}
                        onChange={(val) => setFormData({...formData, inspection_date: val})}
                      />
                      <DatePicker 
                        label="Issue Date"
                        value={formData.issue_date}
                        onChange={(val) => setFormData({...formData, issue_date: val})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Standards / References</label>
                      <textarea
                        placeholder="e.g. IEC 61511, SANS 10108"
                        rows={2}
                        value={formData.standards_referenced}
                        onChange={(e) => setFormData({...formData, standards_referenced: e.target.value})}
                        className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-slate-200 text-sm focus:border-orange-500 outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="bg-[#0B0F19] p-4 rounded-xl border border-slate-800">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Certificate Outcome</label>
                       <div className="flex items-center gap-6">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, pass_fail_status: true})}
                            className={`flex-1 py-3 rounded-lg border transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
                              formData.pass_fail_status 
                                ? 'bg-green-50 border-green-600 text-white shadow-lg shadow-green-500/20' 
                                : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                             <CheckCircle2 size={14} /> Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, pass_fail_status: false})}
                            className={`flex-1 py-3 rounded-lg border transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
                              !formData.pass_fail_status 
                                ? 'bg-red-50 border-red-600 text-white shadow-lg shadow-red-500/20' 
                                : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                             <X size={14} /> Fail
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks Card */}
              <div className="bg-[#151B28] border border-slate-800/50 rounded-2xl p-8">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Additional Remarks / Notes</label>
                <textarea
                  placeholder="Any technical findings or recommendations..."
                  rows={5}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-4 text-slate-200 text-sm focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          {/* Client Selection */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-2xl overflow-hidden">
             <div className="p-5 bg-[#0B0F19]/30 border-b border-slate-800/50">
                <h3 className="text-white text-[10px] font-black uppercase tracking-widest">Recipient Client</h3>
             </div>
             <div className="p-6">
               {selectedClient ? (
                 <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                        <Building2 size={18} />
                      </div>
                      <button 
                        onClick={() => setSelectedClient(null)}
                        className="text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-white font-bold text-sm truncate">{selectedClient.company_name}</p>
                    <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-1 font-medium">
                      <User size={10} /> {selectedClient.contact_person}
                    </p>
                 </div>
               ) : (
                 <button
                  onClick={() => setIsClientModalOpen(true)}
                  className="w-full py-8 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:text-orange-500 hover:border-orange-500/50 transition-all flex flex-col items-center gap-3 bg-[#0B0F19]/50"
                 >
                   <Plus size={24} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Select Client</span>
                 </button>
               )}
             </div>
          </div>

          {/* Engineer Details */}
          <div className="bg-[#151B28] border border-slate-800/50 rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Lead Engineer</label>
              <input
                type="text"
                value={formData.engineer_name}
                onChange={(e) => setFormData({...formData, engineer_name: e.target.value})}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-slate-200 text-sm focus:border-orange-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Registration # (ECSA/Other)</label>
              <input
                type="text"
                placeholder="e.g. 202512345"
                value={formData.engineer_registration}
                onChange={(e) => setFormData({...formData, engineer_registration: e.target.value})}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-3 text-slate-200 text-sm focus:border-orange-500 outline-none transition-all"
              />
            </div>
            <DatePicker 
              label="Next Inspection"
              value={formData.next_inspection_date}
              onChange={(val) => setFormData({...formData, next_inspection_date: val})}
            />
            <p className="text-[9px] text-slate-600 mt-2 italic font-bold">Required for recurring compliance tracking</p>
          </div>
        </div>
      </div>

      {/* Client Modal */}
      <AnimatePresence>
        {isClientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClientModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-[#151B28] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2">
                {fetchingClients ? (
                  <div className="p-8 text-center text-slate-500">Loading clients...</div>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setIsClientModalOpen(false);
                      }}
                      className="w-full p-4 flex items-center gap-4 hover:bg-slate-800/40 rounded-xl transition-all text-left group"
                    >
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-white font-bold">{client.company_name}</p>
                        <p className="text-slate-500 text-xs">{client.contact_person}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">No clients found.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
