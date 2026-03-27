-- Add recurring invoice fields to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_frequency TEXT CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'annually'));
ALTER TABLE IF EXISTS invoices ADD COLUMN IF NOT EXISTS recurring_start_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_end_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_auto_send BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_next_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_parent_id UUID REFERENCES invoices(id);

-- Create index for finding due recurring invoices
CREATE INDEX IF NOT EXISTS idx_invoices_recurring ON invoices(is_recurring, recurring_next_date) WHERE is_recurring = TRUE;

-- Add notification table for recurring invoice events
CREATE TABLE IF NOT EXISTS invoice_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
