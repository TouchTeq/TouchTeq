'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { updateVatPeriodAmount } from '@/lib/vat/actions';

export type ExpenseCategory = 'Materials' | 'Travel' | 'Equipment' | 'Software' | 'Professional Fees' | 'Other';

export async function createExpense(formData: any, inputVatAmount: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        expense_date: formData.expense_date,
        supplier_name: formData.supplier_name,
        description: formData.description,
        category: formData.category,
        amount_inclusive: formData.amount_inclusive,
        vat_claimable: formData.vat_claimable,
        receipt_url: formData.receipt_url,
        notes: formData.notes,
        // Generated columns handle input_vat_amount and amount_exclusive in DB, 
        // but we need the value to update vat_periods
      }
    ])
    .select()
    .single();

  if (error) throw error;

  // Update VAT Period
  if (formData.vat_claimable && inputVatAmount > 0) {
    await updateVatPeriodAmount(formData.expense_date, inputVatAmount, 'add');
  }

  revalidatePath('/office/expenses');
  return data;
}

export async function updateExpense(id: string, formData: any, oldVatAmount: number, newVatAmount: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expenses')
    .update({
      expense_date: formData.expense_date,
      supplier_name: formData.supplier_name,
      description: formData.description,
      category: formData.category,
      amount_inclusive: formData.amount_inclusive,
      vat_claimable: formData.vat_claimable,
      receipt_url: formData.receipt_url,
      notes: formData.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Update VAT Period logic
  // 1. If date changed, we might need to subtract from old period and add to new one.
  // For simplicity if dates differ, we handle that.
  if (formData.old_date !== formData.expense_date) {
    await updateVatPeriodAmount(formData.old_date, oldVatAmount, 'subtract');
    await updateVatPeriodAmount(formData.expense_date, newVatAmount, 'add');
  } else {
    const diff = newVatAmount - oldVatAmount;
    if (diff !== 0) {
      await updateVatPeriodAmount(formData.expense_date, diff, 'add');
    }
  }

  revalidatePath('/office/expenses');
  revalidatePath(`/office/expenses/${id}`);
  return data;
}

export async function deleteExpense(id: string, expenseDate: string, vatAmount: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (vatAmount > 0) {
    await updateVatPeriodAmount(expenseDate, vatAmount, 'subtract');
  }

  revalidatePath('/office/expenses');
}



export async function getSignedUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
