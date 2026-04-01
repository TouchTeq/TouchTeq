-- AI Action Log: persistent audit trail for all AI assistant actions
-- Tracks every tool invocation, attempt, result, and verification outcome

CREATE TABLE IF NOT EXISTS public.ai_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Who and context
  user_id uuid,
  conversation_id text,
  user_message text,
  normalized_intent text,
  
  -- What tool was called
  tool_name text NOT NULL,
  tool_args jsonb DEFAULT '{}'::jsonb,
  
  -- What was targeted
  target_type text,
  target_id text,
  target_reference text,
  
  -- Outcome
  action_status text NOT NULL, -- confirmed, failed, need_info, unsupported, could_not_verify, attempted
  attempted boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  verification_details jsonb DEFAULT '{}'::jsonb,
  error_message text,
  next_step text,
  
  -- Raw data for debugging (truncated if too large)
  raw_tool_result jsonb DEFAULT '{}'::jsonb,
  
  -- System context
  model_name text,
  latency_ms integer,
  request_source text DEFAULT 'chat',
  
  -- Summary for quick scanning
  summary text
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS ai_action_log_user_id_idx ON public.ai_action_log (user_id);
CREATE INDEX IF NOT EXISTS ai_action_log_created_at_idx ON public.ai_action_log (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_action_log_tool_name_idx ON public.ai_action_log (tool_name);
CREATE INDEX IF NOT EXISTS ai_action_log_action_status_idx ON public.ai_action_log (action_status);
CREATE INDEX IF NOT EXISTS ai_action_log_target_type_idx ON public.ai_action_log (target_type, target_reference);
CREATE INDEX IF NOT EXISTS ai_action_log_conversation_id_idx ON public.ai_action_log (conversation_id);

-- Enable RLS
ALTER TABLE public.ai_action_log ENABLE ROW LEVEL SECURITY;

-- Service role can insert (for AI logging), authenticated users can read their own logs
CREATE POLICY "Service role can insert AI action logs"
  ON public.ai_action_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read their own AI action logs"
  ON public.ai_action_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can read AI action logs"
  ON public.ai_action_log
  FOR SELECT
  TO service_role
  USING (true);