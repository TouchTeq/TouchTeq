'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Convert a quote to an invoice using the atomic DB function.
 * Guards against invalid statuses, duplicate conversions, and empty quotes.
 */
export async function convertQuoteToInvoice(quoteId: string, paymentTermsDays?: number) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('convert_quote_to_invoice', {
    p_quote_id: quoteId,
    p_payment_days: paymentTermsDays || null,
    p_notes: null,
  });

  if (error) throw error;

  if (!data?.success) {
    throw new Error(data?.error || 'Conversion failed');
  }

  revalidatePath('/office/quotes');
  revalidatePath('/office/invoices');

  return {
    success: true,
    quoteId: data.quote_id,
    quoteNumber: data.quote_number,
    invoiceId: data.invoice_id,
    invoiceNumber: data.invoice_number,
    clientId: data.client_id,
    clientName: data.client_name,
    subtotal: data.subtotal,
    vatAmount: data.vat_amount,
    total: data.total,
    dueDate: data.due_date,
    paymentTermsDays: data.payment_terms_days,
    lineItemCount: data.line_item_count,
  };
}

/**
 * Reverse a quote-to-invoice conversion.
 * Only allowed if the invoice has no payments.
 */
export async function reverseQuoteConversion(quoteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('reverse_quote_conversion', {
    p_quote_id: quoteId,
  });

  if (error) throw error;

  if (!data?.success) {
    throw new Error(data?.error || 'Reversal failed');
  }

  revalidatePath('/office/quotes');
  revalidatePath('/office/invoices');

  return {
    success: true,
    quoteNumber: data.quote_number,
    invoiceNumber: data.invoice_number,
    message: data.message,
  };
}