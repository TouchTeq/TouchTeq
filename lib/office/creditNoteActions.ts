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
 * Apply a credit note to its linked invoice (direct writes — no RPC).
 * Reduces the invoice balance by the credit note total, recomputes status,
 * records the application in the credit_note_applications ledger (which enforces
 * one application per credit note), and marks the credit note Applied.
 */
export async function applyCreditNote(id: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: cn, error: cnErr } = await supabase
    .from('credit_notes')
    .select('id, status, total, invoice_id, credit_note_number')
    .eq('id', id)
    .single();
  if (cnErr || !cn) throw new Error(cnErr?.message || 'Credit note not found');
  if (cn.status === 'Applied') throw new Error(`Credit note ${cn.credit_note_number} has already been applied.`);
  if (!cn.invoice_id) throw new Error(`Credit note ${cn.credit_note_number} is not linked to an invoice.`);

  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, balance_due, status')
    .eq('id', cn.invoice_id)
    .single();
  if (invErr || !inv) throw new Error('Linked invoice not found');
  if (inv.status === 'Cancelled') throw new Error(`Cannot apply to cancelled invoice ${inv.invoice_number}.`);

  const amount = Number(cn.total) || 0;
  const previousBalance = Number(inv.balance_due) || 0;
  let newBalance = previousBalance - amount;
  if (newBalance < 0) newBalance = 0;
  const newStatus = newBalance <= 0 ? 'Paid' : newBalance < Number(inv.total) ? 'Partially Paid' : inv.status;
  const creditStatus = newBalance <= 0 ? 'Fully Credited' : 'Partially Credited';

  // Ledger insert first — the UNIQUE(credit_note_id) guards against double-apply (race-safe)
  const { error: ledgerErr } = await supabase
    .from('credit_note_applications')
    .insert({ credit_note_id: id, invoice_id: inv.id, applied_amount: amount });
  if (ledgerErr) {
    if ((ledgerErr as any).code === '23505') throw new Error(`Credit note ${cn.credit_note_number} has already been applied.`);
    throw new Error(ledgerErr.message);
  }

  await supabase.from('invoices').update({ balance_due: newBalance, status: newStatus, credit_status: creditStatus, updated_at: now }).eq('id', inv.id);
  await supabase.from('credit_notes').update({ status: 'Applied', updated_at: now }).eq('id', id);

  revalidatePath('/office/invoices');
  revalidatePath('/office/credit-notes');

  return {
    success: true,
    creditNoteNumber: cn.credit_note_number,
    invoiceNumber: inv.invoice_number,
    appliedAmount: amount,
    previousBalance,
    newBalance,
    previousStatus: inv.status,
    newStatus,
  };
}

/**
 * Reverse an applied credit note (direct writes — no RPC). Restores the invoice
 * balance, removes the ledger row, and returns the credit note to Sent status.
 */
export async function cancelAppliedCreditNote(id: string, _reason?: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: cn, error: cnErr } = await supabase
    .from('credit_notes')
    .select('id, status, total, invoice_id, credit_note_number')
    .eq('id', id)
    .single();
  if (cnErr || !cn) throw new Error(cnErr?.message || 'Credit note not found');
  if (cn.status !== 'Applied') throw new Error(`Credit note ${cn.credit_note_number} is not applied.`);

  const { data: app } = await supabase
    .from('credit_note_applications')
    .select('id, invoice_id, applied_amount')
    .eq('credit_note_id', id)
    .maybeSingle();

  const invoiceId = app?.invoice_id ?? cn.invoice_id;
  const amount = Number(app?.applied_amount ?? cn.total) || 0;

  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, balance_due, amount_paid')
    .eq('id', invoiceId)
    .single();
  if (invErr || !inv) throw new Error('Linked invoice not found');

  let newBalance = (Number(inv.balance_due) || 0) + amount;
  if (newBalance > Number(inv.total)) newBalance = Number(inv.total);
  const newStatus = newBalance <= 0 ? 'Paid' : Number(inv.amount_paid) > 0 ? 'Partially Paid' : 'Sent';

  await supabase.from('invoices').update({ balance_due: newBalance, status: newStatus, credit_status: 'None', updated_at: now }).eq('id', inv.id);
  if (app?.id) await supabase.from('credit_note_applications').delete().eq('id', app.id);
  await supabase.from('credit_notes').update({ status: 'Sent', updated_at: now }).eq('id', id);

  revalidatePath('/office/invoices');
  revalidatePath('/office/credit-notes');

  return {
    success: true,
    creditNoteNumber: cn.credit_note_number,
    invoiceNumber: inv.invoice_number,
    reversedAmount: amount,
    newBalance,
    newStatus,
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
