-- Backfill client_contacts from legacy contact_person / phone columns on clients table
-- Only inserts where a real contact_person exists (not null, not empty, not 'N/A')
-- Skips clients that already have at least one client_contacts row (idempotent)

INSERT INTO public.client_contacts (client_id, contact_type, full_name, cell_number, is_primary)
SELECT
  c.id,
  'General',
  c.contact_person,
  c.phone,
  true
FROM public.clients c
WHERE c.contact_person IS NOT NULL
  AND trim(c.contact_person) <> ''
  AND upper(trim(c.contact_person)) <> 'N/A'
  AND NOT EXISTS (
    SELECT 1 FROM public.client_contacts cc WHERE cc.client_id = c.id
  )
ON CONFLICT DO NOTHING;
