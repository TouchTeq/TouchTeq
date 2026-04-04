-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  quote_date DATE NOT NULL,
  valid_until DATE,
  
  -- Amounts
  subtotal NUMERIC(15,2) DEFAULT 0,
  vat_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Declined', 'Expired', 'Converted')),
  
  -- Line items stored as JSON
  line_items JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  notes TEXT,
  terms TEXT,
  
  -- Related
  converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_number ON quotes(user_id, quote_number);
CREATE INDEX idx_quotes_status ON quotes(user_id, status);
CREATE INDEX idx_quotes_valid_until ON quotes(user_id, valid_until);

-- Add unique constraint
ALTER TABLE quotes ADD CONSTRAINT quotes_number_unique UNIQUE (user_id, quote_number);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quotes"
  ON quotes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_quote_timestamp ON quotes;
CREATE TRIGGER trigger_update_quote_timestamp
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();