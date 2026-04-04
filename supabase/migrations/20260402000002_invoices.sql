-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal NUMERIC(15,2) DEFAULT 0,
  vat_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  balance_due NUMERIC(15,2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue', 'Void', 'Partial')),
  
  -- Line items stored as JSON
  line_items JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  notes TEXT,
  terms TEXT,
  
  -- Payment tracking
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_number ON invoices(user_id, invoice_number);
CREATE INDEX idx_invoices_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(user_id, due_date);

-- Add unique constraint
ALTER TABLE invoices ADD CONSTRAINT invoices_number_unique UNIQUE (user_id, invoice_number);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
  ON invoices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_invoice_timestamp ON invoices;
CREATE TRIGGER trigger_update_invoice_timestamp
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();