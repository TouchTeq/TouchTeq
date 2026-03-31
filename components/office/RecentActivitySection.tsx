'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const formatRand = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R');
};

function getActivityHref(act: { type: string; id: string }) {
  switch (act.type) {
    case 'Invoice':
      return `/office/invoices/${act.id}`;
    case 'Quote':
      return `/office/quotes/${act.id}`;
    case 'Expense':
      return `/office/expenses/${act.id}`;
    case 'Certificate':
      return `/office/certificates/${act.id}`;
    case 'Purchase Order':
      return `/office/purchase-orders`;
    case 'Credit Note':
      return `/office/invoices/${act.id}`;
    case 'Payment':
      return `/office/invoices`;
    default:
      return '/office/dashboard';
  }
}

function getTypePillClasses(type: string) {
  switch (type) {
    case 'Quote': return 'bg-blue-500/10 text-blue-500';
    case 'Invoice': return 'bg-orange-500/10 text-orange-500';
    case 'Payment': return 'bg-green-500/10 text-green-500';
    case 'Expense': return 'bg-red-500/10 text-red-500';
    case 'Certificate': return 'bg-purple-500/10 text-purple-500';
    case 'Purchase Order': return 'bg-cyan-500/10 text-cyan-500';
    case 'Credit Note': return 'bg-amber-500/10 text-amber-500';
    default: return 'bg-slate-500/10 text-slate-500';
  }
}

function getStatusClasses(status: string) {
  if (status === 'Draft') return 'text-slate-500';
  if (['Sent', 'Partially Paid'].includes(status)) return 'text-amber-500';
  if (['Accepted', 'Paid', 'Success', 'Completed', 'Issued'].includes(status)) return 'text-green-500';
  return 'text-red-500';
}

export default function RecentActivitySection({ activities }: { activities: any[] }) {
  const router = useRouter();

  return (
    <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock size={20} className="text-orange-500" />
          <h2 className="text-lg font-black uppercase tracking-tight text-white">Recent Activity</h2>
        </div>
        <Link href="/office/activity" className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-orange-500 transition-colors flex items-center gap-2">
          View All Activity <ExternalLink size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-[#0B0F19]/50">
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {activities.length > 0 ? (
              activities.map((act, i) => {
                const href = getActivityHref(act);
                return (
                  <tr
                    key={i}
                    onClick={() => router.push(href)}
                    className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${getTypePillClasses(act.type)}`}>
                        {act.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-white text-sm">{act.ref}</td>
                    <td className="px-6 py-5 text-slate-400 text-sm font-medium">{act.client || 'Internal'}</td>
                    <td className="px-6 py-5 font-black text-white text-sm">{formatRand(act.amount)}</td>
                    <td className="px-6 py-5">
                      <span className={`text-xs font-bold ${getStatusClasses(act.status)}`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-slate-500 text-xs font-medium">
                      {format(new Date(act.date), 'dd MMM, HH:mm')}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                  No recent activity found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
