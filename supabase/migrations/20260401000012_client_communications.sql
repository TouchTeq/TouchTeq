-- Main client communications table
CREATE TABLE IF NOT EXISTS client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('email', 'call', 'meeting', 'site_visit', 'other')),
  subject TEXT NOT NULL,
  content TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  
  -- Contact info
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_role TEXT,
  
  -- Timing
  timestamp TIMESTAMPTZ DEFAULT now(),
  duration_minutes INTEGER,
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT false,
  
  -- Relationships
  quote_id UUID,
  invoice_id UUID,
  
  -- Metadata
  is_manual BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_client_comm_client ON client_communications(client_id);
CREATE INDEX idx_client_comm_timestamp ON client_communications(client_id, timestamp DESC);
CREATE INDEX idx_client_comm_type ON client_communications(client_id, type);
CREATE INDEX idx_client_comm_follow_up ON client_communications(client_id, follow_up_date)
  WHERE follow_up_required = true AND follow_up_completed = false;

-- Enable RLS
ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;

-- Simplified RLS policy (will be refined when clients table exists)
CREATE POLICY "Authenticated users can manage client communications"
  ON client_communications
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_client_comm_timestamp ON client_communications;
CREATE TRIGGER trigger_update_client_comm_timestamp
  BEFORE UPDATE ON client_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();