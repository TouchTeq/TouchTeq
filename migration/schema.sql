create extension if not exists "pgcrypto";

create schema if not exists public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.business_profile (
  id uuid primary key default gen_random_uuid(),
  legal_name text,
  trading_name text,
  vat_number text,
  registration_number text,
  csd_number text,
  physical_address text,
  postal_address text,
  email text,
  phone text,
  logo_url text,
  payment_terms_days integer not null default 30,
  vat_rate numeric(5,4) not null default 0.15,
  vat_period_months integer not null default 2,
  vat_period_start_month integer not null default 2,
  currency text not null default 'ZAR',
  banking_details jsonb not null default '{}'::jsonb,
  credentials jsonb not null default '[]'::jsonb,
  document_settings jsonb not null default '{}'::jsonb,
  email_settings jsonb not null default '{}'::jsonb,
  email_templates jsonb not null default '{}'::jsonb,
  website text,
  opening_balance numeric(15,2) not null default 0,
  
  -- Document Numbering Settings
  invoice_prefix text not null default 'INV',
  invoice_starting_number integer not null default 1,
  invoice_include_year boolean not null default false,
  quote_prefix text not null default 'QT',
  quote_starting_number integer not null default 1,
  quote_include_year boolean not null default false,
  credit_note_prefix text not null default 'CN',
  credit_note_starting_number integer not null default 1,
  credit_note_include_year boolean not null default false,
  po_prefix text not null default 'PO',
  po_starting_number integer not null default 1,
  po_include_year boolean not null default false,
  cert_prefix text not null default 'CERT',
  cert_starting_number integer not null default 1,
  cert_include_year boolean not null default false,
  delivery_note_prefix text not null default 'DN',
  delivery_note_starting_number integer not null default 1,
  delivery_note_include_year boolean not null default false,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_person text,
  job_title text,
  email text,
  phone text,
  physical_address text,
  postal_address text,
  vat_number text,
  notes text,
  is_active boolean not null default true,
  category text,
  opening_balance numeric(15,2) not null default 0,
  email_missing boolean not null default false,
  last_contact_at timestamptz,
  last_contact_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_company_name_idx on public.clients (company_name);
create index if not exists clients_is_active_idx on public.clients (is_active);
create index if not exists clients_category_idx on public.clients (category);

create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  contact_type text not null check (contact_type in ('Technical', 'Finance', 'General')),
  full_name text not null,
  job_title text,
  email text,
  cell_number text,
  landline_number text,
  extension text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists client_contacts_client_id_idx on public.client_contacts (client_id);
create unique index if not exists client_contacts_one_primary_per_client
  on public.client_contacts (client_id)
  where is_primary;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  client_id uuid references public.clients (id) on delete set null,
  contact_id uuid references public.client_contacts (id) on delete set null,
  issue_date date not null default current_date,
  expiry_date date,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Accepted', 'Declined', 'Rejected', 'Expired', 'Converted', 'Issued')),
  subtotal numeric(15,2) not null default 0,
  vat_amount numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  notes text,
  internal_notes text,
  last_sent_at timestamptz,
  -- Quote Acceptance Feature
  acceptance_requested boolean not null default false,
  acceptance_status text check (acceptance_status in ('Pending', 'Accepted', 'Declined')) default 'Pending',
  accepted_at timestamptz,
  accepted_ip_address text,
  acceptance_record jsonb default '{}'::jsonb,
  decline_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_client_id_idx on public.quotes (client_id);
create index if not exists quotes_status_idx on public.quotes (status);
create index if not exists quotes_issue_date_idx on public.quotes (issue_date);
create index if not exists quotes_expiry_date_idx on public.quotes (expiry_date);

create table if not exists public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(15,2) not null default 0,
  vat_rate numeric(5,2) not null default 15,
  line_total numeric(15,2) not null default 0,
  qty_type text not null default 'qty',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists quote_line_items_quote_id_idx on public.quote_line_items (quote_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  quote_id uuid references public.quotes (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  contact_id uuid references public.client_contacts (id) on delete set null,
  issue_date date not null default current_date,
  due_date date,
  reference text,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled', 'Credit Note')),
  subtotal numeric(15,2) not null default 0,
  vat_amount numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  amount_paid numeric(15,2) not null default 0,
  balance_due numeric(15,2) not null default 0,
  notes text,
  internal_notes text,
  credit_note_id uuid,
  credit_status text not null default 'None' check (credit_status in ('None', 'Partially Credited', 'Fully Credited')),
  is_recurring boolean not null default false,
  recurring_frequency text check (recurring_frequency in ('weekly', 'monthly', 'quarterly', 'annually')),
  recurring_start_date date,
  recurring_end_date date,
  recurring_auto_send boolean not null default false,
  recurring_next_date date,
  recurring_parent_id uuid references public.invoices (id) on delete set null,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_client_id_idx on public.invoices (client_id);
create index if not exists invoices_quote_id_idx on public.invoices (quote_id);
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_issue_date_idx on public.invoices (issue_date);
create index if not exists invoices_due_date_idx on public.invoices (due_date);
create index if not exists invoices_recurring_idx
  on public.invoices (is_recurring, recurring_next_date)
  where is_recurring = true;

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(15,2) not null default 0,
  vat_rate numeric(5,2) not null default 15,
  line_total numeric(15,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists invoice_line_items_invoice_id_idx on public.invoice_line_items (invoice_id);

-- Delivery Notes Table
create table if not exists public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  delivery_note_number text not null unique,
  client_id uuid references public.clients (id) on delete set null,
  linked_invoice_id uuid references public.invoices (id) on delete set null,
  date_of_delivery date not null default current_date,
  delivery_address text,
  status text not null default 'Delivered' check (status in ('Delivered', 'Signed', 'Disputed')),
  delivered_by text default 'Thabo Matona',
  notes text,
  client_signed_document_url text,
  signed_date timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_notes_client_id_idx on public.delivery_notes (client_id);
create index if not exists delivery_notes_invoice_id_idx on public.delivery_notes (linked_invoice_id);
create index if not exists delivery_notes_status_idx on public.delivery_notes (status);

create table if not exists public.delivery_note_items (
  id uuid primary key default gen_random_uuid(),
  delivery_note_id uuid not null references public.delivery_notes (id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  condition text check (condition in ('New', 'Used', 'Repaired')) default 'New',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists delivery_note_items_delivery_note_id_idx on public.delivery_note_items (delivery_note_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  amount numeric(15,2) not null,
  payment_date date not null default current_date,
  payment_method text,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_invoice_id_idx on public.payments (invoice_id);
create index if not exists payments_client_id_idx on public.payments (client_id);
create index if not exists payments_payment_date_idx on public.payments (payment_date);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  supplier_name text,
  description text,
  category text,
  amount_inclusive numeric(15,2) not null default 0,
  vat_claimable boolean not null default true,
  vat_amount numeric(15,2) not null default 0,
  input_vat_amount numeric(15,2) not null default 0,
  amount_exclusive numeric(15,2) not null default 0,
  receipt_url text,
  notes text,
  payment_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_expense_date_idx on public.expenses (expense_date);
create index if not exists expenses_category_idx on public.expenses (category);
create index if not exists expenses_supplier_name_idx on public.expenses (supplier_name);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_description text not null,
  registration_number text not null unique,
  opening_odometer integer not null default 0,
  fuel_type text not null default 'Diesel' check (fuel_type in ('Petrol', 'Diesel', 'Electric', 'Hybrid')),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_vehicle_description_idx on public.vehicles (vehicle_description);
create index if not exists vehicles_is_active_idx on public.vehicles (is_active);
create unique index if not exists vehicles_one_default_idx
  on public.vehicles ((is_default))
  where is_default;

create table if not exists public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  supplier_name text,
  fuel_type text,
  litres numeric(10,2) not null default 0,
  price_per_litre numeric(12,2) not null default 0,
  total_amount numeric(15,2) not null default 0,
  odometer integer,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  receipt_url text,
  payment_method text,
  expense_id uuid references public.expenses (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fuel_logs_vehicle_id_idx on public.fuel_logs (vehicle_id);
create index if not exists fuel_logs_date_idx on public.fuel_logs (date);
create index if not exists fuel_logs_expense_id_idx on public.fuel_logs (expense_id);

create table if not exists public.travel_settings (
  id integer primary key default 1 check (id = 1),
  fuel_price_per_litre numeric(12,2) not null default 22.50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.travel_trips (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  from_location text not null,
  to_location text not null,
  odometer_start integer,
  odometer_end integer,
  distance_km numeric(10,2) not null default 0,
  purpose text,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  client_id uuid references public.clients (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists travel_trips_date_idx on public.travel_trips (date);
create index if not exists travel_trips_vehicle_id_idx on public.travel_trips (vehicle_id);
create index if not exists travel_trips_client_id_idx on public.travel_trips (client_id);

create table if not exists public.vat_periods (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  due_date date,
  input_vat numeric(15,2) not null default 0,
  output_vat numeric(15,2) not null default 0,
  net_vat_payable numeric(15,2) not null default 0,
  status text not null default 'Open' check (status in ('Open', 'Submitted', 'Paid')),
  submission_date date,
  payment_date date,
  reference_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vat_periods_date_range_chk check (period_end >= period_start)
);

create index if not exists vat_periods_period_dates_idx on public.vat_periods (period_start, period_end);
create index if not exists vat_periods_status_idx on public.vat_periods (status);
create index if not exists vat_periods_due_date_idx on public.vat_periods (due_date);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  client_id uuid references public.clients (id) on delete set null,
  certificate_type text not null,
  project_reference text,
  site_name text,
  site_address text,
  issue_date date,
  inspection_date date,
  next_inspection_date date,
  status text not null default 'Draft' check (status in ('Draft', 'Issued', 'Sent', 'Expired', 'Revoked')),
  engineer_name text,
  engineer_registration text,
  standards_referenced text,
  pass_fail_status boolean not null default true,
  notes text,
  document_data jsonb not null default '{}'::jsonb,
  supersedes_certificate_id uuid references public.certificates (id) on delete set null,
  last_sent_at timestamptz,
  -- Client Sign-off Feature
  require_client_sign_off boolean not null default false,
  client_signature_status text not null default 'Unsigned' check (client_signature_status in ('Unsigned', 'Signed')),
  client_signed_date timestamptz,
  client_signed_document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists certificates_client_id_idx on public.certificates (client_id);
create index if not exists certificates_certificate_type_idx on public.certificates (certificate_type);
create index if not exists certificates_status_idx on public.certificates (status);
create index if not exists certificates_issue_date_idx on public.certificates (issue_date);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  supplier_name text not null,
  supplier_contact text,
  supplier_email text,
  date_raised date not null default current_date,
  delivery_date date,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Acknowledged', 'Delivered', 'Cancelled')),
  linked_quote_id uuid references public.quotes (id) on delete set null,
  linked_invoice_id uuid references public.invoices (id) on delete set null,
  notes text,
  subtotal numeric(15,2) not null default 0,
  vat_amount numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchase_orders_status_idx on public.purchase_orders (status);
create index if not exists purchase_orders_supplier_name_idx on public.purchase_orders (supplier_name);
create index if not exists purchase_orders_linked_quote_idx on public.purchase_orders (linked_quote_id);
create index if not exists purchase_orders_linked_invoice_idx on public.purchase_orders (linked_invoice_id);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(15,2) not null default 0,
  line_total numeric(15,2) not null default 0,
  qty_type text not null default 'qty',
  created_at timestamptz not null default now()
);

create index if not exists purchase_order_items_po_id_idx on public.purchase_order_items (purchase_order_id);

create table if not exists public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  credit_note_number text,
  cn_number text,
  invoice_id uuid references public.invoices (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  issue_date date,
  date_issued date,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Issued', 'Applied', 'Cancelled')),
  reason text,
  subtotal numeric(15,2) not null default 0,
  vat_amount numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  notes text,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists credit_notes_credit_note_number_uq
  on public.credit_notes (credit_note_number)
  where credit_note_number is not null;
create unique index if not exists credit_notes_cn_number_uq
  on public.credit_notes (cn_number)
  where cn_number is not null;
create index if not exists credit_notes_invoice_id_idx on public.credit_notes (invoice_id);
create index if not exists credit_notes_client_id_idx on public.credit_notes (client_id);
create index if not exists credit_notes_status_idx on public.credit_notes (status);

alter table public.invoices
  add constraint invoices_credit_note_id_fkey
  foreign key (credit_note_id) references public.credit_notes (id) on delete set null;

create table if not exists public.credit_note_items (
  id uuid primary key default gen_random_uuid(),
  credit_note_id uuid not null references public.credit_notes (id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(15,2) not null default 0,
  vat_rate numeric(5,2) not null default 15,
  line_total numeric(15,2) not null default 0,
  invoice_item_id uuid references public.invoice_line_items (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists credit_note_items_credit_note_id_idx on public.credit_note_items (credit_note_id);
create index if not exists credit_note_items_invoice_item_id_idx on public.credit_note_items (invoice_item_id);

create table if not exists public.invoice_notifications (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists invoice_notifications_invoice_id_idx on public.invoice_notifications (invoice_id);
create index if not exists invoice_notifications_read_idx on public.invoice_notifications (read);

create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  certificate_id uuid references public.certificates (id) on delete set null,
  po_id uuid references public.purchase_orders (id) on delete set null,
  cn_id uuid references public.credit_notes (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  reminder_type text,
  type text,
  sent_to text,
  recipient_email text,
  subject text,
  body text,
  message text,
  status text not null default 'Sent',
  error_message text,
  days_overdue integer,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists reminder_logs_invoice_id_idx on public.reminder_logs (invoice_id);
create index if not exists reminder_logs_quote_id_idx on public.reminder_logs (quote_id);
create index if not exists reminder_logs_client_id_idx on public.reminder_logs (client_id);
create index if not exists reminder_logs_sent_at_idx on public.reminder_logs (sent_at desc);

create table if not exists public.client_communications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  timestamp timestamptz not null default now(),
  type text not null,
  subject text,
  sent_from text,
  status text default 'Delivered',
  content text,
  note_type text,
  metadata jsonb not null default '{}'::jsonb,
  is_manual boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists client_communications_client_id_idx on public.client_communications (client_id);
create index if not exists client_communications_timestamp_idx on public.client_communications (timestamp desc);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  key_name text not null unique,
  encrypted_value text not null,
  iv text not null,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.api_key_audit_log (
  id uuid primary key default gen_random_uuid(),
  key_name text not null,
  action text not null,
  performed_at timestamptz not null default now(),
  performed_by text,
  created_at timestamptz not null default now()
);

create index if not exists api_key_audit_log_key_name_idx on public.api_key_audit_log (key_name);
create index if not exists api_key_audit_log_performed_at_idx on public.api_key_audit_log (performed_at desc);

create or replace function public.sync_line_item_total()
returns trigger
language plpgsql
as $$
begin
  new.line_total = round(coalesce(new.quantity, 0) * coalesce(new.unit_price, 0), 2);
  return new;
end;
$$;

create or replace function public.sync_invoice_totals()
returns trigger
language plpgsql
as $$
begin
  new.amount_paid = coalesce(new.amount_paid, 0);
  new.balance_due = round(coalesce(new.total, 0) - coalesce(new.amount_paid, 0), 2);
  return new;
end;
$$;

create or replace function public.sync_expense_amounts()
returns trigger
language plpgsql
as $$
declare
  vat_component numeric(15,2);
begin
  if coalesce(new.vat_claimable, false) then
    vat_component = round((coalesce(new.amount_inclusive, 0) * 15) / 115, 2);
  else
    vat_component = 0;
  end if;

  new.input_vat_amount = vat_component;
  new.vat_amount = vat_component;
  new.amount_exclusive = round(coalesce(new.amount_inclusive, 0) - vat_component, 2);
  return new;
end;
$$;

create or replace function public.sync_credit_note_aliases()
returns trigger
language plpgsql
as $$
begin
  if new.credit_note_number is null then
    new.credit_note_number = new.cn_number;
  end if;
  if new.cn_number is null then
    new.cn_number = new.credit_note_number;
  end if;
  if new.issue_date is null then
    new.issue_date = new.date_issued;
  end if;
  if new.date_issued is null then
    new.date_issued = new.issue_date;
  end if;
  if new.issue_date is null then
    new.issue_date = current_date;
    new.date_issued = current_date;
  end if;
  return new;
end;
$$;

create or replace function public.ensure_single_default_vehicle()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.vehicles
    set is_default = false
    where id <> new.id
      and is_default = true;
  end if;
  return new;
end;
$$;

create or replace function public.sync_payment_client_id()
returns trigger
language plpgsql
as $$
begin
  if new.client_id is null and new.invoice_id is not null then
    select client_id into new.client_id
    from public.invoices
    where id = new.invoice_id;
  end if;
  return new;
end;
$$;

create or replace function public.refresh_invoice_payment_totals(p_invoice_id uuid)
returns void
language plpgsql
as $$
declare
  paid_total numeric(15,2);
  invoice_total numeric(15,2);
  next_status text;
begin
  if p_invoice_id is null then
    return;
  end if;

  select coalesce(sum(amount), 0) into paid_total
  from public.payments
  where invoice_id = p_invoice_id;

  select coalesce(total, 0) into invoice_total
  from public.invoices
  where id = p_invoice_id;

  if not found then
    return;
  end if;

  if paid_total <= 0 then
    next_status = null;
  elsif paid_total >= invoice_total then
    next_status = 'Paid';
  else
    next_status = 'Partially Paid';
  end if;

  update public.invoices
  set amount_paid = paid_total,
      balance_due = round(invoice_total - paid_total, 2),
      status = coalesce(next_status, status)
  where id = p_invoice_id;
end;
$$;

create or replace function public.after_payment_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_invoice_payment_totals(old.invoice_id);
    return old;
  end if;

  perform public.refresh_invoice_payment_totals(new.invoice_id);
  if tg_op = 'UPDATE' and old.invoice_id is distinct from new.invoice_id then
    perform public.refresh_invoice_payment_totals(old.invoice_id);
  end if;
  return new;
end;
$$;

create or replace function public.sync_vat_period_net()
returns trigger
language plpgsql
as $$
begin
  new.net_vat_payable = round(coalesce(new.output_vat, 0) - coalesce(new.input_vat, 0), 2);
  return new;
end;
$$;

create or replace function public.update_client_last_contact()
returns trigger
language plpgsql
as $$
begin
  update public.clients
  set last_contact_at = new.timestamp,
      last_contact_summary = case
        when new.is_manual then coalesce(new.note_type, 'Note') || ': ' || left(coalesce(new.content, ''), 50)
        else coalesce(new.type, 'Communication') || ': ' || coalesce(new.subject, '')
      end
  where id = new.client_id;

  return new;
end;
$$;

-- Document number generation — concurrency-safe via document_sequences table
-- See supabase/migrations/20260331_concurrency_safe_document_sequences.sql for the migration
-- that creates the table and seeds it. These functions are the canonical definitions.
--
-- Table schema:
--   document_sequences (doc_type, subtype, next_number, last_year, updated_at)
--   PK: (doc_type, subtype)
--
-- Design decisions:
--   - prefix and include_year are read from business_profile on EVERY call
--     so settings changes take effect immediately (no stale cached prefix)
--   - next_number resets to 1 when the calendar year changes (year rollover)
--   - certificates use subtype for per-type sequences (COC, COCW, etc.)

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

  select coalesce(invoice_prefix, 'QT'), coalesce(quote_include_year, false)
  into prefix_val, include_year_val from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'QT');
  include_year_val := coalesce(include_year_val, false);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

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

  select coalesce(invoice_prefix, 'INV'), coalesce(invoice_include_year, false)
  into prefix_val, include_year_val from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'INV');
  include_year_val := coalesce(include_year_val, false);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

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
  into prefix_val, include_year_val from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'CN');
  include_year_val := coalesce(include_year_val, true);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

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
  into prefix_val, include_year_val from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'PO');
  include_year_val := coalesce(include_year_val, true);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

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
  into prefix_val, include_year_val from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'DN');
  include_year_val := coalesce(include_year_val, false);

  if include_year_val then
    return prefix_val || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

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

  type_code := upper(coalesce(nullif(left(regexp_replace(coalesce(cert_type, 'general'), '[^a-zA-Z]', '', 'g'), 3), ''), 'GEN'));

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
  into prefix_val, include_year_val from public.business_profile limit 1;

  prefix_val := coalesce(prefix_val, 'CERT');
  include_year_val := coalesce(include_year_val, true);

  if include_year_val then
    return prefix_val || '-' || type_code || '-' || year_str || '-' || lpad(next_num::text, 4, '0');
  else
    return prefix_val || '-' || type_code || '-' || lpad(next_num::text, 4, '0');
  end if;
end;
$$;

-- ============================================================
-- ATOMIC DOCUMENT CREATION FUNCTIONS
-- Each function creates header + line items in one transaction.
-- If any step fails, the entire transaction rolls back.
-- See supabase/migrations/20260331_atomic_document_creation.sql
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

create or replace function public.create_invoice_with_items(
  p_client_id       uuid,
  p_line_items      jsonb,
  p_notes           text    default null,
  p_internal_notes  text    default null,
  p_is_recurring    boolean default false,
  p_recurring_freq  text    default null
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
begin
  if p_client_id is null then raise exception 'client_id is required'; end if;
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then raise exception 'At least one line item is required'; end if;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then raise exception 'Each line item must have a description'; end if;
  end loop;
  select company_name into v_client_name from public.clients where id = p_client_id;
  if v_client_name is null then raise exception 'Client with id % does not exist', p_client_id; end if;
  select coalesce(invoice_include_year, false), coalesce(invoice_payment_terms_days, 30)
  into v_include_vat, v_terms_days from public.business_profile limit 1;
  v_invoice_number := public.generate_invoice_number();
  v_issue_date := current_date;
  v_due_date := v_issue_date + (v_terms_days || ' days')::interval;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;
  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;
  insert into public.invoices (invoice_number, client_id, issue_date, due_date, status, subtotal, vat_amount, total, amount_paid, notes, internal_notes, is_recurring, recurring_frequency, recurring_next_date)
  values (v_invoice_number, p_client_id, v_issue_date, v_due_date, 'Draft', v_subtotal, v_vat_amount, v_total, 0, p_notes, p_internal_notes, p_is_recurring, p_recurring_freq, case when p_is_recurring then v_issue_date else null end)
  returning id into v_invoice_id;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.invoice_line_items (invoice_id, description, quantity, unit_price, sort_order)
    values (v_invoice_id, v_item->>'description', coalesce((v_item->>'quantity')::numeric, 1), coalesce((v_item->>'unit_price')::numeric, 0), v_idx);
    v_idx := v_idx + 1;
  end loop;
  return (v_invoice_id, v_invoice_number, p_client_id, v_client_name, v_subtotal, v_vat_amount, v_total, v_item_count, 'Draft');
end;
$$;

create or replace function public.create_quote_with_items(
  p_client_id       uuid,
  p_line_items      jsonb,
  p_notes           text default null,
  p_internal_notes  text default null
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
begin
  if p_client_id is null then raise exception 'client_id is required'; end if;
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then raise exception 'At least one line item is required'; end if;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then raise exception 'Each line item must have a description'; end if;
  end loop;
  select company_name into v_client_name from public.clients where id = p_client_id;
  if v_client_name is null then raise exception 'Client with id % does not exist', p_client_id; end if;
  select coalesce(quote_include_year, false), coalesce(quote_validity_days, 30)
  into v_include_vat, v_validity_days from public.business_profile limit 1;
  v_quote_number := public.generate_quote_number();
  v_issue_date := current_date;
  v_expiry_date := v_issue_date + (v_validity_days || ' days')::interval;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;
  v_vat_amount := case when v_include_vat then v_subtotal * 0.15 else 0 end;
  v_total := v_subtotal + v_vat_amount;
  insert into public.quotes (quote_number, client_id, issue_date, expiry_date, status, subtotal, vat_amount, total, notes, internal_notes)
  values (v_quote_number, p_client_id, v_issue_date, v_expiry_date, 'Draft', v_subtotal, v_vat_amount, v_total, p_notes, p_internal_notes)
  returning id into v_quote_id;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.quote_line_items (quote_id, description, quantity, unit_price, sort_order)
    values (v_quote_id, v_item->>'description', coalesce((v_item->>'quantity')::numeric, 1), coalesce((v_item->>'unit_price')::numeric, 0), v_idx);
    v_idx := v_idx + 1;
  end loop;
  return (v_quote_id, v_quote_number, p_client_id, v_client_name, v_subtotal, v_vat_amount, v_total, v_item_count, 'Draft');
end;
$$;

create or replace function public.create_purchase_order_with_items(
  p_supplier_name   text,
  p_line_items      jsonb,
  p_notes           text default null,
  p_date_raised     date   default null
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
begin
  if p_supplier_name is null or trim(p_supplier_name) = '' then raise exception 'supplier_name is required'; end if;
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then raise exception 'At least one line item is required'; end if;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then raise exception 'Each line item must have a description'; end if;
  end loop;
  v_po_number := public.generate_po_number();
  v_raise_date := coalesce(p_date_raised, current_date);
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;
  v_vat_amount := v_subtotal * 0.15;
  v_total := v_subtotal + v_vat_amount;
  insert into public.purchase_orders (po_number, supplier_name, date_raised, status, subtotal, vat_amount, total, notes)
  values (v_po_number, p_supplier_name, v_raise_date, 'Draft', v_subtotal, v_vat_amount, v_total, p_notes)
  returning id into v_po_id;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.purchase_order_items (purchase_order_id, description, quantity, unit_price, line_total)
    values (v_po_id, v_item->>'description', coalesce((v_item->>'quantity')::numeric, 1), coalesce((v_item->>'unit_price')::numeric, 0), coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_idx := v_idx + 1;
  end loop;
  return (v_po_id, v_po_number, p_supplier_name, v_subtotal, v_vat_amount, v_total, v_item_count, 'Draft');
end;
$$;

create or replace function public.create_credit_note_with_items(
  p_client_id       uuid,
  p_line_items      jsonb,
  p_reason          text default null,
  p_notes           text default null
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
begin
  if p_client_id is null then raise exception 'client_id is required'; end if;
  if p_line_items is null or jsonb_array_length(p_line_items) = 0 then raise exception 'At least one line item is required'; end if;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    if v_item->>'description' is null or trim(v_item->>'description') = '' then raise exception 'Each line item must have a description'; end if;
  end loop;
  select company_name into v_client_name from public.clients where id = p_client_id;
  if v_client_name is null then raise exception 'Client with id % does not exist', p_client_id; end if;
  v_cn_number := public.generate_credit_note_number();
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    v_subtotal := v_subtotal + (coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_item_count := v_item_count + 1;
  end loop;
  v_vat_amount := v_subtotal * 0.15;
  v_total := v_subtotal + v_vat_amount;
  insert into public.credit_notes (cn_number, client_id, date_issued, status, subtotal, vat_amount, total, reason, notes)
  values (v_cn_number, p_client_id, current_date, 'Draft', v_subtotal, v_vat_amount, v_total, p_reason, p_notes)
  returning id into v_cn_id;
  for v_item in select * from jsonb_array_elements(p_line_items) loop
    insert into public.credit_note_items (credit_note_id, description, quantity, unit_price, line_total)
    values (v_cn_id, v_item->>'description', coalesce((v_item->>'quantity')::numeric, 1), coalesce((v_item->>'unit_price')::numeric, 0), coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'unit_price')::numeric, 0));
    v_idx := v_idx + 1;
  end loop;
  return (v_cn_id, v_cn_number, p_client_id, v_client_name, v_subtotal, v_vat_amount, v_total, v_item_count, 'Draft');
end;
$$;

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists business_profile_set_updated_at on public.business_profile;
create trigger business_profile_set_updated_at
before update on public.business_profile
for each row execute function public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

drop trigger if exists fuel_logs_set_updated_at on public.fuel_logs;
create trigger fuel_logs_set_updated_at
before update on public.fuel_logs
for each row execute function public.set_updated_at();

drop trigger if exists travel_settings_set_updated_at on public.travel_settings;
create trigger travel_settings_set_updated_at
before update on public.travel_settings
for each row execute function public.set_updated_at();

drop trigger if exists travel_trips_set_updated_at on public.travel_trips;
create trigger travel_trips_set_updated_at
before update on public.travel_trips
for each row execute function public.set_updated_at();

drop trigger if exists vat_periods_set_updated_at on public.vat_periods;
create trigger vat_periods_set_updated_at
before update on public.vat_periods
for each row execute function public.set_updated_at();

drop trigger if exists certificates_set_updated_at on public.certificates;
create trigger certificates_set_updated_at
before update on public.certificates
for each row execute function public.set_updated_at();

drop trigger if exists purchase_orders_set_updated_at on public.purchase_orders;
create trigger purchase_orders_set_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();

drop trigger if exists credit_notes_set_updated_at on public.credit_notes;
create trigger credit_notes_set_updated_at
before update on public.credit_notes
for each row execute function public.set_updated_at();

drop trigger if exists quote_line_items_sync_total on public.quote_line_items;
create trigger quote_line_items_sync_total
before insert or update on public.quote_line_items
for each row execute function public.sync_line_item_total();

drop trigger if exists invoice_line_items_sync_total on public.invoice_line_items;
create trigger invoice_line_items_sync_total
before insert or update on public.invoice_line_items
for each row execute function public.sync_line_item_total();

drop trigger if exists purchase_order_items_sync_total on public.purchase_order_items;
create trigger purchase_order_items_sync_total
before insert or update on public.purchase_order_items
for each row execute function public.sync_line_item_total();

drop trigger if exists credit_note_items_sync_total on public.credit_note_items;
create trigger credit_note_items_sync_total
before insert or update on public.credit_note_items
for each row execute function public.sync_line_item_total();

drop trigger if exists invoices_sync_totals on public.invoices;
create trigger invoices_sync_totals
before insert or update on public.invoices
for each row execute function public.sync_invoice_totals();

drop trigger if exists expenses_sync_amounts on public.expenses;
create trigger expenses_sync_amounts
before insert or update on public.expenses
for each row execute function public.sync_expense_amounts();

drop trigger if exists credit_notes_sync_aliases on public.credit_notes;
create trigger credit_notes_sync_aliases
before insert or update on public.credit_notes
for each row execute function public.sync_credit_note_aliases();

drop trigger if exists vehicles_single_default on public.vehicles;
create trigger vehicles_single_default
before insert or update on public.vehicles
for each row execute function public.ensure_single_default_vehicle();

drop trigger if exists payments_sync_client_id on public.payments;
create trigger payments_sync_client_id
before insert or update on public.payments
for each row execute function public.sync_payment_client_id();

drop trigger if exists payments_after_change on public.payments;
create trigger payments_after_change
after insert or update or delete on public.payments
for each row execute function public.after_payment_change();

drop trigger if exists vat_periods_sync_net on public.vat_periods;
create trigger vat_periods_sync_net
before insert or update on public.vat_periods
for each row execute function public.sync_vat_period_net();

drop trigger if exists update_client_last_contact_trigger on public.client_communications;
create trigger update_client_last_contact_trigger
after insert on public.client_communications
for each row execute function public.update_client_last_contact();

alter table public.business_profile enable row level security;
alter table public.clients enable row level security;
alter table public.client_contacts enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_line_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.vehicles enable row level security;
alter table public.fuel_logs enable row level security;
alter table public.travel_settings enable row level security;
alter table public.travel_trips enable row level security;
alter table public.vat_periods enable row level security;
alter table public.certificates enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.credit_notes enable row level security;
alter table public.credit_note_items enable row level security;
alter table public.invoice_notifications enable row level security;
alter table public.reminder_logs enable row level security;
alter table public.client_communications enable row level security;
alter table public.api_keys enable row level security;
alter table public.api_key_audit_log enable row level security;

drop policy if exists "Authenticated full access" on public.client_contacts;
create policy "Authenticated full access" on public.client_contacts
  for all to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated full access business_profile" on public.business_profile;
create policy "Authenticated full access business_profile" on public.business_profile
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access clients" on public.clients;
create policy "Authenticated full access clients" on public.clients
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access quotes" on public.quotes;
create policy "Authenticated full access quotes" on public.quotes
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access quote_line_items" on public.quote_line_items;
create policy "Authenticated full access quote_line_items" on public.quote_line_items
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access invoices" on public.invoices;
create policy "Authenticated full access invoices" on public.invoices
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access invoice_line_items" on public.invoice_line_items;
create policy "Authenticated full access invoice_line_items" on public.invoice_line_items
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access payments" on public.payments;
create policy "Authenticated full access payments" on public.payments
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access expenses" on public.expenses;
create policy "Authenticated full access expenses" on public.expenses
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access vehicles" on public.vehicles;
create policy "Authenticated full access vehicles" on public.vehicles
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access fuel_logs" on public.fuel_logs;
create policy "Authenticated full access fuel_logs" on public.fuel_logs
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access travel_settings" on public.travel_settings;
create policy "Authenticated full access travel_settings" on public.travel_settings
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access travel_trips" on public.travel_trips;
create policy "Authenticated full access travel_trips" on public.travel_trips
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access vat_periods" on public.vat_periods;
create policy "Authenticated full access vat_periods" on public.vat_periods
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access certificates" on public.certificates;
create policy "Authenticated full access certificates" on public.certificates
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access purchase_orders" on public.purchase_orders;
create policy "Authenticated full access purchase_orders" on public.purchase_orders
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access purchase_order_items" on public.purchase_order_items;
create policy "Authenticated full access purchase_order_items" on public.purchase_order_items
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access credit_notes" on public.credit_notes;
create policy "Authenticated full access credit_notes" on public.credit_notes
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access credit_note_items" on public.credit_note_items;
create policy "Authenticated full access credit_note_items" on public.credit_note_items
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access invoice_notifications" on public.invoice_notifications;
create policy "Authenticated full access invoice_notifications" on public.invoice_notifications
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access reminder_logs" on public.reminder_logs;
create policy "Authenticated full access reminder_logs" on public.reminder_logs
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access client_communications" on public.client_communications;
create policy "Authenticated full access client_communications" on public.client_communications
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access api_keys" on public.api_keys;
create policy "Authenticated full access api_keys" on public.api_keys
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access api_key_audit_log" on public.api_key_audit_log;
create policy "Authenticated full access api_key_audit_log" on public.api_key_audit_log
  for all to authenticated using (true) with check (true);

create or replace view public.quote_items as
select * from public.quote_line_items;

create or replace view public.invoice_items as
select * from public.invoice_line_items;

create or replace view public.travel_logs as
select * from public.travel_trips;

create or replace view public.settings as
select * from public.business_profile;

create or replace view public.fuel_purchases as
select * from public.fuel_logs;
