'use server';
import { createClient } from '@/lib/supabase/server';
import { differenceInDays, parseISO } from 'date-fns';
import { getVatPeriodForDate } from './utils';

/**
 * Recalculates the Output and Input VAT for a specific period from scratch.
 */
export async function recalculateVatPeriod(periodId: string) {
  const supabase = await createClient();
  
  // 1. Get period dates
  const { data: period, error: pError } = await supabase
    .from('vat_periods')
    .select('*')
    .eq('id', periodId)
    .single();

  if (pError || !period) throw new Error('Period not found');

  // 2. Fetch all invoices in this range
  const { data: invoices } = await supabase
    .from('invoices')
    .select('vat_amount, subtotal')
    .gte('issue_date', period.period_start)
    .lte('issue_date', period.period_end);

  // 3. Fetch all claimable expenses in this range
  const { data: expenses } = await supabase
    .from('expenses')
    .select('input_vat_amount, amount_exclusive')
    .eq('vat_claimable', true)
    .gte('expense_date', period.period_start)
    .lte('expense_date', period.period_end);

  const totalOutputVat = invoices?.reduce((sum, inv) => sum + Number(inv.vat_amount || 0), 0) || 0;
  const totalInputVat = expenses?.reduce((sum, ex) => sum + Number(ex.input_vat_amount || 0), 0) || 0;

  // 4. Update the period
  const { data: updated, error: uError } = await supabase
    .from('vat_periods')
    .update({
      output_vat: totalOutputVat,
      input_vat: totalInputVat,
      // net_vat_payable is a generated column in many DBs, 
      // but in our schema it might be calculated or manual.
      // Checking schema 467: net_vat_payable IS generated: (output_vat - input_vat)
      updated_at: new Date().toISOString()
    })
    .eq('id', periodId)
    .select()
    .single();

  if (uError) throw uError;
  return updated;
}

export async function submitVatPeriod(id: string, submissionDate: string, reference: string, notes: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vat_periods')
    .update({
      status: 'Submitted',
      submission_date: submissionDate,
      notes: notes + (reference ? `\nSARS Reference: ${reference}` : ''),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function payVatPeriod(id: string, paymentDate: string, amount: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vat_periods')
    .update({
      status: 'Paid',
      payment_date: paymentDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVatPeriodAmount(date: string, amount: number, action: 'add' | 'subtract') {
  const supabase = await createClient();

  // Find the period containing this date that is still Open
  const { data: period } = await supabase
    .from('vat_periods')
    .select('*')
    .lte('period_start', date)
    .gte('period_end', date)
    .eq('status', 'Open')
    .single();

  if (period) {
    const currentInputVat = Number(period.input_vat || 0);
    const newTotal = action === 'add' ? currentInputVat + amount : currentInputVat - amount;

    await supabase
      .from('vat_periods')
      .update({ input_vat: newTotal })
      .eq('id', period.id);
  }
}
