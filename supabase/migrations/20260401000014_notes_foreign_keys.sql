-- Fix missing foreign key constraints for notes table
-- The notes.client_id column references clients(id) but has no FK constraint,
-- which breaks Supabase's embedded relationship queries (e.g. client:clients(company_name))

ALTER TABLE notes
  ADD CONSTRAINT notes_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Also add FK for invoice_id and quote_id if those tables exist
-- (these are deferred until the referenced tables are confirmed to exist)
-- If they already have FKs, these will be no-ops due to IF NOT EXISTS pattern
DO $$
BEGIN
  -- invoice_id FK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_invoice_id_fkey'
  ) THEN
    ALTER TABLE notes
      ADD CONSTRAINT notes_invoice_id_fkey
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
  END IF;

  -- quote_id FK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_quote_id_fkey'
  ) THEN
    ALTER TABLE notes
      ADD CONSTRAINT notes_quote_id_fkey
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;
  END IF;
END $$;
