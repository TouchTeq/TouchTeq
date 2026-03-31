-- Migration: Sync missing schema to Supabase
-- Date: 2026-03-30
-- Adds:
--   1. delivery_notes + delivery_note_items tables
--   2. Document numbering columns on business_profile
--   3. Quote acceptance feature columns on quotes

-- ============================================================
-- 1. DELIVERY NOTES
-- ============================================================

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

-- updated_at trigger for delivery_notes
drop trigger if exists delivery_notes_set_updated_at on public.delivery_notes;
create trigger delivery_notes_set_updated_at
before update on public.delivery_notes
for each row execute function public.set_updated_at();

-- RLS
alter table public.delivery_notes enable row level security;
alter table public.delivery_note_items enable row level security;

drop policy if exists "Authenticated full access delivery_notes" on public.delivery_notes;
create policy "Authenticated full access delivery_notes" on public.delivery_notes
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access delivery_note_items" on public.delivery_note_items;
create policy "Authenticated full access delivery_note_items" on public.delivery_note_items
  for all to authenticated using (true) with check (true);

-- ============================================================
-- 2. BUSINESS PROFILE — Document Numbering Columns
-- ============================================================

alter table public.business_profile
  add column if not exists invoice_prefix text not null default 'INV',
  add column if not exists invoice_starting_number integer not null default 1,
  add column if not exists invoice_include_year boolean not null default false,
  add column if not exists quote_prefix text not null default 'QT',
  add column if not exists quote_starting_number integer not null default 1,
  add column if not exists quote_include_year boolean not null default false,
  add column if not exists credit_note_prefix text not null default 'CN',
  add column if not exists credit_note_starting_number integer not null default 1,
  add column if not exists credit_note_include_year boolean not null default false,
  add column if not exists po_prefix text not null default 'PO',
  add column if not exists po_starting_number integer not null default 1,
  add column if not exists po_include_year boolean not null default false,
  add column if not exists cert_prefix text not null default 'CERT',
  add column if not exists cert_starting_number integer not null default 1,
  add column if not exists cert_include_year boolean not null default false,
  add column if not exists delivery_note_prefix text not null default 'DN',
  add column if not exists delivery_note_starting_number integer not null default 1,
  add column if not exists delivery_note_include_year boolean not null default false;

-- ============================================================
-- 3. QUOTES — Acceptance Feature Columns
-- ============================================================

alter table public.quotes
  add column if not exists acceptance_requested boolean not null default false,
  add column if not exists acceptance_status text check (acceptance_status in ('Pending', 'Accepted', 'Declined')) default 'Pending',
  add column if not exists accepted_at timestamptz,
  add column if not exists accepted_ip_address text,
  add column if not exists acceptance_record jsonb default '{}'::jsonb,
  add column if not exists decline_reason text;
