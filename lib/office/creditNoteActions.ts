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

/**
 * Apply a credit note to its linked invoice using the atomic DB function.
 * This ensures proper balance recalculation and audit trail.
 */
export async function applyCreditNote(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('apply_credit_note_to_invoice', {
    p_credit_note_id: id,
  });

  if (error) throw error;
  
  if (!data?.success) {
    throw new Error(data?.error || 'Credit note application failed');
  }

  revalidatePath('/office/invoices');
  revalidatePath('/office/credit-notes');
  
  return {
    success: true,
    creditNoteNumber: data.credit_note_number,
    invoiceNumber: data.invoice_number,
    appliedAmount: data.credit_note_amount,
    previousBalance: data.previous_invoice_balance,
    newBalance: data.new_invoice_balance,
    previousStatus: data.previous_invoice_status,
    newStatus: data.new_invoice_status,
  };
}

/**
 * Cancel an applied credit note using the atomic reversal function.
 * This restores the invoice balance and removes the application record.
 */
export async function cancelAppliedCreditNote(id: string, reason?: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('cancel_applied_credit_note', {
    p_credit_note_id: id,
    p_reason: reason || null,
  });

  if (error) throw error;
  
  if (!data?.success) {
    throw new Error(data?.error || 'Credit note cancellation failed');
  }

  revalidatePath('/office/invoices');
  revalidatePath('/office/credit-notes');
  
  return {
    success: true,
    creditNoteNumber: data.credit_note_number,
    invoiceNumber: data.invoice_number,
    reversedAmount: data.reversed_amount,
    newBalance: data.new_invoice_balance,
    newStatus: data.new_invoice_status,
  };
}

/**
 * Reverse a payment using the atomic reversal function.
 * This recalculates invoice balances and updates the status.
 */
export async function reversePayment(paymentId: string, reason?: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('reverse_payment', {
    p_payment_id: paymentId,
    p_reason: reason || null,
  });

  if (error) throw error;
  
  if (!data?.success) {
    throw new Error(data?.error || 'Payment reversal failed');
  }

  revalidatePath('/office/invoices');
  revalidatePath('/office/payments');
  
  return {
    success: true,
    invoiceNumber: data.invoice_number,
    reversedAmount: data.reversed_amount,
    newAmountPaid: data.new_amount_paid,
    newBalanceDue: data.new_balance_due,
    newStatus: data.new_status,
  };
}

/**
 * Void an invoice with proper guards using the atomic void function.
 * Prevents voiding invoices with payments (must use credit note instead).
 */
export async function voidInvoiceWithReversal(invoiceId: string, reason?: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('void_invoice_with_reversal', {
    p_invoice_id: invoiceId,
    p_reason: reason || null,
  });

  if (error) throw error;
  
  if (!data?.success) {
    throw new Error(data?.error || 'Invoice voiding failed');
  }

  revalidatePath('/office/invoices');
  
  return {
    success: true,
    invoiceNumber: data.invoice_number,
    previousStatus: data.previous_status,
    newStatus: data.new_status,
  };
}
