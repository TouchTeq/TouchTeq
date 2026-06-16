'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  Calculator,
  TrendingUp,
  PiggyBank,
  CalendarClock,
  AlertTriangle,
  Loader2,
  Save,
  Bell,
  Info,
} from 'lucide-react';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { saveTaxSettings, setIrp6Reminders } from '@/lib/tax/actions';

const formatRand = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })
    .format(amount || 0)
    .replace('ZAR', 'R');

export default function TaxClient({ data }: { data: any }) {
  const router = useRouter();
  const toast = useOfficeToast();
  const s = data.settings;

  const [entityType, setEntityType] = useState(s.entity_type);
  const [isProvisional, setIsProvisional] = useState<boolean>(s.is_provisional_taxpayer);
  const [ageBand, setAgeBand] = useState(s.age_band);
  const [override, setOverride] = useState<string>(s.set_aside_pct_override != null ? String(s.set_aside_pct_override) : '');
  const [saving, setSaving] = useState(false);
  const [reminding, setReminding] = useState(false);

  const estimate = data.estimate;
  const today = new Date();
  const nextDeadline = (data.schedule ?? []).find(
    (p: any) => p.period !== 'P3' && parseISO(p.dueDate) >= today
  ) ?? (data.schedule ?? []).find((p: any) => p.period === 'P2');
  const daysToDeadline = nextDeadline ? differenceInDays(parseISO(nextDeadline.dueDate), today) : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveTaxSettings({
        id: s.id,
        entity_type: entityType,
        is_provisional_taxpayer: isProvisional,
        age_band: ageBand,
        set_aside_pct_override: override.trim() === '' ? null : parseFloat(override),
      });
      if ('error' in res && res.error) {
        toast.error({ title: 'Save failed', message: res.error });
        return;
      }
      toast.success({ title: 'Saved', message: 'Tax settings updated.' });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleReminders = async () => {
    setReminding(true);
    try {
      const res = await setIrp6Reminders();
      if ('error' in res && res.error) {
        toast.error({ title: 'Could not set reminders', message: res.error });
        return;
      }
      toast.success({ title: 'Reminders set', message: `${(res as any).created} IRP6 deadline reminders created.` });
    } finally {
      setReminding(false);
    }
  };

  const selectClass =
    'w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Tax Centre</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Provisional tax planning · {data.taxYear} ({format(parseISO(data.periodStart), 'd MMM yyyy')} – {format(parseISO(data.periodEnd), 'd MMM yyyy')})
          </p>
        </div>
        <button
          onClick={handleReminders}
          disabled={reminding || data.noTable}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-all font-black text-xs uppercase tracking-widest text-white px-5 py-2.5 rounded-sm w-fit"
        >
          {reminding ? <Loader2 className="animate-spin" size={16} /> : <Bell size={16} />}
          Set IRP6 reminders
        </button>
      </div>

      {/* Verification / disclaimer banners */}
      {data.noTable ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-red-400 font-black text-sm uppercase">No tax table for {data.taxYear}</p>
            <p className="text-red-300/80 text-xs">Add the SARS rates for this year in lib/tax/sars-tables.ts to enable estimates.</p>
          </div>
        </div>
      ) : !estimate?.tableVerified ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-amber-400 font-black text-sm uppercase">{data.taxYear} rates unverified</p>
            <p className="text-amber-300/80 text-xs">
              These estimates use placeholder SARS figures. Confirm the {data.taxYear} tax tables before relying on the numbers.
            </p>
          </div>
        </div>
      ) : null}

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-cyan-500" />
            <span className="text-slate-500 text-[10px] font-black uppercase">Taxable income YTD</span>
          </div>
          <p className="text-2xl font-black text-white">{formatRand(data.taxableIncome)}</p>
          <p className="text-slate-500 text-xs mt-1">
            {formatRand(data.incomeReceived)} in − {formatRand(data.deductibleExpenses)} expenses
          </p>
        </div>

        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={16} className="text-orange-500" />
            <span className="text-slate-500 text-[10px] font-black uppercase">Estimated tax (year)</span>
          </div>
          <p className="text-2xl font-black text-orange-400">{formatRand(estimate?.estimatedTax ?? 0)}</p>
          <p className="text-slate-500 text-xs mt-1">
            {estimate ? `${(estimate.effectiveRate * 100).toFixed(1)}% effective` : '—'}
            {estimate?.belowThreshold ? ' · below threshold' : ''}
          </p>
        </div>

        <div className="bg-[#151B28] border border-green-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank size={16} className="text-green-500" />
            <span className="text-slate-500 text-[10px] font-black uppercase">Set aside per R received</span>
          </div>
          <p className="text-2xl font-black text-green-400">{data.setAsidePerRandReceived}%</p>
          <p className="text-slate-500 text-xs mt-1">Reserve ≈ {formatRand(data.recommendedReserve)} so far</p>
        </div>

        <div className={`bg-[#151B28] border rounded-xl p-5 ${daysToDeadline != null && daysToDeadline <= 30 ? 'border-red-500/40' : 'border-slate-800/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock size={16} className={daysToDeadline != null && daysToDeadline <= 30 ? 'text-red-500' : 'text-cyan-500'} />
            <span className="text-slate-500 text-[10px] font-black uppercase">Next IRP6 deadline</span>
          </div>
          <p className="text-2xl font-black text-white">
            {nextDeadline ? format(parseISO(nextDeadline.dueDate), 'd MMM yyyy') : '—'}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {daysToDeadline != null ? `${daysToDeadline} days · ${nextDeadline.period}` : '—'}
          </p>
        </div>
      </div>

      {/* Provisional schedule */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-white font-black uppercase text-sm">Provisional tax schedule (IRP6)</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
              <th className="text-left p-4 font-black">Period</th>
              <th className="text-left p-4 font-black">Due date</th>
              <th className="text-right p-4 font-black">Estimated payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {(data.schedule ?? []).map((p: any) => {
              const overdue = parseISO(p.dueDate) < today;
              return (
                <tr key={p.period} className="hover:bg-slate-800/20">
                  <td className="p-4 text-white font-bold">{p.label}</td>
                  <td className="p-4 text-slate-400">
                    {format(parseISO(p.dueDate), 'd MMMM yyyy')}
                    {overdue && p.period !== 'P3' && (
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-black uppercase">Past</span>
                    )}
                  </td>
                  <td className="p-4 text-right text-white font-black">
                    {p.period === 'P3' ? '—' : formatRand(p.amountDue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Settings */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6 space-y-5">
        <h2 className="text-white font-black uppercase text-sm">Tax profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Entity type</label>
            <select className={selectClass} value={entityType} onChange={(e) => setEntityType(e.target.value)}>
              <option value="sole_proprietor">Sole proprietor</option>
              <option value="company">Company</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Age band</label>
            <select className={selectClass} value={ageBand} onChange={(e) => setAgeBand(e.target.value)}>
              <option value="under_65">Under 65</option>
              <option value="65_to_74">65 – 74</option>
              <option value="75_plus">75 +</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase mb-1">Set-aside % override</label>
            <input
              type="number"
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              placeholder="Auto (effective rate)"
              className={selectClass}
            />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={isProvisional} onChange={(e) => setIsProvisional(e.target.checked)} className="accent-orange-500 w-4 h-4" />
          <span className="text-slate-300 text-sm">Registered provisional taxpayer</span>
        </label>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-all font-black text-xs uppercase tracking-widest text-white px-5 py-2.5 rounded-sm"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save profile
        </button>
      </div>

      <p className="text-slate-600 text-xs flex items-start gap-2">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        Estimates only — a planning aid, not tax advice or a SARS submission. Income is counted when paid (cash basis,
        suited to irregular income); expense deductibility should be confirmed with your accountant. File and pay via SARS eFiling.
      </p>
    </div>
  );
}
