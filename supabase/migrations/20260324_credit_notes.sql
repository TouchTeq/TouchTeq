-- Credit Notes Table
CREATE TABLE IF NOT EXISTS credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number TEXT UNIQUE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Applied')),
  reason TEXT CHECK (reason IN ('Incorrect Amount', 'Returned Equipment', 'Disputed Charges', 'Duplicate Invoice', 'Other')),
  subtotal NUMERIC(15,2) DEFAULT 0,
  vat_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Note Line Items Table
CREATE TABLE IF NOT EXISTS credit_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID REFERENCES credit_notes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(15,2) DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 15,
  line_total NUMERIC(15,2) DEFAULT 0,
  invoice_item_id UUID REFERENCES invoice_line_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add credit_note_id to invoices table to track credit status
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS credit_note_id UUID REFERENCES credit_notes(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS credit_status TEXT DEFAULT 'None' CHECK (credit_status IN ('None', 'Partially Credited', 'Fully Credited'));

-- Enable RLS
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_notes
CREATE POLICY "Users can view credit notes" ON credit_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert credit notes" ON credit_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update credit notes" ON credit_notes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE Policy "Users can delete credit notes" ON credit_notes FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for credit_note_items
CREATE POLICY "Users can view credit note items" ON credit_note_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert credit note items" ON credit_note_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update credit note items" ON credit_note_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete credit note items" ON credit_note_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Function to auto-generate credit note number
CREATE OR REPLACE FUNCTION generate_credit_note_number()
RETURNS TEXT AS $$
DECLARE
  next_num INT;
  year_str TEXT;
  new_number TEXT;
BEGIN
  year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(credit_note_number FROM 10 FOR 4) AS INT
    )
  ), 0) + 1 INTO next_num
  FROM credit_notes
  WHERE credit_note_number LIKE 'CN-' || year_str || '-%';
  
  new_number := 'CN-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_credit_notes_invoice_id ON credit_notes(invoice_id);
CREATE INDEX idx_credit_notes_client_id ON credit_notes(client_id);
CREATE INDEX idx_credit_notes_status ON credit_notes(status);
CREATE INDEX idx_credit_note_items_credit_note_id ON credit_note_items(credit_note_id);
