'use server';
import { createClient } from '@/lib/supabase/server';


/**
 * Finds the VAT period that a specific date falls into.
 * Period ranges are inclusive.
 */
export async function getVatPeriodForDate(date: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('vat_periods')
    .select('*')
    .lte('period_start', date)
    .gte('period_end', date)
    .single();

  if (error) return null;
  return data;
}
