-- Opening Balance Integration Migration
-- Adds settlement tracking and creates combined outstanding view

-- Add settlement tracking columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS opening_balance_settled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS opening_balance_settled_at timestamptz,
ADD COLUMN IF NOT EXISTS opening_balance_settled_note text;

-- Create a view that combines invoice balances and opening balances per client
CREATE OR REPLACE VIEW public.client_outstanding_summary AS
SELECT
  c.id AS client_id,
  c.company_name,
  c.opening_balance,
  c.opening_balance_settled,
  COALESCE(inv.invoice_balance, 0) AS invoice_balance,
  CASE
    WHEN c.opening_balance_settled THEN COALESCE(inv.invoice_balance, 0)
    ELSE COALESCE(inv.invoice_balance, 0) + COALESCE(c.opening_balance, 0)
  END AS total_outstanding
FROM public.clients c
LEFT JOIN (
  SELECT
    client_id,
    SUM(balance_due) AS invoice_balance
  FROM public.invoices
  WHERE status NOT IN ('Paid', 'Draft', 'Cancelled')
  GROUP BY client_id
) inv ON inv.client_id = c.id
WHERE c.is_active = true;

-- Enable RLS on the view
ALTER VIEW public.client_outstanding_summary OWNER TO postgres;