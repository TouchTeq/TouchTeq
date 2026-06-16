-- Migration: Smart Tax / Provisional-Tax Assistant (Feature B)
-- Date: 2026-06-16
--
-- Adds:
--   1. tax_settings   — single-row config for the business's tax profile
--   2. tax_estimates  — per-IRP6-period estimate snapshots
--
-- Income tax only (VAT is handled by the existing vat module).
-- Single-tenant RLS (mirrors invoices/credit_notes).

CREATE TABLE IF NOT EXISTS public.tax_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type             TEXT NOT NULL DEFAULT 'sole_proprietor'
                          CHECK (entity_type IN ('sole_proprietor', 'company', 'other')),
  is_provisional_taxpayer BOOLEAN NOT NULL DEFAULT TRUE,
  age_band                TEXT NOT NULL DEFAULT 'under_65'
                          CHECK (age_band IN ('under_65', '65_to_74', '75_plus')),
  set_aside_pct_override  NUMERIC(5,2),            -- optional manual override of the computed rate
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tax_estimates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year          TEXT NOT NULL,                 -- e.g. '2026/2027'
  period            TEXT NOT NULL CHECK (period IN ('P1', 'P2', 'P3', 'annual')),
  taxable_income    NUMERIC(15,2) NOT NULL DEFAULT 0,
  estimated_tax     NUMERIC(15,2) NOT NULL DEFAULT 0,
  already_set_aside NUMERIC(15,2) NOT NULL DEFAULT 0,
  due_date          DATE,
  status            TEXT NOT NULL DEFAULT 'projected'
                    CHECK (status IN ('projected', 'filed', 'paid')),
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tax_year, period)
);

ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_estimates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tax_settings' AND policyname = 'Users can view tax settings') THEN
    CREATE POLICY "Users can view tax settings"   ON public.tax_settings FOR SELECT USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can insert tax settings" ON public.tax_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can update tax settings" ON public.tax_settings FOR UPDATE USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can delete tax settings" ON public.tax_settings FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tax_estimates' AND policyname = 'Users can view tax estimates') THEN
    CREATE POLICY "Users can view tax estimates"   ON public.tax_estimates FOR SELECT USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can insert tax estimates" ON public.tax_estimates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can update tax estimates" ON public.tax_estimates FOR UPDATE USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can delete tax estimates" ON public.tax_estimates FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

COMMENT ON TABLE public.tax_settings IS 'Single-row tax profile for the business (Feature B).';
COMMENT ON TABLE public.tax_estimates IS 'Provisional-tax (IRP6) estimate snapshots per period.';
