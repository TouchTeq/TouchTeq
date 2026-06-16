'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SOLineItemInput {
  description: string;
  quantity: number;
  unit_price: number;
  qty_type?: string;
  vat_rate?: number;
}

export interface SalesOrderInput {
  client_id: string;
  order_date: string;
  expected_delivery_date?: string | null;
  status?: string;
  notes?: string | null;
  internal_notes?: string | null;
  line_items: SOLineItemInput[];
}

function normalize(items: SOLineItemInput[]) {
  return (items || [])
    .filter((i) => (i.description || '').trim() !== '')
    .map((i, idx) => {
      const quantity = Number(i.quantity) || 0;
      const unit_price = Number(i.unit_price) || 0;
      return {
        description: String(i.description).trim(),
        quantity,
        unit_price,
        qty_type: i.qty_type === 'hrs' ? 'hrs' : 'qty',
        vat_rate: i.vat_rate ?? 15,
        line_total: Math.round(quantity * unit_price * 100) / 100,
        sort_order: idx,
      };
    });
}

function totalsOf(items: { quantity: number; unit_price: number }[]) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vat_amount = Math.round(subtotal * 0.15 * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, vat_amount, total: Math.round((subtotal + vat_amount) * 100) / 100 };
}

async function nextSoNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SO-${year}-`;
  const { data } = await supabase
    .from('sales_orders')
    .select('so_number')
    .like('so_number', `${prefix}%`)
    .order('so_number', { ascending: false })
    .limit(1);
  let next = 1;
  if (data && data.length) {
    const n = parseInt(String(data[0].so_number).slice(prefix.length), 10);
    if (!isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export async function getSalesOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*, clients(company_name)')
    .order('created_at', { ascending: false });
  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function getSalesOrder(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*, clients(*), sales_order_items(*), quotes(quote_number), invoices(id, invoice_number)')
    .eq('id', id)
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function createSalesOrder(input: SalesOrderInput) {
  const supabase = await createClient();
  const items = normalize(input.line_items);
  if (items.length === 0) return { error: 'Add at least one line item.' };
  if (!input.client_id) return { error: 'Select a client.' };
  const totals = totalsOf(items);
  const so_number = await nextSoNumber(supabase);

  const { data: so, error } = await supabase
    .from('sales_orders')
    .insert({
      so_number,
      client_id: input.client_id,
      order_date: input.order_date,
      expected_delivery_date: input.expected_delivery_date || null,
      status: input.status || 'Draft',
      subtotal: totals.subtotal,
      vat_amount: totals.vat_amount,
      total: totals.total,
      notes: input.notes ?? null,
      internal_notes: input.internal_notes ?? null,
    })
    .select('id')
    .single();
  if (error || !so) return { error: error?.message || 'Failed to create sales order.' };

  const { error: itemsErr } = await supabase
    .from('sales_order_items')
    .insert(items.map((i) => ({ ...i, sales_order_id: so.id })));
  if (itemsErr) return { error: itemsErr.message };

  revalidatePath('/office/sales-orders');
  return { id: so.id, so_number };
}

export async function updateSalesOrder(id: string, input: SalesOrderInput) {
  const supabase = await createClient();
  const items = normalize(input.line_items);
  if (items.length === 0) return { error: 'Add at least one line item.' };
  const totals = totalsOf(items);

  const { error } = await supabase
    .from('sales_orders')
    .update({
      client_id: input.client_id,
      order_date: input.order_date,
      expected_delivery_date: input.expected_delivery_date || null,
      status: input.status,
      subtotal: totals.subtotal,
      vat_amount: totals.vat_amount,
      total: totals.total,
      notes: input.notes ?? null,
      internal_notes: input.internal_notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: error.message };

  // Replace line items
  await supabase.from('sales_order_items').delete().eq('sales_order_id', id);
  const { error: itemsErr } = await supabase
    .from('sales_order_items')
    .insert(items.map((i) => ({ ...i, sales_order_id: id })));
  if (itemsErr) return { error: itemsErr.message };

  revalidatePath('/office/sales-orders');
  revalidatePath(`/office/sales-orders/${id}`);
  return { success: true };
}

export async function deleteSalesOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('sales_orders').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/office/sales-orders');
  return { success: true };
}

export async function updateSalesOrderStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('sales_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/office/sales-orders/${id}`);
  return { success: true };
}

/** Create a sales order from an accepted quote, copying its line items. */
export async function convertQuoteToSalesOrder(quoteId: string) {
  const supabase = await createClient();

  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('*, quote_line_items(*)')
    .eq('id', quoteId)
    .single();
  if (qErr || !quote) return { error: qErr?.message || 'Quote not found.' };
  if (quote.converted_sales_order_id) return { error: 'This quote already has a sales order.' };
  if (!quote.client_id) return { error: 'Quote has no client linked.' };
  const qItems = (quote.quote_line_items || []) as any[];
  if (qItems.length === 0) return { error: 'Quote has no line items.' };

  const res = await createSalesOrder({
    client_id: quote.client_id,
    order_date: new Date().toISOString().split('T')[0],
    status: 'Confirmed',
    notes: quote.notes ?? null,
    line_items: qItems
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((i) => ({ description: i.description, quantity: Number(i.quantity), unit_price: Number(i.unit_price), qty_type: i.qty_type, vat_rate: i.vat_rate })),
  });
  if ('error' in res) return res;

  // Link both directions + record source quote on the SO
  await supabase.from('sales_orders').update({ quote_id: quoteId }).eq('id', res.id);
  await supabase.from('quotes').update({ converted_sales_order_id: res.id, updated_at: new Date().toISOString() }).eq('id', quoteId);

  revalidatePath('/office/quotes');
  revalidatePath('/office/sales-orders');
  return { success: true, salesOrderId: res.id, soNumber: res.so_number };
}

/**
 * Convert a sales order to an invoice. Reuses the existing (working)
 * create_invoice_with_items RPC for correct numbering, then links the invoice
 * back to the sales order and marks the SO Invoiced.
 */
export async function convertSalesOrderToInvoice(soId: string) {
  const supabase = await createClient();

  const { data: so, error } = await supabase
    .from('sales_orders')
    .select('*, sales_order_items(*)')
    .eq('id', soId)
    .single();
  if (error || !so) return { error: error?.message || 'Sales order not found.' };
  if (so.status === 'Invoiced') return { error: 'This sales order has already been invoiced.' };
  if (so.status === 'Cancelled') return { error: 'Cancelled sales orders cannot be invoiced.' };
  if (!so.client_id) return { error: 'Sales order has no client linked.' };
  const items = (so.sales_order_items || []) as any[];
  if (items.length === 0) return { error: 'Sales order has no line items.' };

  // Resolve payment terms for the due date
  const { data: profile } = await supabase.from('business_profile').select('payment_terms_days').limit(1).maybeSingle();
  const terms = profile?.payment_terms_days ?? 30;
  const issue = new Date();
  const due = new Date(issue.getTime() + terms * 86400000);

  // Mirror the working "existing client" call in the new-invoice page exactly,
  // so PostgREST resolves to the base overload (not the quick-client one).
  const { data: result, error: rpcErr } = await supabase.rpc('create_invoice_with_items', {
    p_client_id: so.client_id,
    p_line_items: items
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((i) => ({ description: i.description, quantity: Number(i.quantity), unit_price: Number(i.unit_price), qty_type: i.qty_type })),
    p_notes: `Invoiced from sales order ${so.so_number}`,
    p_internal_notes: `Created from sales order ${so.so_number}`,
    p_is_recurring: false,
    p_recurring_freq: null,
    p_issue_date: issue.toISOString().split('T')[0],
    p_due_date: due.toISOString().split('T')[0],
    p_status: 'Draft',
    p_recurring_start_date: null,
    p_recurring_end_date: null,
    p_recurring_auto_send: false,
  });
  if (rpcErr) return { error: rpcErr.message };
  const invoiceId = (result as any)?.id;
  const invoiceNumber = (result as any)?.document_number;
  if (!invoiceId) return { error: 'Invoice creation did not return an id.' };

  // Link invoice → SO, and mark SO invoiced
  await supabase.from('invoices').update({ sales_order_id: soId }).eq('id', invoiceId);
  await supabase
    .from('sales_orders')
    .update({ status: 'Invoiced', invoiced_total: so.total, updated_at: new Date().toISOString() })
    .eq('id', soId);

  revalidatePath('/office/sales-orders');
  revalidatePath(`/office/sales-orders/${soId}`);
  revalidatePath('/office/invoices');
  return { success: true, invoiceId, invoiceNumber };
}
