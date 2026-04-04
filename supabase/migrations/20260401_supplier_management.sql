-- ============================================================
-- Lightweight Supplier Management
-- Adds supplier_id FK to purchase_orders linking to clients table
-- Suppliers are clients with category = 'Supplier'
-- ============================================================

-- Add supplier_id column to purchase_orders
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_clients_category ON clients(category) WHERE category IS NOT NULL;

-- Update the create_purchase_order_with_items RPC to accept supplier_id
CREATE OR REPLACE FUNCTION create_purchase_order_with_items(
  p_supplier_name TEXT,
  p_line_items JSONB,
  p_notes TEXT DEFAULT NULL,
  p_date_raised DATE DEFAULT NULL,
  p_status TEXT DEFAULT 'Draft',
  p_supplier_contact TEXT DEFAULT NULL,
  p_supplier_email TEXT DEFAULT NULL,
  p_delivery_date DATE DEFAULT NULL,
  p_linked_quote_id UUID DEFAULT NULL,
  p_linked_invoice_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  document_number TEXT,
  supplier_name TEXT,
  subtotal NUMERIC,
  vat_amount NUMERIC,
  total NUMERIC,
  status TEXT,
  line_item_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_po RECORD;
  v_count BIGINT;
  v_po_number TEXT;
  v_subtotal NUMERIC := 0;
  v_vat_amount NUMERIC := 0;
  v_total NUMERIC := 0;
BEGIN
  -- Generate PO number
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER)), 0) + 1 INTO v_count
  FROM purchase_orders
  WHERE po_number ~ '^PO-\d+$';

  v_po_number := 'PO-' || LPAD(v_count::TEXT, 4, '0');

  -- Calculate totals
  SELECT
    COALESCE(SUM((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC), 0)
  INTO v_subtotal
  FROM jsonb_array_elements(p_line_items) AS item;

  v_vat_amount := v_subtotal * 0.15;
  v_total := v_subtotal + v_vat_amount;

  -- Insert PO header
  INSERT INTO purchase_orders (
    po_number, supplier_name, supplier_contact, supplier_email,
    date_raised, delivery_date, status, notes,
    subtotal, vat_amount, total,
    linked_quote_id, linked_invoice_id, supplier_id
  ) VALUES (
    v_po_number, p_supplier_name, p_supplier_contact, p_supplier_email,
    COALESCE(p_date_raised, CURRENT_DATE), p_delivery_date, p_status, p_notes,
    v_subtotal, v_vat_amount, v_total,
    p_linked_quote_id, p_linked_invoice_id, p_supplier_id
  )
  RETURNING * INTO v_po;

  -- Insert line items
  INSERT INTO purchase_order_items (purchase_order_id, description, quantity, unit_price, line_total)
  SELECT
    v_po.id,
    item->>'description',
    COALESCE((item->>'quantity')::NUMERIC, 1),
    COALESCE((item->>'unit_price')::NUMERIC, 0),
    COALESCE((item->>'quantity')::NUMERIC, 1) * COALESCE((item->>'unit_price')::NUMERIC, 0)
  FROM jsonb_array_elements(p_line_items) AS item;

  -- Return result
  RETURN QUERY
  SELECT
    v_po.id,
    v_po.po_number AS document_number,
    v_po.supplier_name,
    v_po.subtotal,
    v_po.vat_amount,
    v_po.total,
    v_po.status,
    (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = v_po.id) AS line_item_count;
END;
$$;