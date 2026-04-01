-- Production Readiness: Fix RLS policies for ai_rate_limits and ai_usage_logs
-- Addresses audit findings: rate limits bypass and unauthenticated log insertion

-- 1. Fix ai_rate_limits — only service_role can manage rate limits
DROP POLICY IF EXISTS "System can manage rate limits" ON public.ai_rate_limits;

CREATE POLICY "Service role manages rate limits"
  ON public.ai_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Fix ai_usage_logs — only service_role can insert usage logs
DROP POLICY IF EXISTS "System can insert usage logs" ON public.ai_usage_logs;

CREATE POLICY "Service role inserts usage logs"
  ON public.ai_usage_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);
