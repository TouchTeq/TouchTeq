'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  taxYearForDate,
  taxYearBounds,
  estimateAnnualTax,
  provisionalSchedule,
  recommendedSetAside,
  type AgeBand,
} from '@/lib/tax/engine';
import { createReminder } from '@/lib/reminders/actions';

export async function getTaxSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('tax_settings').select('*').limit(1).maybeSingle();
  if (error) return { error: error.message };

  if (data) return { data };

  // Create a sensible default row on first use
  const { data: created, error: createErr } = await supabase
    .from('tax_settings')
    .insert({ entity_type: 'sole_proprietor', is_provisional_taxpayer: true, age_band: 'under_65' })
    .select('*')
    .single();
  if (createErr) return { error: createErr.message };
  return { data: created };
}

export async function saveTaxSettings(input: {
  id: string;
  entity_type: string;
  is_provisional_taxpayer: boolean;
  age_band: AgeBand;
  set_aside_pct_override: number | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tax_settings')
    .update({
      entity_type: input.entity_type,
      is_provisional_taxpayer: input.is_provisional_taxpayer,
      age_band: input.age_band,
      set_aside_pct_override: input.set_aside_pct_override,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id);
  if (error) return { error: error.message };
  revalidatePath('/office/tax');
  return { success: true };
}

export async function getTaxDashboard() {
  const supabase = await createClient();

  const settingsRes = await getTaxSettings();
  if ('error' in settingsRes) return { error: settingsRes.error };
  const settings = settingsRes.data;

  const today = new Date();
  const taxYear = taxYearForDate(today);
  const { start, end } = taxYearBounds(taxYear);

  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from('payments').select('amount, payment_date').gte('payment_date', start).lte('payment_date', end),
    supabase
      .from('expenses')
      .select('amount_inclusive, input_vat_amount, vat_claimable, expense_date')
      .gte('expense_date', start)
      .lte('expense_date', end),
  ]);

  const incomeReceived = (payments ?? []).reduce((s, p: any) => s + (p.amount || 0), 0);
  const deductibleExpenses = (expenses ?? []).reduce((s, e: any) => {
    const ded = e.vat_claimable ? (e.amount_inclusive || 0) - (e.input_vat_amount || 0) : e.amount_inclusive || 0;
    return s + ded;
  }, 0);

  const taxableIncome = incomeReceived - deductibleExpenses;
  const ageBand = (settings.age_band as AgeBand) ?? 'under_65';
  const estimate = estimateAnnualTax(taxableIncome, taxYear, ageBand);

  // No table for this year — surface that rather than guessing
  if (!estimate) {
    return {
      data: {
        settings,
        taxYear,
        periodStart: start,
        periodEnd: end,
        incomeReceived,
        deductibleExpenses,
        taxableIncome,
        estimate: null,
        schedule: [],
        recommendedReserve: 0,
        setAsidePerRandReceived: 0,
        noTable: true,
      },
    };
  }

  const schedule = provisionalSchedule(taxYear, estimate.estimatedTax);
  const perPaymentRate =
    settings.set_aside_pct_override != null ? settings.set_aside_pct_override / 100 : estimate.effectiveRate;
  const recommendedReserve = recommendedSetAside(incomeReceived, estimate.effectiveRate, settings.set_aside_pct_override);

  return {
    data: {
      settings,
      taxYear,
      periodStart: start,
      periodEnd: end,
      incomeReceived,
      deductibleExpenses,
      taxableIncome,
      estimate,
      schedule,
      recommendedReserve,
      setAsidePerRandReceived: Math.round(perPaymentRate * 10000) / 100, // as %
      noTable: false,
    },
  };
}

/**
 * Create reminders for the provisional-tax (IRP6) deadlines of the current
 * tax year. Reuses the existing reminders module.
 */
export async function setIrp6Reminders() {
  const dash = await getTaxDashboard();
  if ('error' in dash) return { error: dash.error };
  const { schedule, taxYear } = dash.data;
  if (!schedule || schedule.length === 0) return { error: 'No schedule available.' };

  let created = 0;
  for (const p of schedule) {
    if (p.period === 'P3') continue; // voluntary top-up — skip auto-reminder
    const fd = new FormData();
    fd.set('title', `${p.label} due — ${taxYear}`);
    fd.set('reminder_at', `${p.dueDate}T09:00:00`);
    fd.set('reminder_type', 'custom');
    fd.set('description', `Provisional tax ${p.period} estimated payment: R${p.amountDue.toLocaleString('en-ZA')}. Confirm figures on SARS eFiling.`);
    const res = await createReminder(fd);
    if (!('error' in res)) created += 1;
  }

  revalidatePath('/office/reminders');
  return { success: true, created };
}
