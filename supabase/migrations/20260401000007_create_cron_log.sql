-- Production Readiness: Create cron_log table for idempotency tracking
CREATE TABLE IF NOT EXISTS public.cron_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  result jsonb,
  duration_ms integer
);

CREATE INDEX IF NOT EXISTS cron_log_ran_at_idx ON public.cron_log (ran_at DESC);

ALTER TABLE public.cron_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages cron log"
  ON public.cron_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
