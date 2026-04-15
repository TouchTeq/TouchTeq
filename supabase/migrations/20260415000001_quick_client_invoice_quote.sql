-- Migration: Support Quick Client (null client_id) in create_invoice_with_items
--            and create_quote_with_items
-- Date: 2026-04-15
--
-- Problem:
--   The Quick Client feature passes p_client_id = NULL when the user hasn't
--   selected an existing client and chose not to save to the database.
--   The existing functions raised 'client_id is required' for null input,
--   breaking invoice and quote creation in Quick Client mode.
--
-- Fix:
--   • Remove the NOT NULL guard on p_client_id.
--   • Skip the client-name lookup when p_client_id is null (use the name
--     embedded in p_internal_notes / p_client_name instead).
--   • Add optional p_client_name parameter so callers can pass a display
--     name without a database record.
--   • Refresh the PostgREST schema cache at the end.

-- ============================================================
-- CREATE INVOICE WITH ITEMS  (allows null p_client_id)
-- ============================================================
create or replace function public.create_invoice_with_items(
  p_client_id              uuid    default null,
  p_line_items             jsonb            ,          -- required, no default
  p_notes                  text    default null,
  p_internal_notes         text    default null,
  p_is_recurring           boolean default false,
  p_recurring_freq         text    default null,
  p_issue_date             date    default null,
  p_due_date               date    default null,
  p_status                 text    default null,
  p_recurring_start_date   date    default null,
  p_recurring_end_date     date    default null,
  p_recurring_auto_send    boolean default false,
  p_client_name            text    default null   -- display name for quick-client mode
)
returns public.invoice_create_result
language plpgsql
as $$
declare
  v_invoice_id      uuid;
  v_invoice_number  text;
  v_subtotal        numeric := 0;
  v_vat_amount      numeric := 0;
  v_total           numeric := 0;
  v_item_count      integer := 0;
  v_item            jsonb;
  v_include_vat     boolean;
  v_terms_days      integer;
  v_issue_date      date;
  v_due_date        date;
  v_client_name     text;
  v_idx             integer := 0;
  v_status          text;
begin
  -- p_client_id is optional — null is allowed for Quick Client mode
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then
    raise exception 'At least one line item is required';
  end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
  end loop;

  -- Resolve display name
  if p_client_id is not null then
    select company_name into v_client_name
    from public.clients where id = p_client_id;

    if v_client_name is null then
      raise exception 'Client with id % does not exist', p_client_id;
    end if;
  else
    -- Quick Client: use explicit name or fall back to a generic label
    v_client_name := coalesce(p_client_name, 'Quick Client');
  end if;

  select coalesce(invoice_include_year, false)
  into v_include_vat
  from public.business_profile limit 1;

  v_invoice_number := public.generate_invoice_number();

  v_issue_date := coalesce(p_issue_date, current_date);
  select coalesce(invoice_payment_terms_days, 30) into v_terms_days
  from public.business_profile limit 1;
  v_due_date := coalesce(p_due_date, v_issue_date + (v_terms_days || ' days')::interval);
  v_status := coalesce(p_status, 'Draft');

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal
      + (coalesce((v_item->>'quantity')::numeric, 1)
         * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;

  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;

  insert into public.invoices (
    invoice_number, client_id, issue_date, due_date, status,
    subtotal, vat_amount, total, amount_paid,
    notes, internal_notes, is_recurring, recurring_frequency, recurring_next_date,
    recurring_start_date, recurring_end_date, recurring_auto_send
  )
  values (
    v_invoice_number, p_client_id, v_issue_date, v_due_date, v_status,
    v_subtotal, v_vat_amount, v_total, 0,
    p_notes, p_internal_notes, p_is_recurring, p_recurring_freq,
    case when p_is_recurring then coalesce(p_recurring_start_date, v_issue_date) else null end,
    p_recurring_start_date,
    p_recurring_end_date,
    case when p_is_recurring then p_recurring_auto_send else false end
  )
  returning id into v_invoice_id;

  v_idx := 0;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.invoice_line_items (
      invoice_id, description, quantity, unit_price, sort_order, qty_type
    )
    values (
      v_invoice_id,
      v_item->>'description',
      coalesce((v_item->>'quantity')::numeric, 1),
      coalesce((v_item->>'unit_price')::numeric, 0),
      v_idx,
      coalesce(v_item->>'qty_type', 'qty')
    );
    v_idx := v_idx + 1;
  end loop;

  return (
    v_invoice_id,
    v_invoice_number,
    p_client_id,
    v_client_name,
    v_subtotal,
    v_vat_amount,
    v_total,
    v_item_count,
    v_status
  );
end;
$$;

-- ============================================================
-- CREATE QUOTE WITH ITEMS  (allows null p_client_id)
-- ============================================================
create or replace function public.create_quote_with_items(
  p_client_id       uuid    default null,
  p_line_items      jsonb            ,
  p_notes           text    default null,
  p_internal_notes  text    default null,
  p_issue_date      date    default null,
  p_expiry_date     date    default null,
  p_status          text    default null,
  p_client_name     text    default null   -- display name for quick-client mode
)
returns public.quote_create_result
language plpgsql
as $$
declare
  v_quote_id        uuid;
  v_quote_number    text;
  v_subtotal        numeric := 0;
  v_vat_amount      numeric := 0;
  v_total           numeric := 0;
  v_item_count      integer := 0;
  v_item            jsonb;
  v_include_vat     boolean;
  v_validity_days   integer;
  v_issue_date      date;
  v_expiry_date     date;
  v_client_name     text;
  v_idx             integer := 0;
  v_status          text;
begin
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then
    raise exception 'At least one line item is required';
  end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
  end loop;

  if p_client_id is not null then
    select company_name into v_client_name
    from public.clients where id = p_client_id;

    if v_client_name is null then
      raise exception 'Client with id % does not exist', p_client_id;
    end if;
  else
    v_client_name := coalesce(p_client_name, 'Quick Client');
  end if;

  select coalesce(quote_include_year, false),
         coalesce(quote_validity_days, 30)
  into v_include_vat, v_validity_days
  from public.business_profile limit 1;

  v_quote_number := public.generate_quote_number();

  v_issue_date := coalesce(p_issue_date, current_date);
  v_expiry_date := coalesce(p_expiry_date, v_issue_date + (v_validity_days || ' days')::interval);
  v_status := coalesce(p_status, 'Draft');

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal
      + (coalesce((v_item->>'quantity')::numeric, 1)
         * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;

  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;

  insert into public.quotes (
    quote_number, client_id, issue_date, expiry_date, status,
    subtotal, vat_amount, total, notes, internal_notes
  )
  values (
    v_quote_number, p_client_id, v_issue_date, v_expiry_date, v_status,
    v_subtotal, v_vat_amount, v_total, p_notes, p_internal_notes
  )
  returning id into v_quote_id;

  v_idx := 0;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.quote_line_items (
      quote_id, description, quantity, unit_price, sort_order
    )
    values (
      v_quote_id,
      v_item->>'description',
      coalesce((v_item->>'quantity')::numeric, 1),
      coalesce((v_item->>'unit_price')::numeric, 0),
      v_idx
    );
    v_idx := v_idx + 1;
  end loop;

  return (
    v_quote_id,
    v_quote_number,
    p_client_id,
    v_client_name,
    v_subtotal,
    v_vat_amount,
    v_total,
    v_item_count,
    v_status
  );
end;
$$;

-- Force PostgREST to reload its schema cache so the updated
-- function signatures are immediately visible to the API layer.
notify pgrst, 'reload schema';
