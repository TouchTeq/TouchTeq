'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getCreditNotes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('credit_notes')
    .select(`
      *,
      credit_note_items(*),
      clients(company_name),
      invoices(invoice_number)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteCreditNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('credit_notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/office/invoices');
  return { success: true };
}

export async function updateCreditNoteStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('credit_notes')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/office/invoices');
  return { success: true };
}

export async function getCreditNoteDetails(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('credit_notes')
    .select(`
      *,
      credit_note_items(*),
      clients(*),
      invoices(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
