-- AI Conversations: persistent conversation history for the AI assistant
-- Enables cross-device continuity, conversation review, and debugging

-- 1. ai_conversations - top-level conversation records
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  source text DEFAULT 'chat',
  context jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON public.ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_updated_at_idx ON public.ai_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS ai_conversations_archived_idx ON public.ai_conversations (user_id, archived_at) WHERE archived_at IS NULL;

-- 2. ai_conversation_messages - individual messages within a conversation
CREATE TABLE IF NOT EXISTS public.ai_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text NOT NULL,
  message_order integer NOT NULL,
  tool_name text,
  structured_status jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_conversation_messages_conv_idx ON public.ai_conversation_messages (conversation_id, message_order);
CREATE INDEX IF NOT EXISTS ai_conversation_messages_role_idx ON public.ai_conversation_messages (conversation_id, role);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversation_messages ENABLE ROW LEVEL SECURITY;

-- Policies for ai_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.ai_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.ai_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.ai_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all conversations"
  ON public.ai_conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies for ai_conversation_messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.ai_conversation_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages into their conversations"
  ON public.ai_conversation_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all messages"
  ON public.ai_conversation_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);