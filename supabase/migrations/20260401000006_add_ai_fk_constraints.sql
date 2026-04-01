-- Production Readiness: Add foreign key constraints to AI tables
-- Ensures referential integrity between AI tables and auth.users

-- 1. ai_action_log user_id FK
ALTER TABLE public.ai_action_log
  ADD CONSTRAINT ai_action_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. ai_conversations user_id FK
ALTER TABLE public.ai_conversations
  ADD CONSTRAINT ai_conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. ai_tool_telemetry user_id FK
ALTER TABLE public.ai_tool_telemetry
  ADD CONSTRAINT ai_tool_telemetry_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
