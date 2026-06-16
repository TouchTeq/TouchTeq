-- Migration: Repair convert_quote_to_invoice (+ reverse) for the live DB
-- Date: 2026-06-16
--
-- The original 20260331_quote_to_invoice_conversion.sql never applied to the
-- live DB and referenced business_profile.invoice_payment_terms_days, which does
-- not exist (the real column is payment_terms_days). This recreates the linkage
-- columns and both functions, corrected.
--
-- PREREQUISITE: run 20260331_add_qty_type_to_line_items.sql first, since the
-- conversion copies quote_line_items.qty_type into invoice_line_items.

-- Linkage columns (idempotent)
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS converted_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_converted_invoice_id ON public.quotes(converted_invoice_id);

CREATE OR REPLACE FUNCTION public.convert_quote_to_invoice(
  p_quote_id        UUID,
  p_payment_days    INTEGER DEFAULT NULL,
  p_notes           TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_quote           RECORD;
  v_invoice_id      UUID;
  v_invoice_number  TEXT;
  v_payment_terms   INTEGER;
  v_due_date        DATE;
  v_item_count      INTEGER := 0;
  v_vat_amount      NUMERIC;
BEGIN
  SELECT
    q.id, q.quote_number, q.client_id, q.status,
    q.subtotal, q.vat_amount, q.total, q.notes,
    q.converted_invoice_id, q.expiry_date,
    c.company_name AS client_name
  INTO v_quote
  FROM public.quotes q
  LEFT JOIN public.clients c ON q.client_id = c.id
  WHERE q.id = p_quote_id
  FOR UPDATE;

  IF v_quote.id IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  IF v_quote.status NOT IN ('Accepted', 'Sent', 'Issued') THEN
    RAISE EXCEPTION 'Quote % is in status "%" and cannot be converted. Only Accepted, Sent, or Issued quotes can be converted.',
      v_quote.quote_number, v_quote.status;
  END IF;

  IF v_quote.converted_invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'Quote % has already been converted to an invoice.', v_quote.quote_number;
  END IF;

  SELECT COUNT(*) INTO v_item_count
  FROM public.quote_line_items
  WHERE quote_id = p_quote_id;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Quote % has no line items and cannot be converted.', v_quote.quote_number;
  END IF;

  IF v_quote.client_id IS NULL THEN
    RAISE EXCEPTION 'Quote % has no client linked.', v_quote.quote_number;
  END IF;

  IF p_payment_days IS NOT NULL THEN
    v_payment_terms := p_payment_days;
  ELSE
    SELECT COALESCE(payment_terms_days, 30) INTO v_payment_terms
    FROM public.business_profile LIMIT 1;
  END IF;

  v_due_date := CURRENT_DATE + (v_payment_terms || ' days')::INTERVAL;
  v_vat_amount := v_quote.vat_amount;
  v_invoice_number := public.generate_invoice_number();

  INSERT INTO public.invoices (
    invoice_number, client_id, quote_id,
    issue_date, due_date, status,
    subtotal, vat_amount, total, amount_paid, balance_due,
    notes, internal_notes
  )
  VALUES (
    v_invoice_number, v_quote.client_id, v_quote.id,
    CURRENT_DATE, v_due_date, 'Draft',
    v_quote.subtotal, v_vat_amount, v_quote.total, 0, v_quote.total,
    COALESCE(p_notes, 'Converted from quote ' || v_quote.quote_number),
    'Converted from quote ' || v_quote.quote_number || ' on ' || CURRENT_DATE
  )
  RETURNING id INTO v_invoice_id;

  INSERT INTO public.invoice_line_items (
    invoice_id, description, quantity, unit_price,
    line_total, sort_order, qty_type, vat_rate
  )
  SELECT
    v_invoice_id,
    qli.description,
    qli.quantity,
    qli.unit_price,
    qli.line_total,
    COALESCE(qli.sort_order, 0),
    COALESCE(qli.qty_type, 'qty'),
    COALESCE(qli.vat_rate, 15)
  FROM public.quote_line_items qli
  WHERE qli.quote_id = p_quote_id
  ORDER BY COALESCE(qli.sort_order, 0);

  UPDATE public.quotes
  SET status = 'Converted',
      converted_invoice_id = v_invoice_id,
      updated_at = NOW()
  WHERE id = p_quote_id;

  RETURN JSONB_BUILD_OBJECT(
    'success', TRUE,
    'quote_id', v_quote.id,
    'quote_number', v_quote.quote_number,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'client_id', v_quote.client_id,
    'client_name', v_quote.client_name,
    'subtotal', v_quote.subtotal,
    'vat_amount', v_vat_amount,
    'total', v_quote.total,
    'due_date', v_due_date,
    'payment_terms_days', v_payment_terms,
    'line_item_count', v_item_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_quote_conversion(
  p_quote_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_quote           RECORD;
  v_invoice         RECORD;
  v_payment_count   INTEGER;
BEGIN
  SELECT id, quote_number, status, converted_invoice_id
  INTO v_quote
  FROM public.quotes
  WHERE id = p_quote_id
  FOR UPDATE;

  IF v_quote.id IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  IF v_quote.status != 'Converted' THEN
    RAISE EXCEPTION 'Quote % is not in Converted status.', v_quote.quote_number;
  END IF;

  IF v_quote.converted_invoice_id IS NULL THEN
    RAISE EXCEPTION 'Quote % has no linked invoice to reverse.', v_quote.quote_number;
  END IF;

  SELECT id, invoice_number, status, amount_paid
  INTO v_invoice
  FROM public.invoices
  WHERE id = v_quote.converted_invoice_id
  FOR UPDATE;

  SELECT COUNT(*) INTO v_payment_count
  FROM public.payments
  WHERE invoice_id = v_invoice.id;

  IF v_payment_count > 0 THEN
    RAISE EXCEPTION 'Cannot reverse conversion: Invoice % has % payment(s). Void the invoice or issue a credit note instead.',
      v_invoice.invoice_number, v_payment_count;
  END IF;

  IF v_invoice.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Cannot reverse conversion: Invoice % is cancelled.', v_invoice.invoice_number;
  END IF;

  DELETE FROM public.invoices WHERE id = v_invoice.id;

  UPDATE public.quotes
  SET status = 'Accepted',
      converted_invoice_id = NULL,
      updated_at = NOW()
  WHERE id = p_quote_id;

  RETURN JSONB_BUILD_OBJECT(
    'success', TRUE,
    'quote_number', v_quote.quote_number,
    'invoice_number', v_invoice.invoice_number,
    'message', 'Conversion reversed. Invoice ' || v_invoice.invoice_number || ' deleted.'
  );
END;
$$;
