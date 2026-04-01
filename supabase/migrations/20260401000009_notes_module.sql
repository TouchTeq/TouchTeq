-- Main notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'meeting', 'site_visit', 'quick')),
  
  -- Structured fields for specific note types
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound')),
  meeting_attendees TEXT[],
  site_name TEXT,
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  follow_up_completed BOOLEAN DEFAULT false,
  
  -- Relationships (FK constraints added when referenced tables exist)
  client_id UUID,
  invoice_id UUID,
  quote_id UUID,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Tags and search
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notes_user_type ON notes(user_id, note_type);
CREATE INDEX idx_notes_user_created ON notes(user_id, created_at DESC);
CREATE INDEX idx_notes_user_pinned ON notes(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_notes_client ON notes(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_notes_follow_up ON notes(user_id, follow_up_date)
  WHERE follow_up_required = true AND follow_up_completed = false;

-- Full text search index on content and title
CREATE INDEX idx_notes_search ON notes USING gin(to_tsvector('english', coalesce(title, '') || ' ' || content));

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes"
  ON notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_note_timestamp ON notes;
CREATE TRIGGER trigger_update_note_timestamp
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
