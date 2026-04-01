-- Migration: Concurrency-safe document number generation (v2)
-- Date: 2026-03-31
--
-- Risks addressed:
--   1. Prefix staleness — prefix/include_year are read from business_profile on
--      EVERY call, not cached in the sequence table. The table only stores
--      next_number.
--   2. Certificate numbering — get_next_certificate_number() now uses the same
--      sequence table with a composite key (doc_type, subtype).
--   3. Year rollover — next_number resets to 1 when the year changes (detected
--      by comparing stored last_year against current year).
--
-- Format:
--   {prefix}-{year}-{NNNN}  when include_year = true
--   {prefix}-{NNNN}          when include_year = false
--   NNNN is zero-padded to 4 digits minimum (grows naturally for larger numbers)

-- Step 1: Create the sequence table (number-only, no cached prefix)
create table if not exists public.document_sequences (
  doc_type    text not null,
  subtype     text not null default '',
  next_number integer not null default 1,
  last_year   integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (doc_type, subtype)
);

comment on table public.document_sequences is
  'Atomically incremented counters for document number generation. Prefix and include_year
   are read from business_profile on each call so settings changes take effect immediately.
   next_number resets to 1 when the calendar year changes.';

-- Step 2: Seed from existing data
-- Invoice sequence
do $$
declare
  max_inv integer;
begin
  select coalesce(
    (select max(
      case
        when invoice_number ~ 'INV-\d{4}-\d+$' then (regexp_match(invoice_number, 'INV-\d{4}-(\d+)$'))[1]::int
        when invoice_number ~ 'INV-\d+$' then (regexp_match(invoice_number, 'INV-(\d+)$'))[1]::int
        else 0
      end
    ) from public.invoices), 0
  ) into max_inv;

  insert into public.document_sequences (doc_type, subtype, next_number, last_year)
  values ('invoice', '', max_inv + 1, extract(year from current_date)::int)
  on conflict (doc_type, subtype) do nothing;
end $$;

-- Quote sequence
do $$
declare
  max_qt integer;
begin
  select coalesce(
    (select max(
      case
        when quote_number ~ 'QT-\d{4}-\d+$' then (regexp_match(quote_number, 'QT-\d{4}-(\d+)$'))[1]::int
        when quote_number ~ 'QT-\d+$' then (regexp_match(quote_number, 'QT-(\d+)$'))[1]::int
        else 0
      end
    ) from public.quotes), 0
  ) into max_qt;

  insert into public.document_sequences (doc_type, subtype, next_number, last_year)
  values ('quote', '', max_qt + 1, extract(year from current_date)::int)
  on conflict (doc_type, subtype) do nothing;
end $$;

-- Purchase order sequence
do $$
declare
  max_po integer;
begin
  select coalesce(
    (select max(
      case
        when po_number ~ 'PO-\d{4}-\d+$' then (regexp_match(po_number, 'PO-\d{4}-(\d+)$'))[1]::int
        when po_number ~ 'PO-\d+$' then (regexp_match(po_number, 'PO-(\d+)$'))[1]::int
        else 0
      end
    ) from public.purchase_orders), 0
  ) into max_po;

  insert into public.document_sequences (doc_type, subtype, next_number, last_year)
  values ('purchase_order', '', max_po + 1, extract(year from current_date)::int)
  on conflict (doc_type, subtype) do nothing;
end $$;

-- Credit note sequence
do $$
declare
  max_cn integer;
begin
  select coalesce(
    (select max(
      case
        when cn_number ~ 'CN-\d{4}-\d+$' then (regexp_match(cn_number, 'CN-\d{4}-(\d+)$'))[1]::int
        when cn_number ~ 'CN-\d+$' then (regexp_match(cn_number, 'CN-(\d+)$'))[1]::int
        else 0
      end
    ) from public.credit_notes), 0
  ) into max_cn;

  insert into public.document_sequences (doc_type, subtype, next_number, last_year)
  values ('credit_note', '', max_cn + 1, extract(year from current_date)::int)
  on conflict (doc_type, subtype) do nothing;
end $$;

-- Delivery note sequence
do $$
declare
  max_dn integer;
begin
  select coalesce(
    (select max(
      case
        when delivery_note_number ~ 'DN-\d{4}-\d+$' then (regexp_match(delivery_note_number, 'DN-\d{4}-(\d+)$'))[1]::int
        when delivery_note_number ~ 'DN-\d+$' then (regexp_match(delivery_note_number, 'DN-(\d+)$'))[1]::int
        else 0
      end
    ) from public.delivery_notes), 0
  ) into max_dn;

  insert into public.document_sequences (doc_type, subtype, next_number, last_year)
  values ('delivery_note', '', max_dn + 1, extract(year from current_date)::int)
  on conflict (doc_type, subtype) do nothing;
end $$;

-- Certificate sequences — one row per certificate type
do $$
declare
  cert record;
  max_cert integer;
  type_code text;
begin
  for cert in select distinct certificate_type from public.certificates where certificate_type is not null loop
    type_code := upper(coalesce(nullif(left(regexp_replace(cert.certificate_type, '[^a-zA-Z]', '', 'g'), 3), ''), 'GEN'));

    select coalesce(
      (select max(
        case
          when certificate_number ~ 'CERT-' || type_code || '-\d{4}-\d+$'
            then (regexp_match(certificate_number, 'CERT-' || type_code || '-\d{4}-(\d+)$'))[1]::int
          when certificate_number ~ 'CERT-' || type_code || '-\d+$'
            then (regexp_match(certificate_number, 'CERT-' || type_code || '-(\d+)$'))[1]::int
          else 0
        end
      ) from public.certificates
      where certificate_type = cert.certificate_type), 0
    ) into max_cert;

    insert into public.document_sequences (doc_type, subtype, next_number, last_year)
    values ('certificate', type_code, max_cert + 1, extract(year from current_date)::int)
    on conflict (doc_type, subtype) do nothing;
  end loop;
end $$;

-- Step 3: Rewrite all generate functions

-- Generate invoice number
create or replace function public.generate_invoice_number()
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

  -- Atomic increment with year rollover detection
  update public.document_sequences
  set next_number = case when last_year = current_year then next_number + 1 else 1 end,
      last_year = current_year,
      updated_at = now()
  where doc_type = 'invoice' and subtype = ''
  returning next_number into next_num;

  row_exists := found;

  if not row_exists then
    insert into public.document_sequences (doc_type, subtype, next_number, last_year)
    values ('invoice', '', 1, current_year)
    returning next_number into next_num;
  end if;

  -- Read prefix/settings from business_profile on every call (never stale)
  select coalesce(invoice_prefix, 'INV'), coalesce(invoice_include_year, false)
  into prefix_val, include_year_val
  from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'INV');
  include_year_val := coalesce(include_year_val, false);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

-- Generate quote number
create or replace function public.generate_quote_number()
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
  where doc_type = 'quote' and subtype = ''
  returning next_number into next_num;

  row_exists := found;

  if not row_exists then
    insert into public.document_sequences (doc_type, subtype, next_number, last_year)
    values ('quote', '', 1, current_year)
    returning next_number into next_num;
  end if;

  select coalesce(quote_prefix, 'QT'), coalesce(quote_include_year, false)
  into prefix_val, include_year_val
  from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'QT');
  include_year_val := coalesce(include_year_val, false);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

-- Generate purchase order number
create or replace function public.generate_po_number()
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
  where doc_type = 'purchase_order' and subtype = ''
  returning next_number into next_num;

  row_exists := found;

  if not row_exists then
    insert into public.document_sequences (doc_type, subtype, next_number, last_year)
    values ('purchase_order', '', 1, current_year)
    returning next_number into next_num;
  end if;

  select coalesce(po_prefix, 'PO'), coalesce(po_include_year, true)
  into prefix_val, include_year_val
  from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'PO');
  include_year_val := coalesce(include_year_val, true);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

-- Generate credit note number
create or replace function public.generate_credit_note_number()
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
  where doc_type = 'credit_note' and subtype = ''
  returning next_number into next_num;

  row_exists := found;

  if not row_exists then
    insert into public.document_sequences (doc_type, subtype, next_number, last_year)
    values ('credit_note', '', 1, current_year)
    returning next_number into next_num;
  end if;

  select coalesce(credit_note_prefix, 'CN'), coalesce(credit_note_include_year, true)
  into prefix_val, include_year_val
  from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'CN');
  include_year_val := coalesce(include_year_val, true);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

-- Generate delivery note number
create or replace function public.generate_delivery_note_number()
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

-- Generate certificate number (with subtype support)
create or replace function public.get_next_certificate_number(cert_type text default null)
returns text
language plpgsql
as $$
declare
  next_num integer;
  prefix_val text;
  include_year_val boolean;
  year_str text;
  current_year integer;
  type_code text;
  row_exists boolean;
begin
  current_year := extract(year from current_date)::int;
  year_str := current_year::text;

  -- Derive type code from cert_type parameter
  type_code := upper(coalesce(nullif(left(regexp_replace(coalesce(cert_type, 'general'), '[^a-zA-Z]', '', 'g'), 3), ''), 'GEN'));

  -- Atomic increment with year rollover for this specific cert type
  update public.document_sequences
  set next_number = case when last_year = current_year then next_number + 1 else 1 end,
      last_year = current_year,
      updated_at = now()
  where doc_type = 'certificate' and subtype = type_code
  returning next_number into next_num;

  row_exists := found;

  if not row_exists then
    insert into public.document_sequences (doc_type, subtype, next_number, last_year)
    values ('certificate', type_code, 1, current_year)
    returning next_number into next_num;
  end if;

  select coalesce(cert_prefix, 'CERT'), coalesce(cert_include_year, true)
  into prefix_val, include_year_val
  from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'CERT');
  include_year_val := coalesce(include_year_val, true);

  if include_year_val then
    return prefix_val || '-' || type_code || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || type_code || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

-- Step 4: RLS
alter table public.document_sequences enable row level security;

drop policy if exists "Service role can manage document sequences" on public.document_sequences;
create policy "Service role can manage document sequences"
  on public.document_sequences
  for all
  using (true)
  with check (true);

-- Step 5: Unique constraints (defensive safety net)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_invoice_number_key') then
    alter table public.invoices add constraint invoices_invoice_number_key unique (invoice_number);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'quotes_quote_number_key') then
    alter table public.quotes add constraint quotes_quote_number_key unique (quote_number);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'purchase_orders_po_number_key') then
    alter table public.purchase_orders add constraint purchase_orders_po_number_key unique (po_number);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'credit_notes_cn_number_key') then
    alter table public.credit_notes add constraint credit_notes_cn_number_key unique (cn_number);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'delivery_notes_delivery_note_number_key') then
    alter table public.delivery_notes add constraint delivery_notes_delivery_note_number_key unique (delivery_note_number);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'certificates_certificate_number_key') then
    alter table public.certificates add constraint certificates_certificate_number_key unique (certificate_number);
  end if;
end $$;
