-- Migration: Repair update_purchase_order_with_items + update_credit_note_with_items
-- Date: 2026-06-16
--
-- The original 20260331_atomic_line_item_updates.sql never applied to the live
-- DB and contained several mismatches against the real schema. This recreates
-- the PO and credit-note update functions corrected against the live columns,
-- and creates the two result types they return (which were never created).
--
-- Corrections vs. the original:
--   * create po_create_result / credit_note_create_result (were missing)
--   * credit-note function returned undefined type cn_create_result
--   * po_include_vat / cn_include_vat columns don't exist -> *_include_year
--   * purchase_order_items has no sort_order/qty_type columns
--   * credit_note_items has no sort_order column
--   * look up credit_note_number (NOT NULL) instead of nullable cn_number

-- ============================================================
-- Result types (guarded — only create if absent)
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'po_create_result') then
    create type public.po_create_result as (
      id              uuid,
      document_number text,
      supplier_name   text,
      subtotal        numeric,
      vat_amount      numeric,
      total           numeric,
      line_item_count integer,
      status          text
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'credit_note_create_result') then
    create type public.credit_note_create_result as (
      id              uuid,
      document_number text,
      client_id       uuid,
      client_name     text,
      subtotal        numeric,
      vat_amount      numeric,
      total           numeric,
      line_item_count integer,
      status          text
    );
  end if;
end $$;

-- ============================================================
-- Purchase Order: update_purchase_order_with_items
-- ============================================================
create or replace function public.update_purchase_order_with_items(
  p_po_id             uuid,
  p_line_items        jsonb,
  p_supplier_name     text    default null,
  p_supplier_contact  text    default null,
  p_supplier_email    text    default null,
  p_date_raised       date    default null,
  p_delivery_date     date    default null,
  p_status            text    default null,
  p_notes             text    default null,
  p_linked_quote_id   uuid    default null,
  p_linked_invoice_id uuid    default null
)
returns public.po_create_result
language plpgsql
as $$
declare
  v_po_number   text;
  v_subtotal    numeric := 0;
  v_vat_amount  numeric := 0;
  v_total       numeric := 0;
  v_item_count  integer := 0;
  v_item        jsonb;
  v_include_vat boolean;
  v_supplier    text;
  v_qty         numeric;
  v_price       numeric;
begin
  if p_po_id is null then raise exception 'po_id is required'; end if;
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then raise exception 'At least one line item is required'; end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
    if coalesce((v_item->>'quantity')::numeric, 0) <= 0 then
      raise exception 'Quantity must be a positive number for item: %', v_item->>'description';
    end if;
    if coalesce((v_item->>'unit_price')::numeric, 0) < 0 then
      raise exception 'Unit price cannot be negative for item: %', v_item->>'description';
    end if;
  end loop;

  select po_number, supplier_name into v_po_number, v_supplier from public.purchase_orders where id = p_po_id;
  if v_po_number is null then raise exception 'Purchase order with id % does not exist', p_po_id; end if;

  select coalesce(po_include_year, false) into v_include_vat from public.business_profile limit 1;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;

  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;

  update public.purchase_orders set
    supplier_name     = coalesce(p_supplier_name, supplier_name),
    supplier_contact  = coalesce(p_supplier_contact, supplier_contact),
    supplier_email    = coalesce(p_supplier_email, supplier_email),
    date_raised       = coalesce(p_date_raised, date_raised),
    delivery_date     = coalesce(p_delivery_date, delivery_date),
    status            = coalesce(p_status, status),
    subtotal          = v_subtotal,
    vat_amount        = v_vat_amount,
    total             = v_total,
    notes             = coalesce(p_notes, notes),
    linked_quote_id   = coalesce(p_linked_quote_id, linked_quote_id),
    linked_invoice_id = coalesce(p_linked_invoice_id, linked_invoice_id),
    updated_at        = now()
  where id = p_po_id;

  delete from public.purchase_order_items where purchase_order_id = p_po_id;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_qty   := coalesce((v_item->>'quantity')::numeric, 1);
    v_price := coalesce((v_item->>'unit_price')::numeric, 0);
    insert into public.purchase_order_items (purchase_order_id, description, quantity, unit_price, line_total)
    values (p_po_id, v_item->>'description', v_qty, v_price, v_qty * v_price);
  end loop;

  return (p_po_id, v_po_number, v_supplier, v_subtotal, v_vat_amount, v_total, v_item_count, coalesce(p_status, 'Draft'));
end;
$$;

-- ============================================================
-- Credit Note: update_credit_note_with_items
-- ============================================================
create or replace function public.update_credit_note_with_items(
  p_cn_id       uuid,
  p_client_id   uuid,
  p_line_items  jsonb,
  p_issue_date  date    default null,
  p_status      text    default null,
  p_reason      text    default null,
  p_notes       text    default null,
  p_invoice_id  uuid    default null
)
returns public.credit_note_create_result
language plpgsql
as $$
declare
  v_cn_number   text;
  v_subtotal    numeric := 0;
  v_vat_amount  numeric := 0;
  v_total       numeric := 0;
  v_item_count  integer := 0;
  v_item        jsonb;
  v_include_vat boolean;
  v_client_name text;
  v_qty         numeric;
  v_price       numeric;
  v_rate        numeric;
begin
  if p_cn_id is null then raise exception 'cn_id is required'; end if;
  if p_client_id is null then raise exception 'client_id is required'; end if;
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then raise exception 'At least one line item is required'; end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
    if coalesce((v_item->>'quantity')::numeric, 0) <= 0 then
      raise exception 'Quantity must be a positive number for item: %', v_item->>'description';
    end if;
    if coalesce((v_item->>'unit_price')::numeric, 0) < 0 then
      raise exception 'Unit price cannot be negative for item: %', v_item->>'description';
    end if;
  end loop;

  select company_name into v_client_name from public.clients where id = p_client_id;
  if v_client_name is null then raise exception 'Client with id % does not exist', p_client_id; end if;

  select credit_note_number into v_cn_number from public.credit_notes where id = p_cn_id;
  if v_cn_number is null then raise exception 'Credit note with id % does not exist', p_cn_id; end if;

  select coalesce(credit_note_include_year, false) into v_include_vat from public.business_profile limit 1;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;

  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;

  update public.credit_notes set
    client_id  = p_client_id,
    issue_date = coalesce(p_issue_date, issue_date),
    status     = coalesce(p_status, status),
    subtotal   = v_subtotal,
    vat_amount = v_vat_amount,
    total      = v_total,
    reason     = coalesce(p_reason, reason),
    notes      = coalesce(p_notes, notes),
    invoice_id = coalesce(p_invoice_id, invoice_id),
    updated_at = now()
  where id = p_cn_id;

  delete from public.credit_note_items where credit_note_id = p_cn_id;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_qty   := coalesce((v_item->>'quantity')::numeric, 1);
    v_price := coalesce((v_item->>'unit_price')::numeric, 0);
    v_rate  := coalesce((v_item->>'vat_rate')::numeric, 15);
    insert into public.credit_note_items (credit_note_id, description, quantity, unit_price, vat_rate, line_total)
    values (p_cn_id, v_item->>'description', v_qty, v_price, v_rate, v_qty * v_price);
  end loop;

  return (p_cn_id, v_cn_number, p_client_id, v_client_name, v_subtotal, v_vat_amount, v_total, v_item_count, coalesce(p_status, 'Draft'));
end;
$$;
