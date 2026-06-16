-- Migration: Sales Orders module
-- Date: 2026-06-16
--
-- Adds the customer-facing Sales Order document that sits between an accepted
-- quote and the invoice (Sage flow: Quote → Sales Order → Invoice).
--
-- Tables + linkage columns only (no PL/pgSQL functions) — all create/update/
-- convert logic lives in server actions (lib/sales-orders/actions.ts), matching
-- the app's current direct-write approach for invoices.

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_number               TEXT UNIQUE NOT NULL,
  client_id               UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  quote_id                UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  order_date              DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date  DATE,
  status                  TEXT NOT NULL DEFAULT 'Draft'
                          CHECK (status IN ('Draft', 'Confirmed', 'Partially Invoiced', 'Invoiced', 'Cancelled')),
  subtotal                NUMERIC(15,2) NOT NULL DEFAULT 0,
  vat_amount              NUMERIC(15,2) NOT NULL DEFAULT 0,
  total                   NUMERIC(15,2) NOT NULL DEFAULT 0,
  invoiced_total          NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes                   TEXT,
  internal_notes          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id  UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(15,2) NOT NULL DEFAULT 0,
  vat_rate        NUMERIC(5,2) NOT NULL DEFAULT 15,
  qty_type        TEXT NOT NULL DEFAULT 'qty',
  line_total      NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Linkage: invoice → source sales order, quote → resulting sales order
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE SET NULL;
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS converted_sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_orders_client_id ON public.sales_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_quote_id ON public.sales_orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_so_id ON public.sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sales_order_id ON public.invoices(sales_order_id);

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_orders' AND policyname = 'Users can view sales orders') THEN
    CREATE POLICY "Users can view sales orders"   ON public.sales_orders FOR SELECT USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can insert sales orders" ON public.sales_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can update sales orders" ON public.sales_orders FOR UPDATE USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can delete sales orders" ON public.sales_orders FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_order_items' AND policyname = 'Users can view sales order items') THEN
    CREATE POLICY "Users can view sales order items"   ON public.sales_order_items FOR SELECT USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can insert sales order items" ON public.sales_order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can update sales order items" ON public.sales_order_items FOR UPDATE USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Users can delete sales order items" ON public.sales_order_items FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

COMMENT ON TABLE public.sales_orders IS 'Customer-facing confirmed orders (Quote → Sales Order → Invoice).';
