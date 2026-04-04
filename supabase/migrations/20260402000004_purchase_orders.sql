-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  po_number TEXT NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery DATE,
  
  -- Amounts
  subtotal NUMERIC(15,2) DEFAULT 0,
  vat_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Ordered', 'Partial', 'Received', 'Cancelled', 'Closed')),
  
  -- Line items stored as JSON
  line_items JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  notes TEXT,
  delivery_notes TEXT,
  
  -- Payment tracking
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_purchase_orders_user ON purchase_orders(user_id);
CREATE INDEX idx_purchase_orders_client ON purchase_orders(client_id);
CREATE INDEX idx_purchase_orders_number ON purchase_orders(user_id, po_number);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(user_id, status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(user_id, order_date);

-- Add unique constraint
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_number_unique UNIQUE (user_id, po_number);

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own purchase orders"
  ON purchase_orders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_purchase_order_timestamp ON purchase_orders;
CREATE TRIGGER trigger_update_purchase_order_timestamp
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();