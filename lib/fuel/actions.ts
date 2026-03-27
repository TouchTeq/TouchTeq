'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { updateVatPeriodAmount } from '@/lib/vat/actions';

export interface FuelLogEntry {
  id: string;
  date: string;
  supplier_name: string;
  fuel_type: string;
  litres: number;
  price_per_litre: number;
  total_amount: number;
  odometer: number;
  vehicle_id: string;
  receipt_url?: string;
  payment_method: string;
  expense_id?: string;
  created_at: string;
  updated_at: string;
  vehicles?: {
    vehicle_description: string;
    registration_number: string;
  };
}

export interface FuelLogInput {
  date: string;
  supplier_name: string;
  fuel_type: string;
  litres: number;
  price_per_litre: number;
  total_amount: number;
  odometer: number;
  vehicle_id: string;
  vehicle_name?: string;
  receipt_url?: string;
  payment_method: string;
}

export async function createFuelLog(input: FuelLogInput) {
  const supabase = await createClient();

  // 1. Calculate VAT (15% as per instructions)
  const amountInclusive = Number(input.total_amount);
  const inputVatAmount = Number(((amountInclusive * 15) / 115).toFixed(2));

  // 2. Create the Expense entry
  const { data: expense, error: eError } = await supabase
    .from('expenses')
    .insert([
      {
        expense_date: input.date,
        supplier_name: input.supplier_name,
        description: `Fuel Fill-up: ${input.litres}L ${input.fuel_type} @ ${input.supplier_name}`,
        category: 'Fuel & Travel',
        amount_inclusive: amountInclusive,
        vat_amount: inputVatAmount,
        vat_claimable: true,
        receipt_url: input.receipt_url,
        notes: `Vehicle: ${input.vehicle_name || 'Unknown'}. Odometer: ${input.odometer}km. Payment: ${input.payment_method}.`,
        payment_status: 'PAID'
      }
    ])
    .select()
    .single();

  if (eError) throw eError;

  // 3. Create the Fuel Log entry
  const { data: fuelLog, error: fError } = await supabase
    .from('fuel_logs')
    .insert([
      {
        date: input.date,
        supplier_name: input.supplier_name,
        fuel_type: input.fuel_type,
        litres: Number(input.litres),
        price_per_litre: Number(input.price_per_litre),
        total_amount: amountInclusive,
        odometer: Number(input.odometer),
        vehicle_id: input.vehicle_id,
        receipt_url: input.receipt_url,
        payment_method: input.payment_method,
        expense_id: expense.id
      }
    ])
    .select()
    .single();

  if (fError) {
    // Rollback expense if fuel log fails
    await supabase.from('expenses').delete().eq('id', expense.id);
    throw fError;
  }

  // 4. Update VAT Period
  await updateVatPeriodAmount(input.date, inputVatAmount, 'add');

  revalidatePath('/office/fuel');
  revalidatePath('/office/expenses');
  revalidatePath('/office/vat');
  
  return { success: true, data: fuelLog };
}

export async function deleteFuelLog(id: string) {
  const supabase = await createClient();

  // 1. Get the log to find expense_id and vat amount
  const { data: log, error: gError } = await supabase
    .from('fuel_logs')
    .select('*, expenses(input_vat_amount)')
    .eq('id', id)
    .single();

  if (gError || !log) throw gError || new Error('Log not found');

  const vatAmount = Number((log as any).expenses?.input_vat_amount || 0);

  // 2. Delete Expense if exists
  if (log.expense_id) {
    await supabase.from('expenses').delete().eq('id', log.expense_id);
  }

  // 3. Delete Fuel Log
  const { error: dError } = await supabase
    .from('fuel_logs')
    .delete()
    .eq('id', id);

  if (dError) throw dError;

  // 4. Update VAT Period
  if (vatAmount > 0) {
    await updateVatPeriodAmount(log.date, vatAmount, 'subtract');
  }

  revalidatePath('/office/fuel');
  revalidatePath('/office/expenses');
  revalidatePath('/office/vat');
}

export async function getFuelLogs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fuel_logs')
    .select('*, vehicles(vehicle_description, registration_number)')
    .order('date', { ascending: false });

  if (error) throw error;
  return data as FuelLogEntry[];
}

export async function getSignedFuelReceiptUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from('fuel-receipts').createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
