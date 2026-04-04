-- Automated invoice reminder logs table
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  reminder_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Cancelled')),
  sent_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Recipient info
  recipient_email TEXT,
  recipient_name TEXT,
  
  -- Message
  subject TEXT,
  body TEXT,
  
  -- Tracking
  is_manual BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reminder_logs_invoice ON reminder_logs(invoice_id);
CREATE INDEX idx_reminder_logs_sent ON reminder_logs(sent_at DESC);
CREATE INDEX idx_reminder_logs_status ON reminder_logs(status);

-- Enable RLS
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminder logs"
  ON reminder_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = reminder_logs.invoice_id
      AND i.user_id = auth.uid()
    )
    OR auth.role() = 'authenticated'
  );

CREATE POLICY "Users can insert reminder logs"
  ON reminder_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');