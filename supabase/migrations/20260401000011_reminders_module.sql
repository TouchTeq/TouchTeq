-- Main reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Timing
  reminder_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'cancelled', 'missed')),
  
  -- Type
  reminder_type TEXT NOT NULL DEFAULT 'custom' CHECK (reminder_type IN ('task', 'follow_up', 'meeting', 'call', 'custom')),
  
  -- Relationships (FK constraints added when referenced tables exist)
  related_type TEXT,
  related_id UUID,
  client_id UUID,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurring_end_date DATE,
  
  -- Snooze tracking
  snoozed_until TIMESTAMPTZ,
  snooze_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reminders_user_status ON reminders(user_id, status);
CREATE INDEX idx_reminders_user_date ON reminders(user_id, reminder_at);
CREATE INDEX idx_reminders_pending ON reminders(user_id, reminder_at) WHERE status = 'pending';
CREATE INDEX idx_reminders_client ON reminders(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_reminders_task ON reminders(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_reminders_note ON reminders(note_id) WHERE note_id IS NOT NULL;
CREATE INDEX idx_reminders_created ON reminders(created_at DESC);

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders"
  ON reminders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_reminder_timestamp ON reminders;
CREATE TRIGGER trigger_update_reminder_timestamp
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();