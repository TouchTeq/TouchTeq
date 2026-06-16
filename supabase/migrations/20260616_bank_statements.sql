-- Migration: Bank / Financial-Statement Import & Reconciliation (Feature A, phases 1-2)
-- Date: 2026-06-16
--
-- Adds:
--   1. statement_imports  — one row per uploaded statement (batch)
--   2. bank_transactions  — parsed transaction lines, with reconciliation state
--
-- Single-tenant RLS (mirrors invoices/credit_notes: any authenticated user).

-- ============================================================
-- statement_imports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.statement_imports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT NOT NULL DEFAULT 'csv' CHECK (source IN ('csv', 'ofx', 'pdf')),
  bank_name     TEXT,
  account_label TEXT,
  file_name     TEXT,
  row_count     INT NOT NULL DEFAULT 0,
  matched_count INT NOT NULL DEFAULT 0,
  date_from     DATE,
  date_to       DATE,
  status        TEXT NOT NULL DEFAULT 'imported'
                CHECK (status IN ('imported', 'reconciling', 'reconciled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- bank_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id       UUID REFERENCES public.statement_imports(id) ON DELETE CASCADE,
  txn_date        DATE NOT NULL,
  description     TEXT,
  reference       TEXT,
  amount          NUMERIC(15,2) NOT NULL,          -- signed: +in / -out
  direction       TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  running_balance NUMERIC(15,2),
  -- reconciliation
  status          TEXT NOT NULL DEFAULT 'unmatched'
                  CHECK (status IN ('unmatched', 'suggested', 'matched', 'ignored')),
  matched_type    TEXT CHECK (matched_type IN ('invoice', 'expense', 'payment')),
  matched_id      UUID,
  match_confidence NUMERIC(5,2),                    -- 0..100
  dedupe_hash     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent re-imports: identical line (date|amount|description|balance) is skipped
CREATE UNIQUE INDEX IF NOT EXISTS bank_txn_dedupe_uq ON public.bank_transactions(dedupe_hash);
CREATE INDEX IF NOT EXISTS bank_txn_import_idx ON public.bank_transactions(import_id);
CREATE INDEX IF NOT EXISTS bank_txn_status_idx ON public.bank_transactions(status);
CREATE INDEX IF NOT EXISTS bank_txn_date_idx ON public.bank_transactions(txn_date);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.statement_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'statement_imports' AND policyname = 'Users can view statement imports') THEN
    CREATE POLICY "Users can view statement imports"   ON public.statement_imports FOR SELECT USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can insert statement imports" ON public.statement_imports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can update statement imports" ON public.statement_imports FOR UPDATE USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can delete statement imports" ON public.statement_imports FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bank_transactions' AND policyname = 'Users can view bank transactions') THEN
    CREATE POLICY "Users can view bank transactions"   ON public.bank_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can insert bank transactions" ON public.bank_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can update bank transactions" ON public.bank_transactions FOR UPDATE USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can delete bank transactions" ON public.bank_transactions FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

COMMENT ON TABLE public.statement_imports IS 'Bank statement upload batches (Feature A).';
COMMENT ON TABLE public.bank_transactions IS 'Parsed statement lines with reconciliation state. dedupe_hash makes re-imports idempotent.';
