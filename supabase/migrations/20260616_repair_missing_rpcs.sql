-- Migration: Repair the remaining missing RPCs found in the RPC audit
-- Date: 2026-06-16
--
-- The RPC audit (app .rpc() calls vs. live DB) found these never applied:
--   * reverse_payment                — payment reversal + bank-reconcile Undo
--   * generate_delivery_note_number  — delivery-note creation
--   * create_credit_note_with_items  — credit-note creation
--
-- (cancel_applied_credit_note is intentionally NOT here — it depends on the
-- credit_note_applications subsystem that doesn't exist on the live DB; handled
-- separately.)
--
-- Corrections vs. originals, against the live schema:
--   * create_credit_note_with_items used cn_include_vat (no such column) -> credit_note_include_year
--   * create_credit_note_with_items set only cn_number; credit_note_number is
--     NOT NULL on live, so we set both to the generated number.

-- ============================================================
-- reverse_payment (unchanged — references only existing columns)
-- ============================================================
CREATE OR REPLACE FUNCTION public.reverse_payment(
  p_payment_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_payment     record;
  v_invoice     record;
  v_new_paid    numeric;
  v_new_balance numeric;
  v_new_status  text;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'Payment not found'; end if;

  select * into v_invoice from public.invoices where id = v_payment.invoice_id for update;
  if v_invoice.id is null then raise exception 'Invoice not found for this payment'; end if;

  if v_invoice.status = 'Cancelled' then
    raise exception 'Cannot reverse payment on a cancelled invoice.';
  end if;

  v_new_paid := v_invoice.amount_paid - v_payment.amount;
  v_new_balance := v_invoice.balance_due + v_payment.amount;
  if v_new_paid < 0 then v_new_paid := 0; end if;
  if v_new_balance > v_invoice.total then v_new_balance := v_invoice.total; end if;

  if v_new_paid <= 0 then v_new_status := 'Sent';
  elsif v_new_balance > 0 then v_new_status := 'Partially Paid';
  else v_new_status := 'Paid';
  end if;

  update public.invoices
  set amount_paid = v_new_paid, balance_due = v_new_balance, status = v_new_status, updated_at = now()
  where id = v_invoice.id;

  update public.payments
  set notes = COALESCE(notes, '') || ' [REVERSED: ' || COALESCE(p_reason, 'No reason') || ']',
      amount = 0
  where id = p_payment_id;

  insert into public.invoice_status_audit (invoice_id, previous_status, new_status, action, metadata)
  values (
    v_invoice.id, v_invoice.status, v_new_status, 'payment_reversed',
    jsonb_build_object('payment_id', p_payment_id, 'reversed_amount', v_payment.amount, 'reason', p_reason)
  );

  return jsonb_build_object(
    'success', true,
    'invoice_number', v_invoice.invoice_number,
    'reversed_amount', v_payment.amount,
    'new_amount_paid', v_new_paid,
    'new_balance_due', v_new_balance,
    'new_status', v_new_status
  );
end;
$$;

-- ============================================================
-- generate_delivery_note_number (unchanged — document_sequences + settings exist)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_delivery_note_number()
returns text
language plpgsql
as $$
declare
  next_num integer;
  prefix_val text;
  include_year_val boolean;
  year_str text;
  current_year integer;
  row_exists boolean;
begin
  current_year := extract(year from current_date)::int;
  year_str := current_year::text;

  update public.document_sequences
  set next_number = case when last_year = current_year then next_number + 1 else 1 end,
      last_year = current_year,
      updated_at = now()
  where doc_type = 'delivery_note' and subtype = ''
  returning next_number into next_num;

  row_exists := found;

  if not row_exists then
    insert into public.document_sequences (doc_type, subtype, next_number, last_year)
    values ('delivery_note', '', 1, current_year)
    returning next_number into next_num;
  end if;

  select coalesce(delivery_note_prefix, 'DN'), coalesce(delivery_note_include_year, false)
  into prefix_val, include_year_val
  from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'DN');
  include_year_val := coalesce(include_year_val, false);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

-- ============================================================
-- create_credit_note_with_items (corrected columns)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_credit_note_with_items(
  p_client_id   uuid,
  p_line_items  jsonb,
  p_reason      text default null,
  p_notes       text default null,
  p_invoice_id  uuid default null,
  p_issue_date  date default null,
  p_status      text default null
)
returns public.credit_note_create_result
language plpgsql
as $$
declare
  v_cn_id       uuid;
  v_cn_number   text;
  v_subtotal    numeric := 0;
  v_vat_amount  numeric := 0;
  v_total       numeric := 0;
  v_item_count  integer := 0;
  v_item        jsonb;
  v_client_name text;
  v_issue_date  date;
  v_status      text;
  v_include_vat boolean;
begin
  if p_client_id is null then raise exception 'client_id is required'; end if;
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then
    raise exception 'At least one line item is required';
  end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
  end loop;

  select company_name into v_client_name from public.clients where id = p_client_id;
  if v_client_name is null then raise exception 'Client with id % does not exist', p_client_id; end if;

  select coalesce(credit_note_include_year, true) into v_include_vat from public.business_profile limit 1;

  v_cn_number := public.generate_credit_note_number();

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;

  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;
  v_issue_date := coalesce(p_issue_date, current_date);
  v_status := coalesce(p_status, 'Draft');

  insert into public.credit_notes (
    credit_note_number, cn_number, client_id, date_issued, issue_date, status,
    subtotal, vat_amount, total, reason, notes, invoice_id
  )
  values (
    v_cn_number, v_cn_number, p_client_id, v_issue_date, v_issue_date, v_status,
    v_subtotal, v_vat_amount, v_total, p_reason, p_notes, p_invoice_id
  )
  returning id into v_cn_id;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.credit_note_items (
      credit_note_id, description, quantity, unit_price, line_total, vat_rate, invoice_item_id
    )
    values (
      v_cn_id,
      v_item->>'description',
      coalesce((v_item->>'quantity')::numeric, 1),
      coalesce((v_item->>'unit_price')::numeric, 0),
      coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0),
      coalesce((v_item->>'vat_rate')::numeric, 15),
      nullif(v_item->>'invoice_item_id', '')::uuid
    );
  end loop;

  return (
    v_cn_id, v_cn_number, p_client_id, v_client_name,
    v_subtotal, v_vat_amount, v_total, v_item_count, v_status
  )::public.credit_note_create_result;
end;
$$;
