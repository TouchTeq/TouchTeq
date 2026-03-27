-- Touch Teq Office: client contacts (multiple per client)

create extension if not exists "pgcrypto";

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

create index if not exists client_contacts_client_id_idx
  on public.client_contacts (client_id);

-- Enforce a single primary contact per client at the DB level.
create unique index if not exists client_contacts_one_primary_per_client
  on public.client_contacts (client_id)
  where is_primary;

alter table public.client_contacts enable row level security;

-- Full read/write for any authenticated user. No public access.
create policy "Authenticated full access"
  on public.client_contacts
  for all
  to authenticated
  using (true)
  with check (true);
