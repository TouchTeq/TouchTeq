'use server';

import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { matchTransactionToInvoices, type OpenInvoice } from '@/lib/bank/matching';
import { createExpense } from '@/lib/expenses/actions';

/** A parsed statement line as produced by the client-side CSV wizard. */
export interface ParsedRow {
  txn_date: string; // YYYY-MM-DD
  description: string;
  reference?: string | null;
  amount: number; // signed: +in / -out
  running_balance?: number | null;
}

export interface ImportMeta {
  source?: 'csv' | 'ofx' | 'pdf';
  bank_name?: string | null;
  account_label?: string | null;
  file_name?: string | null;
}

function dedupeHash(row: ParsedRow): string {
  const desc = (row.description ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const key = `${row.txn_date}|${row.amount.toFixed(2)}|${desc}|${row.running_balance ?? ''}`;
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Persist an uploaded statement. Idempotent: rows whose dedupe_hash already
 * exists (re-upload of the same statement) are skipped via the unique index.
 */
export async function createImport(rows: ParsedRow[], meta: ImportMeta = {}) {
  const supabase = await createClient();

  if (!rows || rows.length === 0) {
    return { error: 'No transactions found in the file.' };
  }

  const dates = rows.map((r) => r.txn_date).filter(Boolean).sort();

  const { data: imp, error: impErr } = await supabase
    .from('statement_imports')
    .insert({
      source: meta.source ?? 'csv',
      bank_name: meta.bank_name ?? null,
      account_label: meta.account_label ?? null,
      file_name: meta.file_name ?? null,
      row_count: rows.length,
      date_from: dates[0] ?? null,
      date_to: dates[dates.length - 1] ?? null,
    })
    .select('id')
    .single();

  if (impErr || !imp) return { error: impErr?.message ?? 'Failed to create import.' };

  const txnRows = rows.map((r) => ({
    import_id: imp.id,
    txn_date: r.txn_date,
    description: r.description ?? null,
    reference: r.reference ?? null,
    amount: r.amount,
    direction: r.amount >= 0 ? 'in' : 'out',
    running_balance: r.running_balance ?? null,
    dedupe_hash: dedupeHash(r),
  }));

  // ignoreDuplicates → re-imported lines are silently skipped
  const { data: inserted, error: txnErr } = await supabase
    .from('bank_transactions')
    .upsert(txnRows, { onConflict: 'dedupe_hash', ignoreDuplicates: true })
    .select('id');

  if (txnErr) return { error: txnErr.message };

  const insertedCount = inserted?.length ?? 0;
  const skipped = rows.length - insertedCount;

  // Reflect the actual stored row count on the import
  await supabase
    .from('statement_imports')
    .update({ row_count: insertedCount })
    .eq('id', imp.id);

  revalidatePath('/office/bank');
  return { importId: imp.id, inserted: insertedCount, skipped };
}

export async function getImports() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('statement_imports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function getReconcileData(importId: string) {
  const supabase = await createClient();

  const [{ data: imp }, { data: txns }, { data: openInv }, { data: expenses }] =
    await Promise.all([
      supabase.from('statement_imports').select('*').eq('id', importId).single(),
      supabase
        .from('bank_transactions')
        .select('*')
        .eq('import_id', importId)
        .order('txn_date', { ascending: true }),
      supabase
        .from('invoices')
        .select('id, invoice_number, balance_due, total, due_date, clients(company_name)')
        .in('status', ['Sent', 'Overdue', 'Partially Paid'])
        .gt('balance_due', 0)
        .order('due_date', { ascending: true }),
      supabase
        .from('expenses')
        .select('id, supplier_name, description, amount_inclusive, expense_date')
        .order('expense_date', { ascending: false })
        .limit(200),
    ]);

  // Supabase infers embedded to-one relations as arrays — flatten to an object.
  const openInvoices = (openInv ?? []).map((inv: any) => ({
    ...inv,
    clients: Array.isArray(inv.clients) ? inv.clients[0] ?? null : inv.clients ?? null,
  }));

  return {
    import: imp ?? null,
    transactions: txns ?? [],
    openInvoices,
    expenses: expenses ?? [],
  };
}

/**
 * Run the matching engine over all unmatched money-in transactions and store
 * suggestions. Never records a payment — only proposes a link to confirm.
 */
export async function autoMatchImport(importId: string) {
  const supabase = await createClient();

  const [{ data: txns }, { data: openInv }] = await Promise.all([
    supabase
      .from('bank_transactions')
      .select('id, amount, description, reference')
      .eq('import_id', importId)
      .eq('direction', 'in')
      .eq('status', 'unmatched'),
    supabase
      .from('invoices')
      .select('id, invoice_number, balance_due, total, due_date')
      .in('status', ['Sent', 'Overdue', 'Partially Paid'])
      .gt('balance_due', 0),
  ]);

  if (!txns || txns.length === 0) return { suggested: 0 };

  const invoices = (openInv ?? []) as OpenInvoice[];
  let suggested = 0;

  for (const txn of txns) {
    const match = matchTransactionToInvoices(txn, invoices);
    if (!match) continue;
    const { error } = await supabase
      .from('bank_transactions')
      .update({
        status: 'suggested',
        matched_type: 'invoice',
        matched_id: match.invoiceId,
        match_confidence: match.confidence,
      })
      .eq('id', txn.id);
    if (!error) suggested += 1;
  }

  await supabase
    .from('statement_imports')
    .update({ status: 'reconciling' })
    .eq('id', importId);

  revalidatePath(`/office/bank/${importId}`);
  return { suggested };
}

/**
 * Confirm a money-in suggestion: record the payment against the invoice using
 * the atomic RPC (which guards against overpayment / paid / cancelled), then
 * flip the transaction to matched→payment.
 */
export async function confirmInvoiceMatch(txnId: string, invoiceId?: string) {
  const supabase = await createClient();

  const { data: txn, error: txnErr } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('id', txnId)
    .single();
  if (txnErr || !txn) return { error: 'Transaction not found.' };
  if (txn.direction !== 'in') return { error: 'Only money-in can be matched to an invoice.' };

  const targetInvoice = invoiceId ?? txn.matched_id;
  if (!targetInvoice) return { error: 'No invoice selected.' };

  const { data, error } = await supabase.rpc('record_invoice_payment', {
    p_invoice_id: targetInvoice,
    p_amount: Math.abs(Number(txn.amount)),
    p_payment_date: txn.txn_date,
    p_payment_method: 'EFT',
    p_reference: txn.reference || txn.description || 'Bank statement import',
    p_notes: 'Matched from bank statement import',
  });

  if (error) return { error: error.message };

  const paymentId = (data as any)?.payment_id ?? null;

  await supabase
    .from('bank_transactions')
    .update({
      status: 'matched',
      matched_type: 'payment',
      matched_id: paymentId,
      match_confidence: txn.match_confidence ?? 100,
    })
    .eq('id', txnId);

  await recomputeImport(importIdOf(txn));
  revalidatePath('/office/invoices');
  revalidatePath(`/office/bank/${importIdOf(txn)}`);
  return {
    success: true,
    invoiceNumber: (data as any)?.invoice_number,
    newStatus: (data as any)?.new_status,
    newBalance: (data as any)?.balance_due,
  };
}

/** Manually point a transaction at a specific invoice (re-suggest, still needs confirm). */
export async function assignInvoiceToTxn(txnId: string, invoiceId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bank_transactions')
    .update({ status: 'suggested', matched_type: 'invoice', matched_id: invoiceId, match_confidence: null })
    .eq('id', txnId);
  if (error) return { error: error.message };
  return { success: true };
}

/** Link a money-out transaction to an existing expense (no financial mutation). */
export async function matchExpenseToTxn(txnId: string, expenseId: string) {
  const supabase = await createClient();
  const { data: txn } = await supabase.from('bank_transactions').select('import_id').eq('id', txnId).single();
  const { error } = await supabase
    .from('bank_transactions')
    .update({ status: 'matched', matched_type: 'expense', matched_id: expenseId, match_confidence: 100 })
    .eq('id', txnId);
  if (error) return { error: error.message };
  if (txn) await recomputeImport(txn.import_id);
  return { success: true };
}

/**
 * Create a new expense from a money-out transaction and link it. Reuses the
 * existing createExpense action so VAT-period totals stay correct. Defaults to
 * a standard 15% VAT-inclusive expense; the user can refine it in the Expenses
 * module afterwards.
 */
export async function createExpenseFromTxn(txnId: string) {
  const supabase = await createClient();
  const { data: txn } = await supabase.from('bank_transactions').select('*').eq('id', txnId).single();
  if (!txn) return { error: 'Transaction not found.' };
  if (txn.direction !== 'out') return { error: 'Only money-out can become an expense.' };

  const amountInclusive = Math.abs(Number(txn.amount));
  const vatClaimable = true;
  const inputVat = vatClaimable ? Math.round(((amountInclusive * 15) / 115) * 100) / 100 : 0;

  let expense: any;
  try {
    expense = await createExpense(
      {
        expense_date: txn.txn_date,
        supplier_name: (txn.description || txn.reference || 'Bank transaction').slice(0, 120),
        description: txn.reference || txn.description || 'Imported from bank statement',
        category: 'Other',
        amount_inclusive: amountInclusive,
        vat_claimable: vatClaimable,
        receipt_url: null,
        notes: 'Created from bank statement import',
      },
      inputVat
    );
  } catch (e: any) {
    return { error: e.message };
  }

  await supabase
    .from('bank_transactions')
    .update({ status: 'matched', matched_type: 'expense', matched_id: expense.id, match_confidence: 100 })
    .eq('id', txnId);

  await recomputeImport(txn.import_id);
  revalidatePath('/office/expenses');
  revalidatePath(`/office/bank/${txn.import_id}`);
  return { success: true, expenseId: expense.id };
}

export async function ignoreTxn(txnId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bank_transactions')
    .update({ status: 'ignored', matched_type: null, matched_id: null, match_confidence: null })
    .eq('id', txnId);
  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Undo a match. If the transaction had recorded a payment, reverse it via the
 * atomic reversal RPC so invoice balances stay correct.
 */
export async function unmatchTxn(txnId: string) {
  const supabase = await createClient();
  const { data: txn } = await supabase.from('bank_transactions').select('*').eq('id', txnId).single();
  if (!txn) return { error: 'Transaction not found.' };

  if (txn.matched_type === 'payment' && txn.matched_id) {
    const { error } = await supabase.rpc('reverse_payment', {
      p_payment_id: txn.matched_id,
      p_reason: 'Bank statement match undone',
    });
    if (error) return { error: error.message };
    revalidatePath('/office/invoices');
  }

  await supabase
    .from('bank_transactions')
    .update({ status: 'unmatched', matched_type: null, matched_id: null, match_confidence: null })
    .eq('id', txnId);

  await recomputeImport(txn.import_id);
  revalidatePath(`/office/bank/${txn.import_id}`);
  return { success: true };
}

export async function deleteImport(importId: string) {
  const supabase = await createClient();
  // Block deletion if any payment was recorded from this import (avoid silent balance drift)
  const { data: payments } = await supabase
    .from('bank_transactions')
    .select('id')
    .eq('import_id', importId)
    .eq('matched_type', 'payment')
    .limit(1);
  if (payments && payments.length > 0) {
    return { error: 'This import has recorded payments. Undo those matches before deleting.' };
  }
  const { error } = await supabase.from('statement_imports').delete().eq('id', importId);
  if (error) return { error: error.message };
  revalidatePath('/office/bank');
  return { success: true };
}

function importIdOf(txn: any): string {
  return txn.import_id as string;
}

/** Recompute matched_count + status for an import. */
async function recomputeImport(importId: string) {
  const supabase = await createClient();
  const { data: txns } = await supabase
    .from('bank_transactions')
    .select('status')
    .eq('import_id', importId);
  if (!txns) return;
  const matched = txns.filter((t) => t.status === 'matched').length;
  const outstanding = txns.filter((t) => t.status === 'unmatched' || t.status === 'suggested').length;
  await supabase
    .from('statement_imports')
    .update({ matched_count: matched, status: outstanding === 0 ? 'reconciled' : 'reconciling' })
    .eq('id', importId);
}
