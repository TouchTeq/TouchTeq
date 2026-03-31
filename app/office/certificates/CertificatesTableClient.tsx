'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Edit2, Eye, FileDown, Send, ShieldCheck, Trash2, Printer, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useOfficeToast } from '@/components/office/OfficeToastContext';

type Props = {
  certificates: any[];
};

export default function CertificatesTableClient({ certificates }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useOfficeToast();
  const [working, setWorking] = useState<null | string>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-800 text-slate-400 border-slate-700/50';
      case 'Issued':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Superseded':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700/50';
    }
  };

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      commissioning: 'Commissioning',
      hac: 'HAC Certificate',
      sat: 'SAT Report',
      as_built: 'As-Built',
      installation: 'Installation',
      maintenance: 'Maintenance',
      sil: 'SIL Report',
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const deleteCertificate = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete certificate ${number}? This action cannot be undone.`)) return;
    
    setWorking(id);
    try {
      const { error } = await supabase.from('certificates').delete().eq('id', id);
      if (error) throw error;
      toast.success({ title: 'Deleted', message: `Certificate ${number} removed.` });
      router.refresh();
    } catch (e: any) {
      toast.error({ title: 'Delete Failed', message: e.message });
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-[#0B0F19]/50 border-b border-slate-800/50">
              <th className="px-6 py-4">Cert #</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Client & Project</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Signature</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {certificates.map((cert) => (
              <tr key={cert.id} className="group hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <Link
                      href={`/office/certificates/${cert.id}`}
                      className="font-black text-white text-sm uppercase tracking-tight hover:text-orange-400 transition-colors inline-block"
                    >
                      {cert.certificate_number}
                    </Link>
                    {cert.status === 'Issued' && (
                      <div className="mt-1 flex items-center gap-1 text-[8px] font-black text-green-500/70 uppercase tracking-widest">
                        <ShieldCheck size={10} /> Verified
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 text-slate-300 text-sm font-bold uppercase tracking-tight">
                  {getTypeName(cert.certificate_type)}
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-bold truncate max-w-[200px]">
                      {cert.clients?.company_name}
                    </span>
                    <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-0.5">
                      Ref: {cert.project_reference || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-slate-300 text-sm font-medium">
                      {format(new Date(cert.issue_date), 'dd MMM yyyy')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${getStatusColor(
                      cert.status
                    )}`}
                  >
                    {cert.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  {cert.require_client_sign_off ? (
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                        cert.client_signature_status === 'Signed'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}
                    >
                      {cert.client_signature_status === 'Signed' ? 'Signed' : 'Unsigned'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600 uppercase">N/A</span>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/office/certificates/${cert.id}`}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                      title="View PDF"
                    >
                      <Eye size={16} />
                    </Link>
                    {cert.status === 'Draft' ? (
                      <>
                        <Link
                          href={`/office/certificates/${cert.id}/edit`}
                          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                          title="Edit Certificate"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button
                          onClick={() => deleteCertificate(cert.id, cert.certificate_number)}
                          disabled={working === cert.id}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                          title="Print / Download"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                          title="Send via Email"
                        >
                          <Mail size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
