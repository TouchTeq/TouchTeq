-- Main calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'appointment' CHECK (event_type IN ('appointment', 'meeting', 'site_visit', 'deadline', 'reminder', 'travel', 'other')),
  
  -- Timing
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  
  -- Location
  location TEXT,
  
  -- Relationships (FK constraints added when referenced tables exist)
  client_id UUID,
  task_id UUID,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurring_until DATE,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  
  -- Metadata
  colour TEXT DEFAULT '#3B82F6',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_calendar_user_date ON calendar_events(user_id, start_date);
CREATE INDEX idx_calendar_user_upcoming ON calendar_events(user_id, start_date, start_time) WHERE status = 'scheduled';
CREATE INDEX idx_calendar_client ON calendar_events(client_id) WHERE client_id IS NOT NULL;

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own events"
  ON calendar_events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_calendar_event_timestamp ON calendar_events;
CREATE TRIGGER trigger_update_calendar_event_timestamp
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();