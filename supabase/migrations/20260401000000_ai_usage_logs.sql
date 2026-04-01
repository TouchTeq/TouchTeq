CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  model_used TEXT,
  tool_calls TEXT[] DEFAULT '{}',
  input_message_length INTEGER,
  output_message_length INTEGER,
  conversation_id TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  response_time_ms INTEGER
);

CREATE INDEX idx_ai_usage_logs_timestamp
  ON ai_usage_logs(timestamp DESC);

CREATE INDEX idx_ai_usage_logs_user
  ON ai_usage_logs(user_id, timestamp DESC);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage logs"
  ON ai_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs"
  ON ai_usage_logs
  FOR INSERT
  WITH CHECK (true);
