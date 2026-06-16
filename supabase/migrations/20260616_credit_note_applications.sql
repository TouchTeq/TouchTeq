-- Migration: credit_note_applications ledger (Credit Note → Invoice application)
-- Date: 2026-06-16
--
-- The original apply/cancel credit-note RPCs (finance_integrity / finance_hardening)
-- never applied to the live DB and were unusable anyway: they required status
-- 'Issued' (not in the credit_notes status set), and depended on tables/columns
-- that don't exist. Apply/cancel is reimplemented as direct-write server actions
-- (lib/office/creditNoteActions.ts); this table is the only schema it needs — an
-- auditable ledger so an application can be reversed.

CREATE TABLE IF NOT EXISTS public.credit_note_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id  UUID NOT NULL REFERENCES public.credit_notes(id) ON DELETE CASCADE,
  invoice_id      UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  applied_amount  NUMERIC(15,2) NOT NULL,
  applied_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (credit_note_id)   -- a credit note can only be applied once
);

CREATE INDEX IF NOT EXISTS idx_credit_note_applications_invoice_id ON public.credit_note_applications(invoice_id);

ALTER TABLE public.credit_note_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_note_applications' AND policyname = 'Users can view credit note applications') THEN
    CREATE POLICY "Users can view credit note applications"   ON public.credit_note_applications FOR SELECT USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can insert credit note applications" ON public.credit_note_applications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can delete credit note applications" ON public.credit_note_applications FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

COMMENT ON TABLE public.credit_note_applications IS 'Ledger of credit-note-to-invoice applications (one per credit note); enables reversal.';
