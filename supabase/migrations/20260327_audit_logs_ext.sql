-- Add support for Purchase Orders and Credit Notes in audit logs
ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS cn_id UUID REFERENCES credit_notes(id) ON DELETE SET NULL;
ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
