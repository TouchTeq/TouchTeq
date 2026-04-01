-- AI Tool Telemetry: structured execution telemetry for debugging and analytics
-- Captures tool selection, execution, verification, and latency data

CREATE TABLE IF NOT EXISTS public.ai_tool_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Context
  request_id text,
  conversation_id text,
  user_id uuid,
  
  -- Tool info
  model_name text,
  tool_name text,
  tool_phase text,  -- selection, execution, verification, response, complete
  
  -- Timing
  started_at bigint,
  completed_at bigint,
  latency_ms integer,
  
  -- Outcome
  success boolean,
  error_type text,  -- validation_error, lookup_error, ambiguous_match, db_error, verification_failed, client_ack_timeout, unsupported_action, conflict_error, timeout_error, unknown_error
  error_message text,
  
  -- Match info
  ambiguous_match_count integer DEFAULT 0,
  matched_record_count integer DEFAULT 0,
  
  -- Verification
  verification_status text DEFAULT 'not_applicable',  -- confirmed, could_not_verify, failed, not_applicable
  
  -- Client ack
  client_ack_status text DEFAULT 'not_applicable',  -- success, timeout, failed, not_applicable
  
  -- Summary
  summary text
);

CREATE INDEX IF NOT EXISTS ai_tool_telemetry_request_id_idx ON public.ai_tool_telemetry (request_id);
CREATE INDEX IF NOT EXISTS ai_tool_telemetry_user_id_idx ON public.ai_tool_telemetry (user_id);
CREATE INDEX IF NOT EXISTS ai_tool_telemetry_tool_name_idx ON public.ai_tool_telemetry (tool_name);
CREATE INDEX IF NOT EXISTS ai_tool_telemetry_error_type_idx ON public.ai_tool_telemetry (error_type) WHERE error_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_tool_telemetry_created_at_idx ON public.ai_tool_telemetry (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_tool_telemetry_latency_idx ON public.ai_tool_telemetry (latency_ms DESC) WHERE latency_ms IS NOT NULL;

-- Enable RLS
ALTER TABLE public.ai_tool_telemetry ENABLE ROW LEVEL SECURITY;

-- Service role can insert telemetry
CREATE POLICY "Service role can insert telemetry"
  ON public.ai_tool_telemetry
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users can read their own telemetry
CREATE POLICY "Users can read own telemetry"
  ON public.ai_tool_telemetry
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can read all telemetry
CREATE POLICY "Service role can read all telemetry"
  ON public.ai_tool_telemetry
  FOR SELECT
  TO service_role
  USING (true);