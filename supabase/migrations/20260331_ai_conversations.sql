-- ============================================================
-- AI Conversation Persistence
-- Enables saving/loading chat history with the AI assistant
-- across page refreshes, browser sessions, and devices.
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup of active conversation per user
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_active
  ON ai_conversations(user_id, is_active)
  WHERE is_active = true;

-- Index for listing conversations by date
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated
  ON ai_conversations(user_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS: users can only see and manage their own conversations
DROP POLICY IF EXISTS "Users manage own conversations" ON ai_conversations;
CREATE POLICY "Users manage own conversations"
  ON ai_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on each row update
CREATE OR REPLACE FUNCTION update_ai_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_conversation_timestamp ON ai_conversations;
CREATE TRIGGER trigger_update_ai_conversation_timestamp
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversation_timestamp();
