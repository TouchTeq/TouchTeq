CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 1,
  UNIQUE(user_id, window_start)
);

CREATE INDEX idx_ai_rate_limits_user_window
  ON ai_rate_limits(user_id, window_start DESC);

ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits"
  ON ai_rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);
