import { createClient } from '@/lib/supabase/server';
import { 
  Shield, 
  Plus, 
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import CertificatesControls from './CertificatesControls';
import CertificatesTableClient from './CertificatesTableClient';

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const type = typeof params.type === 'string' ? params.type : 'all';
  const status = typeof params.status === 'string' ? params.status : 'all';

  // 1. Build Query
  let query = supabase
    .from('certificates')
    .select(`
      *,
      clients(company_name, contact_person)
    `);

  if (q) {
    query = query.or(`certificate_number.ilike.%${q}%,project_reference.ilike.%${q}%,clients.company_name.ilike.%${q}%`);
  }

  if (type !== 'all') {
    query = query.eq('certificate_type', type);
  }

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: certificates } = await query.order('created_at', { ascending: false });

  // 2. Stats Summary
  const { data: statsData } = await supabase
    .from('certificates')
    .select('status, certificate_type');

  const totalIssued = statsData?.filter(c => c.status === 'Issued').length || 0;
  const draftsCount = statsData?.filter(c => c.status === 'Draft').length || 0;
  const totalCount = statsData?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Compliance Manager</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Certifying engineering excellence & safety compliance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            href="/office/certificates/new"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm shadow-xl shadow-orange-500/20 w-fit"
          >
            <Plus size={16} />
            New Certificate
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-orange-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
            Total Certificates <Shield size={12} className="text-slate-700" />
          </p>
          <h3 className="text-2xl font-black text-white">{totalCount}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-green-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
            Issued & Verified <CheckCircle2 size={12} className="text-green-900" />
          </p>
          <h3 className="text-2xl font-black text-green-500">{totalIssued}</h3>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 p-6 rounded-xl group hover:border-amber-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
            Draft Documents <Clock size={12} className="text-amber-900" />
          </p>
          <h3 className="text-2xl font-black text-amber-500">{draftsCount}</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <CertificatesControls initialQ={q} initialType={type} initialStatus={status} />

      {/* Certificates Table */}
      {certificates && certificates.length > 0 ? (
        <CertificatesTableClient certificates={certificates} />
      ) : (
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-24 text-center">
            <div className="max-w-xs mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 border border-slate-800/50">
                <Shield size={32} className="text-slate-700" />
              </div>
              <h3 className="text-white font-black uppercase tracking-tight mb-2">No Certificates Found</h3>
              <p className="text-slate-500 text-xs font-medium mb-8">
                {q
                  ? `No certificates match your search "${q}".`
                  : "You haven't generated any compliance certificates yet. Ensure all project handover documents are issued correctly."}
              </p>
              <Link
                href="/office/certificates/new"
                className="text-orange-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all"
              >
                Generate First Certificate <Plus size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
