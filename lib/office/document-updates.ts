'use server';

import { createClient } from '@/lib/supabase/server';

type LineItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
  qty_type?: string;
};

function normalizeLineItems(items: LineItemInput[]) {
  return items.map((item) => ({
    description: String(item.description || '').trim(),
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unit_price) || 0,
    qty_type: item.qty_type === 'hrs' ? 'hrs' : 'qty',
  }));
}

function calculateTotals(items: LineItemInput[]) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
  const vat_amount = subtotal * 0.15;
  const total = subtotal + vat_amount;
  return { subtotal, vat_amount, total };
}

export async function updateInvoiceWithItems(input: {
  invoiceId: string;
  clientId: string | null;
  issue_date: string;
  due_date: string;
  status: string;
  notes?: string | null;
  internal_notes?: string | null;
  reference?: string | null;
  line_items: LineItemInput[];
  quick_client_name?: string | null;
  quick_client_email?: string | null;
  quick_client_address?: string | null;
}) {
  const supabase = await createClient();
  const normalizedItems = normalizeLineItems(input.line_items || []);

  // Calculate totals
  const totals = calculateTotals(input.line_items || []);

  // Handle quick client (no linked client record) vs regular client
  if (!input.clientId) {
    // Quick client invoice - update directly without RPC
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        client_id: null,
        quick_client_name: input.quick_client_name ?? null,
        quick_client_email: input.quick_client_email ?? null,
        quick_client_address: input.quick_client_address ?? null,
        issue_date: input.issue_date,
        due_date: input.due_date,
        status: input.status,
        subtotal: totals.subtotal,
        vat_amount: totals.vat_amount,
        total: totals.total,
        notes: input.notes ?? null,
        internal_notes: input.internal_notes ?? null,
        reference: input.reference ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.invoiceId);

    if (updateError) {
      throw new Error(updateError.message || 'Invoice update failed');
    }

    // Delete existing line items and insert new ones
    await supabase.from('invoice_line_items').delete().eq('invoice_id', input.invoiceId);

    for (let i = 0; i < normalizedItems.length; i++) {
      await supabase.from('invoice_line_items').insert({
        invoice_id: input.invoiceId,
        description: normalizedItems[i].description,
        quantity: normalizedItems[i].quantity,
        unit_price: normalizedItems[i].unit_price,
        sort_order: i,
        qty_type: normalizedItems[i].qty_type,
      });
    }
  } else {
    // Regular client - use the RPC
    const { data: result, error: rpcError } = await supabase.rpc('update_invoice_with_items', {
      p_invoice_id: input.invoiceId,
      p_client_id: input.clientId,
      p_line_items: normalizedItems,
      p_issue_date: input.issue_date,
      p_due_date: input.due_date,
      p_status: input.status,
      p_notes: input.notes ?? null,
      p_internal_notes: input.internal_notes ?? null,
      p_reference: input.reference ?? null,
    });

    if (rpcError || !result) {
      throw new Error(rpcError?.message || 'Invoice update failed');
    }
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', input.invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error(invoiceError?.message || 'Failed to load updated invoice');
  }

  const { data: lineItems, error: itemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', input.invoiceId)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message || 'Failed to load updated invoice items');
  }

  return { invoice, lineItems: lineItems || [] };
}

export async function updateQuoteWithItems(input: {
  quoteId: string;
  clientId: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  notes?: string | null;
  internal_notes?: string | null;
  line_items: LineItemInput[];
}) {
  const supabase = await createClient();
  const normalizedItems = normalizeLineItems(input.line_items || []);

  const { data: result, error: rpcError } = await supabase.rpc('update_quote_with_items', {
    p_quote_id: input.quoteId,
    p_client_id: input.clientId,
    p_line_items: normalizedItems,
    p_issue_date: input.issue_date,
    p_expiry_date: input.expiry_date,
    p_status: input.status,
    p_notes: input.notes ?? null,
    p_internal_notes: input.internal_notes ?? null,
  });

  if (rpcError || !result) {
    throw new Error(rpcError?.message || 'Quote update failed');
  }

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*, clients(*)')
    .eq('id', input.quoteId)
    .single();

  if (quoteError || !quote) {
    throw new Error(quoteError?.message || 'Failed to load updated quote');
  }

  const { data: lineItems, error: itemsError } = await supabase
    .from('quote_line_items')
    .select('*')
    .eq('quote_id', input.quoteId)
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message || 'Failed to load updated quote items');
  }

  return { quote, lineItems: lineItems || [] };
}

export async function updatePurchaseOrderWithItems(input: {
  poId: string;
  supplier_name: string;
  supplier_contact?: string | null;
  supplier_email?: string | null;
  date_raised: string;
  delivery_date?: string | null;
  status: string;
  notes?: string | null;
  linked_quote_id?: string | null;
  linked_invoice_id?: string | null;
  line_items: LineItemInput[];
}) {
  const supabase = await createClient();
  const normalizedItems = normalizeLineItems(input.line_items || []);

  const { data: result, error: rpcError } = await supabase.rpc('update_purchase_order_with_items', {
    p_po_id: input.poId,
    p_line_items: normalizedItems,
    p_supplier_name: input.supplier_name,
    p_supplier_contact: input.supplier_contact ?? null,
    p_supplier_email: input.supplier_email ?? null,
    p_date_raised: input.date_raised,
    p_delivery_date: input.delivery_date ?? null,
    p_status: input.status,
    p_notes: input.notes ?? null,
    p_linked_quote_id: input.linked_quote_id || null,
    p_linked_invoice_id: input.linked_invoice_id || null,
  });

  if (rpcError || !result) {
    throw new Error(rpcError?.message || 'Purchase order update failed');
  }

  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)')
    .eq('id', input.poId)
    .single();

  if (poError || !po) {
    throw new Error(poError?.message || 'Failed to load updated purchase order');
  }

  return { purchaseOrder: po, lineItems: po.purchase_order_items || [] };
}

export async function updateCreditNoteWithItems(input: {
  creditNoteId: string;
  client_id: string;
  issue_date: string;
  status: string;
  reason: string;
  notes?: string | null;
  line_items: LineItemInput[];
  invoice_id?: string | null;
}) {
  const supabase = await createClient();
  const normalizedItems = normalizeLineItems(input.line_items || []);

  const { data: result, error: rpcError } = await supabase.rpc('update_credit_note_with_items', {
    p_cn_id: input.creditNoteId,
    p_client_id: input.client_id,
    p_line_items: normalizedItems,
    p_issue_date: input.issue_date,
    p_status: input.status,
    p_reason: input.reason,
    p_notes: input.notes ?? null,
    p_invoice_id: input.invoice_id ?? null,
  });

  if (rpcError || !result) {
    throw new Error(rpcError?.message || 'Credit note update failed');
  }

  const { data: creditNote, error: cnError } = await supabase
    .from('credit_notes')
    .select('*, credit_note_items(*), clients(*)')
    .eq('id', input.creditNoteId)
    .single();

  if (cnError || !creditNote) {
    throw new Error(cnError?.message || 'Failed to load updated credit note');
  }

  return { creditNote, lineItems: creditNote.credit_note_items || [] };
}
