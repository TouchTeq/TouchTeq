-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  supplier_email TEXT,
  date_raised DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Acknowledged', 'Delivered', 'Cancelled')),
  linked_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  linked_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  notes TEXT,
  subtotal NUMERIC(15,2) DEFAULT 0,
  vat_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Line Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_orders
CREATE POLICY "Users can view purchase orders" ON purchase_orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert purchase orders" ON purchase_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update purchase orders" ON purchase_orders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete purchase orders" ON purchase_orders FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for purchase_order_items
CREATE POLICY "Users can view PO items" ON purchase_order_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert PO items" ON purchase_order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update PO items" ON purchase_order_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete PO items" ON purchase_order_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Function to auto-generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  next_num INT;
  year_str TEXT;
  new_number TEXT;
BEGIN
  year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(po_number FROM 10 FOR 4) AS INT
    )
  ), 0) + 1 INTO next_num
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || year_str || '-%';
  
  new_number := 'PO-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_name);
CREATE INDEX idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
