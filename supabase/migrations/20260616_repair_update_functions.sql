-- Migration: Repair update_quote_with_items (Feature: document editing)
-- Date: 2026-06-16
--
-- Context: 20260331_atomic_line_item_updates.sql never fully applied to the
-- live DB. This recreates the QUOTE update function only — it depends solely on
-- the existing quote_create_result type and the quotes/quote_line_items tables,
-- so it applies cleanly. (The purchase-order and credit-note update functions
-- from that migration have additional schema mismatches and are repaired
-- separately once their schemas are verified.)

create or replace function public.update_quote_with_items(
  p_quote_id         uuid,
  p_client_id        uuid,
  p_line_items       jsonb,
  p_issue_date       date default null,
  p_expiry_date      date default null,
  p_status           text default null,
  p_notes            text default null,
  p_internal_notes   text default null
)
returns public.quote_create_result
language plpgsql
as $$
declare
  v_quote_number    text;
  v_subtotal        numeric := 0;
  v_vat_amount      numeric := 0;
  v_total           numeric := 0;
  v_item_count      integer := 0;
  v_item            jsonb;
  v_include_vat     boolean;
  v_client_name     text;
  v_idx             integer := 0;
begin
  if p_quote_id is null then raise exception 'quote_id is required'; end if;
  if p_client_id is null then raise exception 'client_id is required'; end if;
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then raise exception 'At least one line item is required'; end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
  end loop;

  select company_name into v_client_name from public.clients where id = p_client_id;
  if v_client_name is null then raise exception 'Client with id % does not exist', p_client_id; end if;

  select coalesce(quote_include_year, false) into v_include_vat from public.business_profile limit 1;

  select quote_number into v_quote_number from public.quotes where id = p_quote_id;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;

  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;

  update public.quotes set
    client_id = p_client_id,
    issue_date = coalesce(p_issue_date, issue_date),
    expiry_date = coalesce(p_expiry_date, expiry_date),
    status = coalesce(p_status, status),
    subtotal = v_subtotal,
    vat_amount = v_vat_amount,
    total = v_total,
    notes = coalesce(p_notes, notes),
    internal_notes = coalesce(p_internal_notes, internal_notes),
    updated_at = now()
  where id = p_quote_id;

  delete from public.quote_line_items where quote_id = p_quote_id;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.quote_line_items (quote_id, description, quantity, unit_price, sort_order, qty_type)
    values (
      p_quote_id,
      v_item->>'description',
      coalesce((v_item->>'quantity')::numeric, 1),
      coalesce((v_item->>'unit_price')::numeric, 0),
      v_idx,
      coalesce(v_item->>'qty_type', 'qty')
    );
    v_idx := v_idx + 1;
  end loop;

  return (p_quote_id, v_quote_number, p_client_id, v_client_name, v_subtotal, v_vat_amount, v_total, v_item_count, coalesce(p_status, 'Draft'));
end;
$$;
