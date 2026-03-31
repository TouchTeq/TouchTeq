-- AI Memory Table
-- Stores persistent knowledge the AI learns during conversations

create table if not exists public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  key text not null,
  value text not null,
  confidence numeric(3,2) not null default 1.0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ai_memory_category_idx on public.ai_memory (category);
create index if not exists ai_memory_key_idx on public.ai_memory (key);
create unique index if not exists ai_memory_category_key_uq on public.ai_memory (category, key);

alter table public.ai_memory enable row level security;

drop policy if exists "Authenticated full access ai_memory" on public.ai_memory;
create policy "Authenticated full access ai_memory" on public.ai_memory
  for all to authenticated using (true) with check (true);

create or replace function public.ai_memory_set_last_updated()
returns trigger language plpgsql as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

drop trigger if exists ai_memory_set_last_updated on public.ai_memory;
create trigger ai_memory_set_last_updated
before update on public.ai_memory
for each row execute function public.ai_memory_set_last_updated();
