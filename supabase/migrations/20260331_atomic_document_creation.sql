-- Migration: Atomic document creation functions
-- Date: 2026-03-31
--
-- Problem:
--   Document creation inserts a header row first, then line items in a
--   separate call. If the line-item insert fails the header remains as an
--   orphaned partial record.
--
-- Solution:
--   Create one PL/pgSQL function per document type that performs the entire
--   create flow inside a single implicit transaction. If any step raises an
--   exception, Postgres automatically rolls back everything.
--
-- Each function:
--   1. Validates inputs (raises exception on failure)
--   2. Calls generate_*_number() for the document number
--   3. Reads business_profile settings for defaults
--   4. Inserts the header
--   5. Inserts all line items
--   6. Returns a JSON object with id, document_number, totals, item_count

-- ============================================================
-- TYPE DEFINITIONS for return values
-- ============================================================

create type public.invoice_create_result as (
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

create type public.quote_create_result as (
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

-- ============================================================
-- Line item input type (generic JSONB array passed as parameter)
-- Each item: {"description": "...", "quantity": N, "unit_price": N}
-- ============================================================

-- ============================================================
-- CREATE INVOICE WITH ITEMS
-- ============================================================
create or replace function public.create_invoice_with_items(
  p_client_id              uuid,
  p_line_items             jsonb,          -- array of {description, quantity, unit_price}
  p_notes                  text    default null,
  p_internal_notes         text    default null,
  p_is_recurring           boolean default false,
  p_recurring_freq         text    default null,
  p_issue_date             date    default null,
  p_due_date               date    default null,
  p_status                 text    default null,
  p_recurring_start_date   date    default null,
  p_recurring_end_date     date    default null,
  p_recurring_auto_send    boolean default false
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
  if p_client_id is null then
    raise exception 'client_id is required';
  end if;

  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then
    raise exception 'At least one line item is required';
  end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
  end loop;

  select company_name into v_client_name
  from public.clients where id = p_client_id;

  if v_client_name is null then
    raise exception 'Client with id % does not exist', p_client_id;
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
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
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
-- CREATE QUOTE WITH ITEMS
-- ============================================================
create or replace function public.create_quote_with_items(
  p_client_id       uuid,
  p_line_items      jsonb,
  p_notes           text default null,
  p_internal_notes  text default null,
  p_issue_date      date default null,
  p_expiry_date     date default null,
  p_status          text default null
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
  if p_client_id is null then
    raise exception 'client_id is required';
  end if;

  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then
    raise exception 'At least one line item is required';
  end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
  end loop;

  select company_name into v_client_name
  from public.clients where id = p_client_id;

  if v_client_name is null then
    raise exception 'Client with id % does not exist', p_client_id;
  end if;

  select coalesce(quote_include_year, false),
         coalesce(quote_validity_days, 30)
  into v_include_vat, v_validity_days
  from public.business_profile limit 1;

  v_quote_number := public.generate_quote_number();

  v_issue_date := coalesce(p_issue_date, current_date);
  select coalesce(quote_validity_days, 30) into v_validity_days
  from public.business_profile limit 1;
  v_expiry_date := coalesce(p_expiry_date, v_issue_date + (v_validity_days || ' days')::interval);
  v_status := coalesce(p_status, 'Draft');

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;

  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;

  insert into public.quotes (quote_number, client_id, issue_date, expiry_date, status, subtotal, vat_amount, total, notes, internal_notes)
  values (v_quote_number, p_client_id, v_issue_date, v_expiry_date, v_status, v_subtotal, v_vat_amount, v_total, p_notes, p_internal_notes)
  returning id into v_quote_id;

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
    'Draft'
  );
end;
$$;

-- ============================================================
-- CREATE PURCHASE ORDER WITH ITEMS
-- ============================================================
create or replace function public.create_purchase_order_with_items(
  p_supplier_name   text,
  p_line_items      jsonb,
  p_notes           text default null,
  p_date_raised     date   default null,
  p_status          text   default null,
  p_supplier_contact text default null,
  p_supplier_email  text default null,
  p_delivery_date   date   default null,
  p_linked_quote_id uuid   default null,
  p_linked_invoice_id uuid default null
)
returns public.po_create_result
language plpgsql
as $$
declare
  v_po_id           uuid;
  v_po_number       text;
  v_subtotal        numeric := 0;
  v_vat_amount      numeric := 0;
  v_total           numeric := 0;
  v_item_count      integer := 0;
  v_item            jsonb;
  v_raise_date      date;
  v_idx             integer := 0;
  v_include_vat     boolean;
begin
  if p_supplier_name is null or trim(p_supplier_name) = '' then
    raise exception 'supplier_name is required';
  end if;

  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then
    raise exception 'At least one line item is required';
  end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
  end loop;

  select coalesce(po_include_vat, true) into v_include_vat from public.business_profile limit 1;

  v_po_number := public.generate_po_number();

  v_raise_date := coalesce(p_date_raised, current_date);

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;

  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;

  insert into public.purchase_orders (po_number, supplier_name, date_raised, status, subtotal, vat_amount, total, notes, supplier_contact, supplier_email, delivery_date, linked_quote_id, linked_invoice_id)
  values (v_po_number, p_supplier_name, v_raise_date, coalesce(p_status, 'Draft'), v_subtotal, v_vat_amount, v_total, p_notes, p_supplier_contact, p_supplier_email, p_delivery_date, p_linked_quote_id, p_linked_invoice_id)
  returning id into v_po_id;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.purchase_order_items (
      purchase_order_id, description, quantity, unit_price, line_total
    )
    values (
      v_po_id,
      v_item->>'description',
      coalesce((v_item->>'quantity')::numeric, 1),
      coalesce((v_item->>'unit_price')::numeric, 0),
      coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0)
    );
    v_idx := v_idx + 1;
  end loop;

  return (
    v_po_id,
    v_po_number,
    p_supplier_name,
    v_subtotal,
    v_vat_amount,
    v_total,
    v_item_count,
    'Draft'
  );
end;
$$;

-- ============================================================
-- CREATE CREDIT NOTE WITH ITEMS
-- ============================================================
create or replace function public.create_credit_note_with_items(
  p_client_id       uuid,
  p_line_items      jsonb,
  p_reason          text default null,
  p_notes           text default null,
  p_invoice_id      uuid default null,
  p_issue_date      date default null,
  p_status          text default null
)
returns public.credit_note_create_result
language plpgsql
as $$
declare
  v_cn_id           uuid;
  v_cn_number       text;
  v_subtotal        numeric := 0;
  v_vat_amount      numeric := 0;
  v_total           numeric := 0;
  v_item_count      integer := 0;
  v_item            jsonb;
  v_client_name     text;
  v_idx             integer := 0;
  v_issue_date      date;
  v_status          text;
  v_include_vat     boolean;
begin
  if p_client_id is null then
    raise exception 'client_id is required';
  end if;

  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then
    raise exception 'At least one line item is required';
  end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
  end loop;

  select company_name into v_client_name
  from public.clients where id = p_client_id;

  if v_client_name is null then
    raise exception 'Client with id % does not exist', p_client_id;
  end if;

  select coalesce(cn_include_vat, true) into v_include_vat from public.business_profile limit 1;

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
    cn_number, client_id, date_issued, issue_date, status,
    subtotal, vat_amount, total, reason, notes, invoice_id
  )
  values (
    v_cn_number, p_client_id, v_issue_date, v_issue_date, v_status,
    v_subtotal, v_vat_amount, v_total, p_reason, p_notes, p_invoice_id
  )
  returning id into v_cn_id;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.credit_note_items (
      credit_note_id, description, quantity, unit_price, line_total,
      vat_rate, invoice_item_id
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
    v_idx := v_idx + 1;
  end loop;

  return (
    v_cn_id,
    v_cn_number,
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
-- ATOMIC UPDATE FUNCTIONS FOR EDIT FLOWS
-- Each function replaces header + delete-all-items + reinsert
-- with a single transaction.
-- ============================================================

create or replace function public.update_invoice_with_items(
  p_invoice_id       uuid,
  p_client_id        uuid,
  p_line_items       jsonb,
  p_issue_date       date    default null,
  p_due_date         date    default null,
  p_status           text    default null,
  p_notes            text    default null,
  p_internal_notes   text    default null,
  p_reference        text    default null
)
returns public.invoice_create_result
language plpgsql
as $$
declare
  v_invoice_number  text;
  v_subtotal        numeric := 0;
  v_vat_amount      numeric := 0;
  v_total           numeric := 0;
  v_item_count      integer := 0;
  v_item            jsonb;
  v_include_vat     boolean;
  v_client_name     text;
  v_idx             integer := 0;
begin
  if p_invoice_id is null then raise exception 'invoice_id is required'; end if;
  if p_client_id is null then raise exception 'client_id is required'; end if;
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then raise exception 'At least one line item is required'; end if;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then
      raise exception 'Each line item must have a description';
    end if;
  end loop;

  select company_name into v_client_name from public.clients where id = p_client_id;
  if v_client_name is null then raise exception 'Client with id % does not exist', p_client_id; end if;

  select coalesce(invoice_include_year, false) into v_include_vat from public.business_profile limit 1;

  select invoice_number into v_invoice_number from public.invoices where id = p_invoice_id;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;

  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;

  update public.invoices set
    client_id = p_client_id,
    issue_date = coalesce(p_issue_date, issue_date),
    due_date = coalesce(p_due_date, due_date),
    status = coalesce(p_status, status),
    subtotal = v_subtotal,
    vat_amount = v_vat_amount,
    total = v_total,
    notes = coalesce(p_notes, notes),
    internal_notes = coalesce(p_internal_notes, internal_notes),
    reference = coalesce(p_reference, reference),
    updated_at = now()
  where id = p_invoice_id;

  delete from public.invoice_line_items where invoice_id = p_invoice_id;

  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.invoice_line_items (invoice_id, description, quantity, unit_price, sort_order, qty_type)
    values (
      p_invoice_id,
      v_item->>'description',
      coalesce((v_item->>'quantity')::numeric, 1),
      coalesce((v_item->>'unit_price')::numeric, 0),
      v_idx,
      coalesce(v_item->>'qty_type', 'qty')
    );
    v_idx := v_idx + 1;
  end loop;

  return (p_invoice_id, v_invoice_number, p_client_id, v_client_name, v_subtotal, v_vat_amount, v_total, v_item_count, coalesce(p_status, 'Draft'));
end;
$$;

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
    insert into public.quote_line_items (quote_id, description, quantity, unit_price, sort_order)
    values (
      p_quote_id,
      v_item->>'description',
      coalesce((v_item->>'quantity')::numeric, 1),
      coalesce((v_item->>'unit_price')::numeric, 0),
      v_idx
    );
    v_idx := v_idx + 1;
  end loop;

  return (p_quote_id, v_quote_number, p_client_id, v_client_name, v_subtotal, v_vat_amount, v_total, v_item_count, coalesce(p_status, 'Draft'));
end;
$$;
